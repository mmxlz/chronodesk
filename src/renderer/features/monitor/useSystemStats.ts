import { useEffect } from 'react'
import { useMonitorStore } from '@/store/monitor-store'

export function useSystemStats() {
  const update = useMonitorStore((s) => s.update)

  useEffect(() => {
    const unsubscribe = window.api.onStatsUpdate((stats) => {
      update(stats)
    })
    return unsubscribe
  }, [update])
}
