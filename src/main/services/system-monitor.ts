import { BrowserWindow } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../renderer/types/monitor'
import { exec } from 'child_process'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null

// Fallback: read CPU temp via PowerShell thermal zone (Windows only, async)
function getCpuTempFallback(): Promise<number | null> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(null)
      return
    }
    exec(
      'powershell -Command "Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -Namespace root/cimv2 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Temperature"',
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) {
          resolve(null)
          return
        }
        const match = stdout.match(/(\d+)/)
        if (match) {
          // Value is in tenths of degrees Celsius
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

  // CPU temperature: try systeminformation first, then PowerShell fallback
  let cpuTempValue = cpuTemp.main ?? null
  if (cpuTempValue === null) {
    cpuTempValue = await getCpuTempFallback()
  }

  // GPU info: prefer nvidia-smi, fallback to systeminformation
  const siGpu = (gpuData.controllers || [])
    .filter((g) => g.vram > 0 || g.utilizationGpu != null || g.temperatureGpu != null)

  const gpu = siGpu.map((g) => ({
    model: g.model || 'Unknown GPU',
    vramTotal: g.vram || 0,
    vramUsed: g.memoryUsed || 0,
    temperature: nvidiaGpu?.temp ?? g.temperatureGpu ?? null,
    load: nvidiaGpu?.load ?? g.utilizationGpu ?? null,
    memControllerLoad: nvidiaGpu?.memLoad ?? g.utilizationMemory ?? null,
    powerDraw: nvidiaGpu?.power ?? g.powerDraw ?? null,
    coreClock: nvidiaGpu?.coreClock ?? g.clockCore ?? null,
    memoryClock: nvidiaGpu?.memClock ?? g.clockMemory ?? null
  }))

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

export function startSystemMonitor(window: BrowserWindow): void {
  mainWindowRef = window

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
