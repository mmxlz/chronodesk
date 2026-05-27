import { useThemeStore, ClockSize, ClockFormat } from '@/store/theme-store'
import { cn } from '@/lib/cn'

const sizes: { key: ClockSize; label: string }[] = [
  { key: 'small', label: '小' },
  { key: 'medium', label: '中' },
  { key: 'large', label: '大' },
  { key: 'xlarge', label: '超大' }
]

const formats: { key: ClockFormat; label: string }[] = [
  { key: '24h', label: '24小时' },
  { key: '12h', label: '12小时' }
]

const colorPresets = [
  '', // inherit from theme
  '#f8fafc',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#00ff41'
]

export default function ClockSettings() {
  const {
    clockFormat,
    showSeconds,
    showDate,
    clockSize,
    clockColor,
    setClockFormat,
    setShowSeconds,
    setShowDate,
    setClockSize,
    setClockColor
  } = useThemeStore()

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">时钟设置</h3>

      {/* Format */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">时间格式</label>
        <div className="flex gap-2">
          {formats.map((f) => (
            <button
              key={f.key}
              onClick={() => setClockFormat(f.key)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                clockFormat === f.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-text-secondary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">字体大小</label>
        <div className="flex gap-2">
          {sizes.map((s) => (
            <button
              key={s.key}
              onClick={() => setClockSize(s.key)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                clockSize === s.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-text-secondary'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle seconds */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm">显示秒数</span>
        <button
          onClick={() => setShowSeconds(!showSeconds)}
          className={cn(
            'w-10 h-5 rounded-full relative transition-colors',
            showSeconds ? 'bg-accent' : 'bg-border'
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform',
              showSeconds ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </label>

      {/* Toggle date */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm">显示日期</span>
        <button
          onClick={() => setShowDate(!showDate)}
          className={cn(
            'w-10 h-5 rounded-full relative transition-colors',
            showDate ? 'bg-accent' : 'bg-border'
          )}
        >
          <div
            className={cn(
              'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform',
              showDate ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </label>

      {/* Clock color */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">时钟颜色</label>
        <div className="flex gap-2 flex-wrap">
          {colorPresets.map((c) => (
            <button
              key={c || 'default'}
              onClick={() => setClockColor(c)}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-all',
                clockColor === c ? 'border-accent scale-110' : 'border-border'
              )}
              style={{
                backgroundColor: c || 'var(--color-text)',
                boxShadow: c === '' ? 'inset 0 0 0 2px var(--color-surface)' : undefined
              }}
              title={c || '跟随主题'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
