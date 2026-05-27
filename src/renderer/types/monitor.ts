export interface SystemStats {
  cpu: {
    usage: number
    cores: number[]
    temperature: number | null
    processCount: number
    speed: number
  }
  memory: {
    total: number
    used: number
    active: number
    available: number
    swapTotal: number
    swapUsed: number
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
    totalRx: number
    totalTx: number
  }
  gpu: Array<{
    model: string
    vramTotal: number
    vramUsed: number
    temperature: number | null
    load: number | null
    memControllerLoad: number | null
    powerDraw: number | null
    coreClock: number | null
    memoryClock: number | null
  }>
  uptime: number
}

export interface StaticSystemInfo {
  cpuModel: string
  cpuCores: number
  cpuSpeed: number
  totalMemory: number
  memSpeed: number | null
  osPlatform: string
  osRelease: string
  osHostname: string
  networkInterfaces: Array<{
    iface: string
    ip4: string
    mac: string
    speed: number | null
  }>
}
