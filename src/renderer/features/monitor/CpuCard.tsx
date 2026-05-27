import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'

export default function CpuCard() {
  const current = useMonitorStore((s) => s.current)
  const cpuHistory = useMonitorStore((s) => s.cpuHistory)
  const usage = current?.cpu.usage ?? 0

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">CPU</h3>
        <span className="text-xs text-text-secondary">
          {current?.cpu.cores.length ?? 0} 核心
        </span>
      </div>

      <div className="flex items-center justify-center">
        <GaugeChart value={usage} size={110} />
      </div>

      {/* Mini sparkline using last 30 points */}
      <div className="flex items-end gap-px h-8">
        {cpuHistory.slice(-30).map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: `${Math.max(2, p.value)}%`,
              backgroundColor: p.value > 80 ? 'var(--color-error)' : 'var(--color-accent)'
            }}
          />
        ))}
      </div>
    </div>
  )
}
