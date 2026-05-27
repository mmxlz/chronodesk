import { useThemeStore } from '@/store/theme-store'
import { themeList, getTheme } from '@/themes'
import { cn } from '@/lib/cn'

const colorOptions: { key: string; label: string }[] = [
  { key: 'primary', label: '主色调' },
  { key: 'accent', label: '强调色' },
  { key: 'text', label: '文字色' }
]

export default function ThemeSelector() {
  const { currentTheme, customColors, setTheme, setCustomColor } = useThemeStore()
  const theme = getTheme(currentTheme)

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">主题选择</h3>
      <div className="grid grid-cols-5 gap-3">
        {themeList.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
              currentTheme === t.name
                ? 'border-accent'
                : 'border-transparent hover:border-border'
            )}
          >
            {/* Preview swatch */}
            <div className="flex gap-0.5">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: t.colors.background }}
              />
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: t.colors.primary }}
              />
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: t.colors.accent }}
              />
            </div>
            <span className="text-xs">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Custom color overrides */}
      <div>
        <label className="text-xs text-text-secondary block mb-2">自定义颜色</label>
        <div className="flex gap-4">
          {colorOptions.map((opt) => {
            const current = customColors[opt.key] || theme.colors[opt.key as keyof typeof theme.colors]
            return (
              <div key={opt.key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={current}
                  onChange={(e) => setCustomColor(opt.key, e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border border-border"
                  title={opt.label}
                />
                <span className="text-xs text-text-secondary">{opt.label}</span>
                {customColors[opt.key] && (
                  <button
                    onClick={() => setCustomColor(opt.key, '')}
                    className="text-[10px] text-text-secondary hover:text-error transition-colors"
                    title="重置"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
