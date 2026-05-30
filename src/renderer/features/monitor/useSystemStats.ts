import { useEffect } from 'react'
import { useMonitorStore } from '@/store/monitor-store'

export function useSystemStats(enabled = true) {
  const update = useMonitorStore((s) => s.update)
  const setStaticInfo = useMonitorStore((s) => s.setStaticInfo)

  useEffect(() => {
    if (!enabled) return

    // Fetch static info once
    window.api.getStaticInfo().then(setStaticInfo).catch(console.error)

    // Subscribe to live updates
    const unsubscribe = window.api.onStatsUpdate((stats) => {
      update(stats)
    })
    return unsubscribe
  }, [enabled, update, setStaticInfo])
}
