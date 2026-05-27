import { useMonitorStore } from '@/store/monitor-store'
import { formatSpeed, formatBytes } from '@/lib/formatters'

export default function NetworkCard() {
  const current = useMonitorStore((s) => s.current)
  const staticInfo = useMonitorStore((s) => s.staticInfo)
  const networkRxHistory = useMonitorStore((s) => s.networkRxHistory)
  const rx = current?.network.rx_sec ?? 0
  const tx = current?.network.tx_sec ?? 0
  const totalRx = current?.network.totalRx ?? 0
  const totalTx = current?.network.totalTx ?? 0
  const interfaces = staticInfo?.networkInterfaces ?? []

  const maxVal = Math.max(...networkRxHistory.map((p) => p.value), 1)

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-secondary">网络</h3>

      {/* Speed */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-text-secondary">↓ 下载</span>
          <div className="text-lg font-bold text-success">{formatSpeed(rx)}</div>
        </div>
        <div>
          <span className="text-xs text-text-secondary">↑ 上传</span>
          <div className="text-lg font-bold text-primary">{formatSpeed(tx)}</div>
        </div>
      </div>

      {/* History chart */}
      <div className="flex items-end gap-px h-10">
        {networkRxHistory.slice(-40).map((p, i) => (
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

      {/* Totals */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-text-secondary">总下载</span>
          <div className="font-medium">{formatBytes(totalRx)}</div>
        </div>
        <div>
          <span className="text-text-secondary">总上传</span>
          <div className="font-medium">{formatBytes(totalTx)}</div>
        </div>
      </div>

      {/* Network interfaces */}
      {interfaces.length > 0 && (
        <div>
          <div className="text-[10px] text-text-secondary mb-1">网络接口</div>
          <div className="space-y-1">
            {interfaces.slice(0, 3).map((n) => (
              <div
                key={n.iface}
                className="flex items-center justify-between text-xs bg-surface-hover rounded px-2 py-1"
              >
                <span className="text-text-secondary truncate max-w-[80px]">{n.iface}</span>
                <span className="font-mono">{n.ip4}</span>
                {n.speed && <span className="text-text-secondary">{n.speed} Mbps</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
