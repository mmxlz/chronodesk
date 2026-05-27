import { BrowserWindow } from 'electron'
import si from 'systeminformation'
import { SystemStats } from '../../renderer/types/monitor'

let intervalId: ReturnType<typeof setInterval> | null = null
let mainWindowRef: BrowserWindow | null = null

async function collectStats(): Promise<SystemStats> {
  const [cpuLoad, mem, fsSize, networkStats] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats()
  ])

  return {
    cpu: {
      usage: Math.round(cpuLoad.currentLoad * 100) / 100,
      cores: cpuLoad.cpus.map((c) => Math.round(c.load * 100) / 100)
    },
    memory: {
      total: mem.total,
      used: mem.used,
      active: mem.active,
      percentage: Math.round((mem.active / mem.total) * 10000) / 100
    },
    disk: fsSize.map((d) => ({
      mount: d.mount,
      size: d.size,
      used: d.used,
      percentage: Math.round(d.use * 100) / 100
    })),
    network: {
      rx_sec: networkStats[0]?.rx_sec ?? 0,
      tx_sec: networkStats[0]?.tx_sec ?? 0
    }
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

export async function getStaticInfo(): Promise<{
  cpuModel: string
  totalMemory: number
  osPlatform: string
  osRelease: string
}> {
  const [cpu, os] = await Promise.all([si.cpu(), si.osInfo()])
  const mem = await si.mem()

  return {
    cpuModel: `${cpu.manufacturer} ${cpu.brand}`,
    totalMemory: mem.total,
    osPlatform: os.platform,
    osRelease: os.release
  }
}
