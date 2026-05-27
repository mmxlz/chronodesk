import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'
import { formatBytes } from '@/lib/formatters'

export default function MemoryCard() {
  const current = useMonitorStore((s) => s.current)
  const memoryHistory = useMonitorStore((s) => s.memoryHistory)
  const percentage = current?.memory.percentage ?? 0
  const active = current?.memory.active ?? 0
  const used = current?.memory.used ?? 0
  const available = current?.memory.available ?? 0
  const total = current?.memory.total ?? 0
  const swapTotal = current?.memory.swapTotal ?? 0
  const swapUsed = current?.memory.swapUsed ?? 0
  const swapPercent = swapTotal > 0 ? Math.round((swapUsed / swapTotal) * 100) : 0

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">内存</h3>
        <span className="text-xs text-text-secondary">
          {formatBytes(active)} / {formatBytes(total)}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <GaugeChart value={percentage} size={110} />
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <span className="text-text-secondary">已使用</span>
            <div className="font-medium">{formatBytes(used)}</div>
          </div>
          <div>
            <span className="text-text-secondary">可用</span>
            <div className="font-medium">{formatBytes(available)}</div>
          </div>
          {swapTotal > 0 && (
            <div className="col-span-2">
              <span className="text-text-secondary">虚拟内存</span>
              <div className="font-medium">
                {formatBytes(swapUsed)} / {formatBytes(swapTotal)}
                <span className="text-text-secondary ml-1">({swapPercent}%)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History sparkline */}
      <div className="flex items-end gap-px h-24 mt-auto">
        {memoryHistory.slice(-40).map((p, i) => (
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
