import ThemeSelector from './ThemeSelector'
import GeneralSettings from './GeneralSettings'
import BackgroundSettings from './BackgroundSettings'
import ClockSettings from './ClockSettings'

export default function SettingsView() {
  return (
    <div className="h-full p-6 space-y-6 overflow-auto">
      <h2 className="text-xl font-bold">设置</h2>
      <ThemeSelector />
      <BackgroundSettings />
      <ClockSettings />
      <GeneralSettings />

      {/* About */}
      <div className="bg-surface rounded-xl p-4">
        <h3 className="text-sm font-medium mb-2">关于</h3>
        <p className="text-xs text-text-secondary">
          ChronoDesk v1.3.2 — 桌面时钟 + 性能监测 + 番茄钟 + 便签日历
        </p>
        <p className="text-xs text-text-secondary mt-1">
          快捷键: Ctrl+1~5 切换页面 | Ctrl+M 迷你模式 | Ctrl+T 置顶
        </p>
      </div>
    </div>
  )
}
