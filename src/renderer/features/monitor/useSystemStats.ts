import { useEffect } from 'react'
import { useMonitorStore } from '@/store/monitor-store'

export function useSystemStats() {
  const update = useMonitorStore((s) => s.update)
  const setStaticInfo = useMonitorStore((s) => s.setStaticInfo)

  useEffect(() => {
    // Fetch static info once
    window.api.getStaticInfo().then(setStaticInfo).catch(console.error)

    // Subscribe to live updates
    const unsubscribe = window.api.onStatsUpdate((stats) => {
      update(stats)
    })
    return unsubscribe
  }, [update, setStaticInfo])
}
