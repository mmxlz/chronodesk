import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'
import { formatBytes } from '@/lib/formatters'

export default function GpuCard() {
  const current = useMonitorStore((s) => s.current)
  const gpus = current?.gpu ?? []

  if (gpus.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
        <h3 className="text-sm font-medium text-text-secondary">GPU</h3>
        <div className="flex-1 flex items-center justify-center text-xs text-text-secondary">
          未检测到独立显卡
        </div>
      </div>
    )
  }

  const gpu = gpus[0]
  const vramPercent =
    gpu.vramTotal > 0 ? Math.round((gpu.vramUsed / gpu.vramTotal) * 100) : 0

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">GPU</h3>
        <span className="text-xs text-text-secondary truncate max-w-[180px]">{gpu.model}</span>
      </div>

      <div className="flex gap-4">
        {/* Load gauge */}
        <div className="flex-shrink-0">
          <GaugeChart value={gpu.load ?? 0} size={110} label="负载" />
        </div>

        {/* Details */}
        <div className="flex-1 flex flex-col gap-2 text-xs">
          {gpu.vramTotal > 0 && (
            <div>
              <span className="text-text-secondary">显存</span>
              <div className="font-medium">
                {formatBytes(gpu.vramUsed)} / {formatBytes(gpu.vramTotal)}
                <span className="text-text-secondary ml-1">({vramPercent}%)</span>
              </div>
            </div>
          )}

          {gpu.temperature !== null && (
            <div>
              <span className="text-text-secondary">温度</span>
              <div
                className="font-medium"
                style={{
                  color:
                    gpu.temperature > 85
                      ? 'var(--color-error)'
                      : gpu.temperature > 70
                        ? 'var(--color-warning)'
                        : undefined
                }}
              >
                {gpu.temperature}°C
              </div>
            </div>
          )}

          {gpu.load !== null && (
            <div>
              <span className="text-text-secondary">GPU 负载</span>
              <div className="font-medium">{gpu.load}%</div>
            </div>
          )}
        </div>
      </div>

      {/* VRAM bar */}
      {gpu.vramTotal > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-text-secondary mb-1">
            <span>显存使用</span>
            <span>{vramPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${vramPercent}%`,
                backgroundColor: vramPercent > 90 ? 'var(--color-error)' : 'var(--color-primary)'
              }}
            />
          </div>
        </div>
      )}

      {/* Multiple GPUs indicator */}
      {gpus.length > 1 && (
        <div className="text-[10px] text-text-secondary">
          检测到 {gpus.length} 个 GPU
        </div>
      )}
    </div>
  )
}
