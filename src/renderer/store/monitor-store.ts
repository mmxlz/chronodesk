import { create } from 'zustand'
import { SystemStats, StaticSystemInfo } from '../types/monitor'
import { MAX_HISTORY_POINTS } from '../lib/constants'

interface DataPoint {
  time: number
  value: number
}

interface MonitorState {
  current: SystemStats | null
  staticInfo: StaticSystemInfo | null
  cpuHistory: DataPoint[]
  memoryHistory: DataPoint[]
  networkRxHistory: DataPoint[]
  update: (stats: SystemStats) => void
  setStaticInfo: (info: StaticSystemInfo) => void
}

export const useMonitorStore = create<MonitorState>()((set) => ({
  current: null,
  staticInfo: null,
  cpuHistory: [],
  memoryHistory: [],
  networkRxHistory: [],
  update: (stats) =>
    set((state) => {
      const now = Date.now()
      return {
        current: stats,
        cpuHistory: [...state.cpuHistory, { time: now, value: stats.cpu.usage }].slice(
          -MAX_HISTORY_POINTS
        ),
        memoryHistory: [
          ...state.memoryHistory,
          { time: now, value: stats.memory.percentage }
        ].slice(-MAX_HISTORY_POINTS),
        networkRxHistory: [
          ...state.networkRxHistory,
          { time: now, value: stats.network.rx_sec }
        ].slice(-MAX_HISTORY_POINTS)
      }
    }),
  setStaticInfo: (info) => set({ staticInfo: info })
}))
