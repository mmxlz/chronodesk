import { BrowserWindow, app } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../shared/monitor'
import { exec, spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null
let lhmProcess: ChildProcess | null = null
let perfProcess: ChildProcess | null = null
let lhmSensorPath: string | null = null
let isCollecting = false

const MONITOR_INTERVAL = 2000
const PROCESS_CACHE_TTL = 30000
const DISK_CACHE_TTL = 30000
const GRAPHICS_CACHE_TTL = 10000
const SI_TEMP_CACHE_TTL = 10000

type LhmSensorData = {
  cpu: Record<string, number>
  gpu: Record<string, number>
  timestamp?: string
}

type PerfMetrics = {
  cpuUtility: number | null
  gpuLoad: number | null
}

let perfHeaders: string[] = []
let perfMetrics: PerfMetrics = {
  cpuUtility: null,
  gpuLoad: null
}
let previousNetworkSample: {
  time: number
  totalRx: number
  totalTx: number
} | null = null
let previousNetworkRates = {
  rx_sec: 0,
  tx_sec: 0
}

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100
}

function parsePerfCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(value)
      value = ''
    } else {
      value += char
    }
  }
  values.push(value)
  return values
}

function updatePerfMetrics(values: string[]): void {
  if (perfHeaders.length === 0 || values.length < 2) return

  let cpuUtility: number | null = null
  const gpuEngineTotals = new Map<string, number>()

  for (let i = 1; i < values.length && i < perfHeaders.length; i++) {
    const header = perfHeaders[i]
    const value = Number.parseFloat(values[i])
    if (!Number.isFinite(value)) continue

    if (header.includes('\\Processor Information(_Total)\\% Processor Utility')) {
      cpuUtility = Math.max(0, Math.min(100, value))
      continue
    }

    if (header.includes('\\GPU Engine(') && header.includes('\\Utilization Percentage')) {
      const match = header.match(/engtype_([^)\\]+)/)
      const engineType = match?.[1] ?? 'Other'
      gpuEngineTotals.set(engineType, (gpuEngineTotals.get(engineType) ?? 0) + value)
    }
  }

  const gpuLoad =
    gpuEngineTotals.size > 0
      ? Math.max(...Array.from(gpuEngineTotals.values()).map((value) => Math.min(100, value)))
      : null

  perfMetrics = {
    cpuUtility: cpuUtility !== null ? roundPercent(cpuUtility) : perfMetrics.cpuUtility,
    gpuLoad: gpuLoad !== null ? roundPercent(gpuLoad) : perfMetrics.gpuLoad
  }
}

function startPerformanceCounters(): void {
  if (process.platform !== 'win32' || perfProcess) return

  perfProcess = spawn(
    'typeperf.exe',
    [
      '\\Processor Information(_Total)\\% Processor Utility',
      '\\GPU Engine(*)\\Utilization Percentage',
      '-si',
      '2'
    ],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] }
  )

  perfProcess.stdout?.setEncoding('utf8')
  let buffer = ''
  perfProcess.stdout?.on('data', (chunk: string) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith('Exiting') || line.startsWith('The command')) continue

      const values = parsePerfCsvLine(line)
      if (values[0] === '(PDH-CSV 4.0)') {
        perfHeaders = values
      } else if (perfHeaders.length > 0) {
        updatePerfMetrics(values)
      }
    }
  })

  perfProcess.on('exit', () => {
    perfProcess = null
    perfHeaders = []
  })
}

function stopPerformanceCounters(): void {
  if (perfProcess && !perfProcess.killed) {
    perfProcess.kill()
  }
  perfProcess = null
  perfHeaders = []
}

function getFallbackCpuLoad(): { usage: number; cores: number[] } {
  const cpus = os.cpus()
  return {
    usage: perfMetrics.cpuUtility ?? 0,
    cores: cpus.map(() => perfMetrics.cpuUtility ?? 0)
  }
}

function getNetworkRates(networkStats: Awaited<ReturnType<typeof si.networkStats>>) {
  const now = Date.now()
  const totalRx = networkStats.reduce((sum, n) => sum + (n.rx_bytes || 0), 0)
  const totalTx = networkStats.reduce((sum, n) => sum + (n.tx_bytes || 0), 0)

  if (!previousNetworkSample) {
    previousNetworkSample = { time: now, totalRx, totalTx }
    return {
      rx_sec: 0,
      tx_sec: 0,
      totalRx,
      totalTx
    }
  }

  const elapsedSeconds = Math.max(0.1, (now - previousNetworkSample.time) / 1000)
  const rxDelta = Math.max(0, totalRx - previousNetworkSample.totalRx)
  const txDelta = Math.max(0, totalTx - previousNetworkSample.totalTx)
  previousNetworkRates = {
    rx_sec: rxDelta / elapsedSeconds,
    tx_sec: txDelta / elapsedSeconds
  }
  previousNetworkSample = { time: now, totalRx, totalTx }

  return {
    ...previousNetworkRates,
    totalRx,
    totalTx
  }
}

// Find bundled LHM directory
function getLhmDir(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(__dirname, '..', '..', '..', 'build', 'lhm')
  }
  return path.join(process.resourcesPath, 'lhm')
}

// Start LHM sensor reader PowerShell script. If ChronoDesk is elevated,
// the child process inherits that token without a second UAC prompt.
function startLhmSensor(): Promise<boolean> {
  const lhmDir = getLhmDir()
  const scriptPath = path.join(lhmDir, 'lhm-sensor.ps1')

  if (!fs.existsSync(scriptPath)) {
    console.warn('LHM sensor script not found:', scriptPath)
    return Promise.resolve(false)
  }

  const outputPath = path.join(os.tmpdir(), 'chronodesk-sensors.json')
  const sentinelPath = path.join(os.tmpdir(), 'chronodesk-sensors.running')
  lhmSensorPath = outputPath

  try { fs.unlinkSync(sentinelPath) } catch {}
  try { fs.unlinkSync(outputPath) } catch {}

  lhmProcess = spawn(
    'powershell.exe',
    ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', scriptPath, '-OutputPath', outputPath],
    { windowsHide: true, stdio: 'ignore' }
  )

  lhmProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.warn(`LHM sensor reader exited with code ${code}`)
    }
    lhmProcess = null
  })

  return new Promise((resolve) => {
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
  if (lhmProcess && !lhmProcess.killed) {
    lhmProcess.kill()
    lhmProcess = null
  }
}

// Cached LHM sensor data. Refresh by file mtime instead of a time TTL so
// a 5s app poll never skips a fresh 5s LHM write.
let lhmCache: LhmSensorData | null = null
let lhmCacheMtime = 0

function readLhmSensors(): LhmSensorData | null {
  if (!lhmSensorPath || !fs.existsSync(lhmSensorPath)) return lhmCache
  try {
    const stat = fs.statSync(lhmSensorPath)
    if (lhmCache && stat.mtimeMs === lhmCacheMtime) return lhmCache

    const data = fs.readFileSync(lhmSensorPath, 'utf-8').replace(/^\uFEFF/, '')
    lhmCache = JSON.parse(data)
    lhmCacheMtime = stat.mtimeMs
    return lhmCache
  } catch {
    return lhmCache
  }
}

// Cached thermal zone temperature (avoid spawning PowerShell every poll)
let thermalZoneCache: number | null = null
let thermalZoneCacheTime = 0
const THERMAL_ZONE_TTL = 15000 // 15 seconds

// Read CPU temp from thermal zone (cached)
function getCpuTempFallback(): Promise<number | null> {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(null)
      return
    }

    const now = Date.now()
    if (now - thermalZoneCacheTime < THERMAL_ZONE_TTL) {
      resolve(thermalZoneCache)
      return
    }

    exec(
      'powershell -NoProfile -Command "Get-CimInstance -ClassName Win32_PerfFormattedData_Counters_ThermalZoneInformation -Namespace root/cimv2 -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Temperature"',
      { timeout: 5000 },
      (err, stdout) => {
        if (err || !stdout) {
          resolve(thermalZoneCache)
          return
        }
        const match = stdout.match(/(\d+)/)
        if (match) {
          thermalZoneCache = Math.round(parseInt(match[1]) / 10)
          thermalZoneCacheTime = now
          resolve(thermalZoneCache)
        } else {
          resolve(thermalZoneCache)
        }
      }
    )
  })
}

let siTempCache: number | null = null
let siTempCacheTime = 0

function getSiCpuTemp(): Promise<number | null> {
  return new Promise((resolve) => {
    const now = Date.now()
    if (now - siTempCacheTime < SI_TEMP_CACHE_TTL) {
      resolve(siTempCache)
      return
    }

    si.cpuTemperature()
      .then((temp) => {
        siTempCache = temp.main ?? null
        siTempCacheTime = now
        resolve(siTempCache)
      })
      .catch(() => resolve(siTempCache))
  })
}

let processCountCache = 0
let processCountCacheTime = 0

async function getProcessCount(): Promise<number> {
  const now = Date.now()
  if (now - processCountCacheTime < PROCESS_CACHE_TTL) return processCountCache

  try {
    const processes = await si.processes()
    processCountCache = processes.all || processCountCache
    processCountCacheTime = now
  } catch {
    processCountCacheTime = now
  }
  return processCountCache
}

let fsSizeCache: Awaited<ReturnType<typeof si.fsSize>> = []
let fsSizeCacheTime = 0

async function getFsSize() {
  const now = Date.now()
  if (now - fsSizeCacheTime < DISK_CACHE_TTL && fsSizeCache.length > 0) return fsSizeCache

  try {
    fsSizeCache = await si.fsSize()
    fsSizeCacheTime = now
  } catch {
    fsSizeCacheTime = now
  }
  return fsSizeCache
}

let graphicsCache: Awaited<ReturnType<typeof si.graphics>> = { controllers: [], displays: [] }
let graphicsCacheTime = 0

async function getGraphics() {
  const now = Date.now()
  if (now - graphicsCacheTime < GRAPHICS_CACHE_TTL) return graphicsCache

  try {
    graphicsCache = await si.graphics()
    graphicsCacheTime = now
  } catch {
    graphicsCacheTime = now
  }
  return graphicsCache
}

async function getCpuTemperature(lhmData: LhmSensorData | null): Promise<number | null> {
  if (lhmData?.cpu) {
    const lhmCpuTemp =
      lhmData.cpu['Core Max'] ??
      lhmData.cpu['CPU Package'] ??
      lhmData.cpu['Core Average'] ??
      Object.values(lhmData.cpu).find((v) => v > 0)

    if (lhmCpuTemp && lhmCpuTemp > 0) {
      return Math.round(lhmCpuTemp)
    }
  }

  const siTemp = await getSiCpuTemp()
  return siTemp ?? getCpuTempFallback()
}

async function collectStats(): Promise<SystemStats> {
  const lhmData = readLhmSensors()
  const cpuLoad = getFallbackCpuLoad()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = Math.max(0, totalMemory - freeMemory)
  const [networkStats, fsSize, processCount, gpuData, cpuTempValue] =
    await Promise.all([
      si.networkStats(),
      getFsSize(),
      getProcessCount(),
      getGraphics(),
      getCpuTemperature(lhmData)
    ])

  // GPU usage follows Windows Task Manager GPU Engine counters.
  const siGpu = (gpuData.controllers || [])
    .filter((g) => (g.vram ?? 0) > 0 || g.utilizationGpu != null || g.temperatureGpu != null)

  const gpu = siGpu.map((g) => {
    const lhmGpuTemp = lhmData?.gpu?.['GPU Core'] ?? lhmData?.gpu?.['GPU Hot Spot']
    return {
      model: g.model || 'Unknown GPU',
      vramTotal: g.vram || 0,
      vramUsed: g.memoryUsed || 0,
      temperature: lhmGpuTemp ?? g.temperatureGpu ?? null,
      load: perfMetrics.gpuLoad ?? g.utilizationGpu ?? null,
      memControllerLoad: g.utilizationMemory ?? null,
      powerDraw: g.powerDraw ?? null,
      coreClock: g.clockCore ?? null,
      memoryClock: g.clockMemory ?? null
    }
  })

  const network = getNetworkRates(networkStats)

  return {
    cpu: {
      usage: cpuLoad.usage,
      cores: cpuLoad.cores,
      temperature: cpuTempValue,
      processCount,
      speed: 0
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      active: usedMemory,
      available: freeMemory,
      swapTotal: 0,
      swapUsed: 0,
      percentage: Math.round((usedMemory / totalMemory) * 10000) / 100
    },
    disk: fsSize.map((d) => ({
      mount: d.mount,
      size: d.size,
      used: d.used,
      percentage: Math.round(d.use * 100) / 100
    })),
    network: {
      rx_sec: network.rx_sec,
      tx_sec: network.tx_sec,
      totalRx: network.totalRx,
      totalTx: network.totalTx
    },
    gpu,
    uptime: os.uptime()
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
  startPerformanceCounters()

  const publishStats = async () => {
    if (isCollecting || !mainWindowRef || mainWindowRef.isDestroyed()) return
    isCollecting = true
    try {
      const stats = await collectStats()
      mainWindowRef.webContents.send('system:statsUpdate', stats)
    } catch (err) {
      console.error('Failed to collect system stats:', err)
    } finally {
      isCollecting = false
    }
  }

  publishStats()
  intervalId = setInterval(async () => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      publishStats()
    }
  }, MONITOR_INTERVAL)
}

export function stopSystemMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  mainWindowRef = null
  stopPerformanceCounters()
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
