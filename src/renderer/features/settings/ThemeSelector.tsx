import { useThemeStore } from '@/store/theme-store'
import { themeList } from '@/themes'
import { cn } from '@/lib/cn'

export default function ThemeSelector() {
  const { currentTheme, setTheme } = useThemeStore()

  return (
    <div className="bg-surface rounded-xl p-4">
      <h3 className="text-sm font-medium mb-3">主题选择</h3>
      <div className="grid grid-cols-5 gap-3">
        {themeList.map((theme) => (
          <button
            key={theme.name}
            onClick={() => setTheme(theme.name)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
              currentTheme === theme.name
                ? 'border-accent'
                : 'border-transparent hover:border-border'
            )}
          >
            {/* Preview swatch */}
            <div className="flex gap-0.5">
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: theme.colors.background }}
              />
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="w-5 h-5 rounded-full"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
            <span className="text-xs">{theme.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
