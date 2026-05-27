import { useMonitorStore } from '@/store/monitor-store'
import MiniBar from '@/components/charts/MiniBar'
import { formatBytes } from '@/lib/formatters'

export default function DiskCard() {
  const current = useMonitorStore((s) => s.current)
  const disks = current?.disk ?? []

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-secondary">磁盘</h3>
      <div className="flex flex-col gap-3">
        {disks.map((disk, i) => (
          <MiniBar
            key={disk.mount}
            value={disk.percentage}
            label={disk.mount}
            sublabel={`${formatBytes(disk.used)} / ${formatBytes(disk.size)}`}
            color={
              i === 0
                ? 'var(--color-primary)'
                : i === 1
                  ? 'var(--color-accent)'
                  : 'var(--color-success)'
            }
          />
        ))}
        {disks.length === 0 && (
          <span className="text-xs text-text-secondary">加载中...</span>
        )}
      </div>
    </div>
  )
}
