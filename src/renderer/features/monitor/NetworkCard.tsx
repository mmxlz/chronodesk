import { useMonitorStore } from '@/store/monitor-store'
import { formatSpeed } from '@/lib/formatters'

export default function NetworkCard() {
  const current = useMonitorStore((s) => s.current)
  const networkRxHistory = useMonitorStore((s) => s.networkRxHistory)
  const rx = current?.network.rx_sec ?? 0
  const tx = current?.network.tx_sec ?? 0

  const maxVal = Math.max(...networkRxHistory.map((p) => p.value), 1)

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-secondary">网络</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-text-secondary">下载</span>
          <div className="text-lg font-bold text-success">{formatSpeed(rx)}</div>
        </div>
        <div>
          <span className="text-xs text-text-secondary">上传</span>
          <div className="text-lg font-bold text-primary">{formatSpeed(tx)}</div>
        </div>
      </div>

      <div className="flex items-end gap-px h-12">
        {networkRxHistory.slice(-30).map((p, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm transition-all duration-300"
            style={{
              height: `${Math.max(2, (p.value / maxVal) * 100)}%`,
              backgroundColor: 'var(--color-success)'
            }}
          />
        ))}
      </div>
    </div>
  )
}
