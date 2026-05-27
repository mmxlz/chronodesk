import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'

export default function CpuCard() {
  const current = useMonitorStore((s) => s.current)
  const staticInfo = useMonitorStore((s) => s.staticInfo)
  const cpuHistory = useMonitorStore((s) => s.cpuHistory)
  const usage = current?.cpu.usage ?? 0
  const cores = current?.cpu.cores ?? []
  const temp = current?.cpu.temperature
  const processCount = current?.cpu.processCount ?? 0
  const uptime = current?.uptime ?? 0

  const uptimeH = Math.floor(uptime / 3600)
  const uptimeM = Math.floor((uptime % 3600) / 60)

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">CPU</h3>
        <span className="text-xs text-text-secondary">
          {staticInfo?.cpuModel || '加载中...'}
        </span>
      </div>

      <div className="flex gap-4">
        {/* Gauge */}
        <div className="flex-shrink-0">
          <GaugeChart value={usage} size={110} />
        </div>

        {/* Details */}
        <div className="flex-1 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-secondary">核心数</span>
            <div className="font-medium">{staticInfo?.cpuCores ?? '-'}</div>
          </div>
          <div>
            <span className="text-text-secondary">主频</span>
            <div className="font-medium">{staticInfo?.cpuSpeed ? `${staticInfo.cpuSpeed} GHz` : '-'}</div>
          </div>
          <div>
            <span className="text-text-secondary">温度</span>
            <div className="font-medium" style={{ color: temp && temp > 80 ? 'var(--color-error)' : undefined }}>
              {temp !== null ? `${temp}°C` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-text-secondary">进程数</span>
            <div className="font-medium">{processCount}</div>
          </div>
          <div>
            <span className="text-text-secondary">运行时间</span>
            <div className="font-medium">{uptimeH}h {uptimeM}m</div>
          </div>
        </div>
      </div>

      {/* Per-core usage bars */}
      {cores.length > 0 && (
        <div>
          <div className="text-[10px] text-text-secondary mb-1">各核心负载</div>
          <div className="grid grid-cols-4 gap-1">
            {cores.slice(0, 16).map((load, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${load}%`,
                      backgroundColor:
                        load > 90 ? 'var(--color-error)' : load > 70 ? 'var(--color-warning)' : 'var(--color-accent)'
                    }}
                  />
                </div>
                <span className="text-[9px] w-6 text-right text-text-secondary">{Math.round(load)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History sparkline */}
      <div className="flex items-end gap-px h-6">
        {cpuHistory.slice(-40).map((p, i) => (
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
