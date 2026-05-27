import { BrowserWindow } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../renderer/types/monitor'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null

async function collectStats(): Promise<SystemStats> {
  const [cpuLoad, mem, fsSize, networkStats, cpuTemp, processes, gpuData, time] =
    await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.cpuTemperature().catch(() => ({ main: null })),
      si.processes().catch(() => ({ all: 0 })),
      si.graphics().catch(() => ({ controllers: [] })),
      si.time()
    ])

  // GPU info
  const gpu = (gpuData.controllers || []).map((g) => ({
    model: g.model || 'Unknown GPU',
    vramTotal: g.vram || 0,
    vramUsed: g.memoryUsed || 0,
    temperature: g.temperatureGpu ?? null,
    load: g.utilizationGpu ?? null
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
      temperature: cpuTemp.main ?? null,
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
