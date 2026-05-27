import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'
import { formatBytes } from '@/lib/formatters'

export default function MemoryCard() {
  const current = useMonitorStore((s) => s.current)
  const memoryHistory = useMonitorStore((s) => s.memoryHistory)
  const percentage = current?.memory.percentage ?? 0
  const used = current?.memory.used ?? 0
  const total = current?.memory.total ?? 0

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">内存</h3>
        <span className="text-xs text-text-secondary">
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>

      <div className="flex items-center justify-center">
        <GaugeChart value={percentage} size={110} />
      </div>

      <div className="flex items-end gap-px h-8">
        {memoryHistory.slice(-30).map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: `${Math.max(2, p.value)}%`,
              backgroundColor: p.value > 85 ? 'var(--color-warning)' : 'var(--color-accent)'
            }}
          />
        ))}
      </div>
    </div>
  )
}
