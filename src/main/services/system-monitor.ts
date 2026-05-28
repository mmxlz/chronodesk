import { BrowserWindow, app } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../renderer/types/monitor'
import { exec, spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null
let lhmProcess: ChildProcess | null = null
let lhmSensorPath: string | null = null

// Find bundled LHM directory
function getLhmDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(__dirname, '..', '..', '..', 'build', 'lhm')
  }
  return path.join(process.resourcesPath, 'lhm')
}

// Start LHM sensor reader PowerShell script with admin
function startLhmSensor(): Promise<boolean> {
  return new Promise((resolve) => {
    const lhmDir = getLhmDir()
    const scriptPath = path.join(lhmDir, 'lhm-sensor.ps1')

    if (!fs.existsSync(scriptPath)) {
      console.warn('LHM sensor script not found:', scriptPath)
      resolve(false)
      return
    }

    const outputPath = path.join(os.tmpdir(), 'chronodesk-sensors.json')
    const sentinelPath = path.join(os.tmpdir(), 'chronodesk-sensors.running')
    lhmSensorPath = outputPath

    // Clean up any previous run
    try { fs.unlinkSync(sentinelPath) } catch {}
    try { fs.unlinkSync(outputPath) } catch {}

    // Start PowerShell with admin privileges
    const psCmd = `Start-Process powershell -ArgumentList '-ExecutionPolicy Bypass -NoProfile -File "${scriptPath}" -OutputPath "${outputPath}"' -Verb RunAs -WindowStyle Hidden`

    exec(
      `powershell -NoProfile -Command "${psCmd}"`,
      { timeout: 10000 },
      (err) => {
        if (err) {
          console.warn('Failed to start LHM sensor (admin denied):', err.message)
          resolve(false)
          return
        }

        // Wait for the sensor script to start producing data
        let retries = 0
        const maxRetries = 15
        const check = setInterval(() => {
          retries++
          if (fs.existsSync(outputPath)) {
            clearInterval(check)
            console.log('LHM sensor reader started successfully')
            resolve(true)
          } else if (retries >= maxRetries) {
            clearInterval(check)
            console.warn('LHM sensor reader did not start in time')
            resolve(false)
          }
        }, 1000)
      }
    )
  })
}

// Stop LHM sensor reader
function stopLhmSensor(): void {
  if (lhmSensorPath) {
    const sentinelPath = lhmSensorPath.replace('.json', '.running')
    try { fs.unlinkSync(sentinelPath) } catch {}
    // Wait a bit then clean up
    setTimeout(() => {
      try { fs.unlinkSync(lhmSensorPath!) } catch {}
    }, 2000)
    lhmSensorPath = null
  }
  // Kill any remaining PowerShell processes related to LHM
  try {
    exec('powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"CommandLine LIKE \'%lhm-sensor%\'\\" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }"', { timeout: 3000 })
  } catch {}
}

// Read cached LHM sensor data
function readLhmSensors(): { cpu: Record<string, number>; gpu: Record<string, number> } | null {
  if (!lhmSensorPath || !fs.existsSync(lhmSensorPath)) return null
  try {
    const data = fs.readFileSync(lhmSensorPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Read CPU temp: try LHM sensor file first, then thermal zone fallback
function getCpuTempFallback(): Promise<number | null> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(null)
      return
    }

    // Try LHM sensor data first (written by PowerShell script)
    const lhmData = readLhmSensors()
    if (lhmData?.cpu) {
      // Prefer "Core Max" or "CPU Package", fall back to first available
      const temp = lhmData.cpu['Core Max'] ?? lhmData.cpu['CPU Package'] ?? Object.values(lhmData.cpu)[0]
      if (temp && temp > 0) {
        resolve(Math.round(temp))
        return
      }
    }

    // Fallback: thermal zone
    exec(
      'powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -Namespace root/cimv2 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Temperature"',
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) {
          resolve(null)
          return
        }
        const match = stdout.match(/(\d+)/)
        if (match) {
          resolve(Math.round(parseInt(match[1]) / 10))
        } else {
          resolve(null)
        }
      }
    )
  })
}

// Get GPU info via nvidia-smi (more accurate than systeminformation)
function getNvidiaGpu(): Promise<{ load: number; memLoad: number; temp: number; power: number; coreClock: number; memClock: number } | null> {
  return new Promise((resolve) => {
    exec(
      'nvidia-smi --query-gpu=utilization.gpu,utilization.memory,temperature.gpu,power.draw,clocks.current.graphics,clocks.current.memory --format=csv,noheader',
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) {
          resolve(null)
          return
        }
        const parts = stdout.trim().split(',').map(s => parseFloat(s))
        if (parts.length >= 6 && !isNaN(parts[0])) {
          resolve({
            load: parts[0],
            memLoad: parts[1],
            temp: parts[2],
            power: parts[3],
            coreClock: parts[4],
            memClock: parts[5]
          })
        } else {
          resolve(null)
        }
      }
    )
  })
}

async function collectStats(): Promise<SystemStats> {
  const [cpuLoad, mem, fsSize, networkStats, cpuTemp, processes, gpuData, time, nvidiaGpu] =
    await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.cpuTemperature().catch(() => ({ main: null })),
      si.processes().catch(() => ({ all: 0 })),
      si.graphics().catch(() => ({ controllers: [] })),
      si.time(),
      getNvidiaGpu()
    ])

  // CPU temperature: try systeminformation first, then LHM/PowerShell fallback
  let cpuTempValue = cpuTemp.main ?? null
  if (cpuTempValue === null) {
    cpuTempValue = await getCpuTempFallback()
  }

  // GPU info: prefer nvidia-smi, fallback to LHM sensor, then systeminformation
  const lhmData = readLhmSensors()
  const siGpu = (gpuData.controllers || [])
    .filter((g) => g.vram > 0 || g.utilizationGpu != null || g.temperatureGpu != null)

  const gpu = siGpu.map((g) => {
    const lhmGpuTemp = lhmData?.gpu?.['GPU Core'] ?? lhmData?.gpu?.['GPU Hot Spot']
    return {
      model: g.model || 'Unknown GPU',
      vramTotal: g.vram || 0,
      vramUsed: g.memoryUsed || 0,
      temperature: nvidiaGpu?.temp ?? lhmGpuTemp ?? g.temperatureGpu ?? null,
      load: nvidiaGpu?.load ?? g.utilizationGpu ?? null,
      memControllerLoad: nvidiaGpu?.memLoad ?? g.utilizationMemory ?? null,
      powerDraw: nvidiaGpu?.power ?? g.powerDraw ?? null,
      coreClock: nvidiaGpu?.coreClock ?? g.clockCore ?? null,
      memoryClock: nvidiaGpu?.memClock ?? g.clockMemory ?? null
    }
  })

  // Network totals
  const totalRx = networkStats.reduce((sum, n) => sum + (n.rx_bytes || 0), 0)
  const totalTx = networkStats.reduce((sum, n) => sum + (n.tx_bytes || 0), 0)
  const rx_sec = networkStats.reduce((sum, n) => sum + (n.rx_sec || 0), 0)
  const tx_sec = networkStats.reduce((sum, n) => sum + (n.tx_sec || 0), 0)

  return {
    cpu: {
      usage: Math.round(cpuLoad.currentLoad * 100) / 100,
      cores: cpuLoad.cpus.map((c) => Math.round(c.load * 100) / 100),
      temperature: cpuTempValue,
      processCount: processes.all || 0,
      speed: 0
    },
    memory: {
      total: mem.total,
      used: mem.used,
      active: mem.active,
      available: mem.available,
      swapTotal: mem.swaptotal,
      swapUsed: mem.swapused,
      percentage: Math.round((mem.active / mem.total) * 10000) / 100
    },
    disk: fsSize.map((d) => ({
      mount: d.mount,
      size: d.size,
      used: d.used,
      percentage: Math.round(d.use * 100) / 100
    })),
    network: {
      rx_sec,
      tx_sec,
      totalRx,
      totalTx
    },
    gpu,
    uptime: time.uptime
  }
}

export async function startSystemMonitor(window: BrowserWindow): Promise<void> {
  mainWindowRef = window

  // Start LHM sensor reader for accurate CPU temperature
  startLhmSensor().then((started) => {
    if (started) {
      console.log('LHM sensor reader active - accurate CPU temperature available')
    } else {
      console.log('LHM sensor not available - using thermal zone fallback')
    }
  })

  intervalId = setInterval(async () => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      try {
        const stats = await collectStats()
        mainWindowRef.webContents.send('system:statsUpdate', stats)
      } catch (err) {
        console.error('Failed to collect system stats:', err)
      }
    }
  }, 2000)
}

export function stopSystemMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  mainWindowRef = null
  stopLhmSensor()
}

export async function getStaticInfo() {
  const [cpu, os, netInterfaces] = await Promise.all([
    si.cpu(),
    si.osInfo(),
    si.networkInterfaces()
  ])
  const mem = await si.mem()

  const interfaces = (Array.isArray(netInterfaces) ? netInterfaces : [netInterfaces])
    .filter((n) => n.ip4 && !n.internal)
    .map((n) => ({
      iface: n.iface,
      ip4: n.ip4,
      mac: n.mac,
      speed: n.speed ?? null
    }))

  return {
    cpuModel: `${cpu.manufacturer} ${cpu.brand}`,
    cpuCores: cpu.cores,
    cpuSpeed: cpu.speed,
    totalMemory: mem.total,
    osPlatform: os.platform,
    osRelease: os.release,
    osHostname: os.hostname,
    networkInterfaces: interfaces
  }
}
