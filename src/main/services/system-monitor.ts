import { BrowserWindow, app } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../shared/monitor'
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null
let isCollecting = false

const MONITOR_INTERVAL = 2000
const PROCESS_CACHE_TTL = 30000
const DISK_CACHE_TTL = 30000
const GRAPHICS_CACHE_TTL = 10000

// ─── C++ Sensor Process ───────────────────────────────────────────────
type SensorData = {
  cpu: { usage: number; temp: number }
  gpu: {
    name: string; temp: number; load: number; memLoad: number
    power: number; coreClock: number; memClock: number
    memTotal: number; memUsed: number
  }
  mem: { total: number; used: number; available: number }
}

let sensorProcess: ChildProcess | null = null
let latestSensor: SensorData | null = null

function getSensorPath(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return path.join(__dirname, '..', '..', '..', 'build', 'sensor', 'sensor.exe')
  }
  return path.join(process.resourcesPath, 'sensor.exe')
}

function startSensorProcess(): void {
  const exePath = getSensorPath()
  if (!fs.existsSync(exePath)) {
    console.warn('sensor.exe not found:', exePath)
    return
  }

  sensorProcess = spawn(exePath, [], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })

  let buffer = ''
  sensorProcess.stdout?.setEncoding('utf8')
  sensorProcess.stdout?.on('data', (chunk: string) => {
    buffer += chunk
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        latestSensor = JSON.parse(trimmed) as SensorData
      } catch {
        // ignore malformed lines
      }
    }
  })

  sensorProcess.on('exit', (code) => {
    console.warn(`sensor.exe exited with code ${code}`)
    sensorProcess = null
    // Auto-restart after 5 seconds
    setTimeout(() => startSensorProcess(), 5000)
  })

  sensorProcess.on('error', (err) => {
    console.error('sensor.exe error:', err.message)
  })

  console.log('sensor.exe started')
}

function stopSensorProcess(): void {
  if (sensorProcess && !sensorProcess.killed) {
    sensorProcess.kill()
  }
  sensorProcess = null
  latestSensor = null
}

// ─── Performance Counters (typeperf for CPU utility) ──────────────────
let perfProcess: ChildProcess | null = null
let perfHeaders: string[] = []
let perfMetrics = { cpuUtility: null as number | null, gpuLoad: null as number | null }

function parsePerfCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') inQuotes = !inQuotes
    else if (char === ',' && !inQuotes) { values.push(value); value = '' }
    else value += char
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
    }
    if (header.includes('\\GPU Engine(') && header.includes('\\Utilization Percentage')) {
      const match = header.match(/engtype_([^)\\]+)/)
      const engineType = match?.[1] ?? 'Other'
      gpuEngineTotals.set(engineType, (gpuEngineTotals.get(engineType) ?? 0) + value)
    }
  }
  const gpuLoad = gpuEngineTotals.size > 0
    ? Math.max(...Array.from(gpuEngineTotals.values()).map((v) => Math.min(100, v)))
    : null
  perfMetrics = {
    cpuUtility: cpuUtility !== null ? Math.round(cpuUtility * 100) / 100 : perfMetrics.cpuUtility,
    gpuLoad: gpuLoad !== null ? Math.round(gpuLoad * 100) / 100 : perfMetrics.gpuLoad
  }
}

function startPerformanceCounters(): void {
  if (process.platform !== 'win32' || perfProcess) return
  perfProcess = spawn('typeperf.exe', [
    '\\Processor Information(_Total)\\% Processor Utility',
    '\\GPU Engine(*)\\Utilization Percentage',
    '-si', '2'
  ], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })

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
      if (values[0] === '(PDH-CSV 4.0)') perfHeaders = values
      else if (perfHeaders.length > 0) updatePerfMetrics(values)
    }
  })
  perfProcess.on('exit', () => { perfProcess = null; perfHeaders = [] })
}

function stopPerformanceCounters(): void {
  if (perfProcess && !perfProcess.killed) perfProcess.kill()
  perfProcess = null; perfHeaders = []
}

// ─── Caches ───────────────────────────────────────────────────────────
let previousNetworkSample: { time: number; totalRx: number; totalTx: number } | null = null
let previousNetworkRates = { rx_sec: 0, tx_sec: 0 }

function getNetworkRates(networkStats: Awaited<ReturnType<typeof si.networkStats>>) {
  const now = Date.now()
  const totalRx = networkStats.reduce((sum, n) => sum + (n.rx_bytes || 0), 0)
  const totalTx = networkStats.reduce((sum, n) => sum + (n.tx_bytes || 0), 0)
  if (!previousNetworkSample) {
    previousNetworkSample = { time: now, totalRx, totalTx }
    return { rx_sec: 0, tx_sec: 0, totalRx, totalTx }
  }
  const elapsed = Math.max(0.1, (now - previousNetworkSample.time) / 1000)
  previousNetworkRates = {
    rx_sec: Math.max(0, totalRx - previousNetworkSample.totalRx) / elapsed,
    tx_sec: Math.max(0, totalTx - previousNetworkSample.totalTx) / elapsed
  }
  previousNetworkSample = { time: now, totalRx, totalTx }
  return { ...previousNetworkRates, totalRx, totalTx }
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
  } catch { processCountCacheTime = now }
  return processCountCache
}

let fsSizeCache: Awaited<ReturnType<typeof si.fsSize>> = []
let fsSizeCacheTime = 0
async function getFsSize() {
  const now = Date.now()
  if (now - fsSizeCacheTime < DISK_CACHE_TTL && fsSizeCache.length > 0) return fsSizeCache
  try { fsSizeCache = await si.fsSize(); fsSizeCacheTime = now } catch { fsSizeCacheTime = now }
  return fsSizeCache
}

let graphicsCache: Awaited<ReturnType<typeof si.graphics>> = { controllers: [], displays: [] }
let graphicsCacheTime = 0
async function getGraphics() {
  const now = Date.now()
  if (now - graphicsCacheTime < GRAPHICS_CACHE_TTL) return graphicsCache
  try { graphicsCache = await si.graphics(); graphicsCacheTime = now } catch { graphicsCacheTime = now }
  return graphicsCache
}

// ─── Collect Stats ────────────────────────────────────────────────────
async function collectStats(): Promise<SystemStats> {
  const sensor = latestSensor
  const [networkStats, fsSize, processCount, gpuData] =
    await Promise.all([si.networkStats(), getFsSize(), getProcessCount(), getGraphics()])

  // CPU: prefer sensor.exe usage, fallback to typeperf
  const cpuUsage = sensor?.cpu.usage ?? perfMetrics.cpuUtility ?? 0
  const cpuTemp = sensor?.cpu.temp && sensor.cpu.temp > 0 ? sensor.cpu.temp : null

  // Memory: prefer sensor.exe (more accurate), fallback to os
  const totalMemory = sensor?.mem.total ?? os.totalmem()
  const freeMemory = sensor?.mem.available ?? os.freemem()
  const usedMemory = sensor?.mem.used ?? Math.max(0, totalMemory - freeMemory)

  // GPU: prefer sensor.exe data, merge with si for model name
  const siGpu = (gpuData.controllers || []).filter((g) => (g.vram ?? 0) > 0)
  const gpu = siGpu.map((g) => ({
    model: sensor?.gpu.name || g.model || 'Unknown GPU',
    vramTotal: sensor?.gpu.memTotal ? sensor.gpu.memTotal * 1024 * 1024 : g.vram || 0,
    vramUsed: sensor?.gpu.memUsed ? sensor.gpu.memUsed * 1024 * 1024 : g.memoryUsed || 0,
    temperature: sensor?.gpu.temp && sensor.gpu.temp > 0 ? sensor.gpu.temp : g.temperatureGpu ?? null,
    load: sensor?.gpu.load ?? perfMetrics.gpuLoad ?? g.utilizationGpu ?? null,
    memControllerLoad: sensor?.gpu.memLoad ?? g.utilizationMemory ?? null,
    powerDraw: sensor?.gpu.power && sensor.gpu.power > 0 ? sensor.gpu.power : g.powerDraw ?? null,
    coreClock: sensor?.gpu.coreClock && sensor.gpu.coreClock > 0 ? sensor.gpu.coreClock : g.clockCore ?? null,
    memoryClock: sensor?.gpu.memClock && sensor.gpu.memClock > 0 ? sensor.gpu.memClock : g.clockMemory ?? null
  }))

  const network = getNetworkRates(networkStats)
  const cpuCores = os.cpus().map(() => cpuUsage)

  return {
    cpu: { usage: Math.round(cpuUsage * 100) / 100, cores: cpuCores, temperature: cpuTemp, processCount, speed: 0 },
    memory: {
      total: totalMemory, used: usedMemory, active: usedMemory, available: freeMemory,
      swapTotal: 0, swapUsed: 0, percentage: Math.round((usedMemory / totalMemory) * 10000) / 100
    },
    disk: fsSize.map((d) => ({ mount: d.mount, size: d.size, used: d.used, percentage: Math.round(d.use * 100) / 100 })),
    network: { rx_sec: network.rx_sec, tx_sec: network.tx_sec, totalRx: network.totalRx, totalTx: network.totalTx },
    gpu,
    uptime: os.uptime()
  }
}

// ─── Exported Controls ────────────────────────────────────────────────
export async function startSystemMonitor(window: BrowserWindow): Promise<void> {
  mainWindowRef = window
  startSensorProcess()
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
  intervalId = setInterval(() => { publishStats() }, MONITOR_INTERVAL)
}

export function stopSystemMonitor(): void {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
  mainWindowRef = null
  stopPerformanceCounters()
  stopSensorProcess()
}

export async function getStaticInfo() {
  const [cpu, osInfo, netInterfaces] = await Promise.all([
    si.cpu(), si.osInfo(), si.networkInterfaces()
  ])
  const mem = await si.mem()
  const interfaces = (Array.isArray(netInterfaces) ? netInterfaces : [netInterfaces])
    .filter((n) => n.ip4 && !n.internal)
    .map((n) => ({ iface: n.iface, ip4: n.ip4, mac: n.mac, speed: n.speed ?? null }))
  return {
    cpuModel: `${cpu.manufacturer} ${cpu.brand}`, cpuCores: cpu.cores, cpuSpeed: cpu.speed,
    totalMemory: mem.total, osPlatform: osInfo.platform, osRelease: osInfo.release,
    osHostname: osInfo.hostname, networkInterfaces: interfaces
  }
}
