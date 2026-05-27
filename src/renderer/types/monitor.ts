export interface SystemStats {
  cpu: {
    usage: number
    cores: number[]
  }
  memory: {
    total: number
    used: number
    active: number
    percentage: number
  }
  disk: Array<{
    mount: string
    size: number
    used: number
    percentage: number
  }>
  network: {
    rx_sec: number
    tx_sec: number
  }
}

export interface StaticSystemInfo {
  cpuModel: string
  totalMemory: number
  osPlatform: string
  osRelease: string
}
