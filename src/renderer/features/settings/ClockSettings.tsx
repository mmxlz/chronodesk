import { useThemeStore, ClockSize, ClockFormat, ClockPosition } from '@/store/theme-store'
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

const positions: { key: ClockPosition; label: string }[] = [
  { key: 'center', label: '居中' },
  { key: 'top', label: '顶部' },
  { key: 'top-left', label: '左上' },
  { key: 'top-right', label: '右上' },
  { key: 'bottom', label: '底部' },
  { key: 'bottom-left', label: '左下' },
  { key: 'bottom-right', label: '右下' }
]

const fonts: { name: string; family: string }[] = [
  { name: '默认', family: '' },
  { name: 'JetBrains Mono', family: 'JetBrains Mono' },
  { name: 'Fira Code', family: 'Fira Code' },
  { name: 'Courier New', family: 'Courier New' },
  { name: 'Arial', family: 'Arial' },
  { name: 'Georgia', family: 'Georgia' },
  { name: 'Impact', family: 'Impact' },
  { name: 'Comic Sans', family: 'Comic Sans MS' }
]

const colorPresets = [
  '',
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
    clockFont,
    clockPosition,
    setClockFormat,
    setShowSeconds,
    setShowDate,
    setClockSize,
    setClockColor,
    setClockFont,
    setClockPosition
  } = useThemeStore()

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">时钟设置</h3>

      {/* Font */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">字体</label>
        <div className="flex gap-2 flex-wrap">
          {fonts.map((f) => (
            <button
              key={f.family}
              onClick={() => setClockFont(f.family)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                clockFont === f.family
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-text-secondary'
              )}
              style={{ fontFamily: f.family || undefined }}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

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

      {/* Position */}
      <div>
        <label className="text-xs text-text-secondary block mb-1.5">位置</label>
        <div className="grid grid-cols-4 gap-1.5">
          {positions.map((p) => (
            <button
              key={p.key}
              onClick={() => setClockPosition(p.key)}
              className={cn(
                'px-2 py-1 text-[10px] rounded-md border transition-colors',
                clockPosition === p.key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-secondary hover:border-text-secondary'
              )}
            >
              {p.label}
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
