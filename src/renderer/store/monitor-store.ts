import { create } from 'zustand'
import { SystemStats } from '../types/monitor'
import { MAX_HISTORY_POINTS } from '../lib/constants'

interface DataPoint {
  time: number
  value: number
}

interface MonitorState {
  current: SystemStats | null
  cpuHistory: DataPoint[]
  memoryHistory: DataPoint[]
  networkRxHistory: DataPoint[]
  networkTxHistory: number[]
  update: (stats: SystemStats) => void
}

export const useMonitorStore = create<MonitorState>()((set) => ({
  current: null,
  cpuHistory: [],
  memoryHistory: [],
  networkRxHistory: [],
  networkTxHistory: [],
  update: (stats) =>
    set((state) => {
      const now = Date.now()
      const cpuHistory = [...state.cpuHistory, { time: now, value: stats.cpu.usage }].slice(
        -MAX_HISTORY_POINTS
      )
      const memoryHistory = [
        ...state.memoryHistory,
        { time: now, value: stats.memory.percentage }
      ].slice(-MAX_HISTORY_POINTS)

      return {
        current: stats,
        cpuHistory,
        memoryHistory,
        networkRxHistory: [
          ...state.networkRxHistory,
          { time: now, value: stats.network.rx_sec }
        ].slice(-MAX_HISTORY_POINTS)
      }
    })
}))
