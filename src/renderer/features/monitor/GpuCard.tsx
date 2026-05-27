import { useMonitorStore } from '@/store/monitor-store'
import GaugeChart from '@/components/charts/GaugeChart'

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
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-text-secondary">GPU</h3>
        <span className="text-xs text-text-secondary text-right">{gpu.model}</span>
      </div>

      <div className="flex gap-4">
        {/* Load gauge */}
        <div className="flex-shrink-0">
          <GaugeChart value={gpu.load ?? 0} size={110} />
        </div>

        {/* Details */}
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
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

          {gpu.powerDraw !== null && (
            <div>
              <span className="text-text-secondary">功耗</span>
              <div className="font-medium">{gpu.powerDraw}W</div>
            </div>
          )}

          {gpu.coreClock !== null && gpu.coreClock > 0 && (
            <div>
              <span className="text-text-secondary">核心频率</span>
              <div className="font-medium">{gpu.coreClock} MHz</div>
            </div>
          )}

          {gpu.memoryClock !== null && gpu.memoryClock > 0 && (
            <div>
              <span className="text-text-secondary">显存频率</span>
              <div className="font-medium">{gpu.memoryClock} MHz</div>
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
