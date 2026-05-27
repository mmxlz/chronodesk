import ThemeSelector from './ThemeSelector'
import GeneralSettings from './GeneralSettings'

export default function SettingsView() {
  return (
    <div className="h-full p-6 space-y-6 overflow-auto">
      <h2 className="text-xl font-bold">设置</h2>
      <ThemeSelector />
      <GeneralSettings />

      {/* About */}
      <div className="bg-surface rounded-xl p-4">
        <h3 className="text-sm font-medium mb-2">关于</h3>
        <p className="text-xs text-text-secondary">
          ChronoDesk v1.0.0 — 桌面时钟 + 性能监测 + 番茄钟 + 便签日历
        </p>
        <p className="text-xs text-text-secondary mt-1">
          用 Electron + React + TypeScript 构建
        </p>
      </div>
    </div>
  )
}
