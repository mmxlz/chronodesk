import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'
import { formatBytes } from '@/lib/formatters'

export default function MemoryCard() {
  const current = useMonitorStore((s) => s.current)
  const staticInfo = useMonitorStore((s) => s.staticInfo)
  const memoryHistory = useMonitorStore((s) => s.memoryHistory)
  const percentage = current?.memory.percentage ?? 0
  const memSpeed = staticInfo?.memSpeed ?? null
  const active = current?.memory.active ?? 0
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

        <div className="flex-1 flex flex-col gap-2 text-xs">
          <div>
            <span className="text-text-secondary">可用</span>
            <div className="font-medium">{formatBytes(available)}</div>
          </div>
          {memSpeed && (
            <div>
              <span className="text-text-secondary">频率</span>
              <div className="font-medium">{memSpeed} MHz</div>
            </div>
          )}
          {swapTotal > 0 && (
            <div>
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
      <div className="flex items-end gap-px h-6">
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
