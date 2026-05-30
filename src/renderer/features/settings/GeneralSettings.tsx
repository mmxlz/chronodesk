import { useSettingsStore } from '@/store/settings-store'

export default function GeneralSettings() {
  const { alwaysOnTop, minimizeToTray, startupWithOS, setAlwaysOnTop, setMinimizeToTray, setStartupWithOS } =
    useSettingsStore()

  const handleToggleAlwaysOnTop = async () => {
    const newVal = await window.api.toggleAlwaysOnTop()
    setAlwaysOnTop(newVal)
  }

  const handleToggleMinimizeToTray = async () => {
    const newVal = !minimizeToTray
    setMinimizeToTray(newVal)
    // Persist to main process store so tray.ts can read it
    const settings = await window.api.storeGet<Record<string, unknown>>('settings')
    await window.api.storeSet('settings', { ...settings, minimizeToTray: newVal })
  }

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">通用设置</h3>

      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm">窗口置顶</div>
            <div className="text-xs text-text-secondary">窗口始终保持在最上层</div>
          </div>
          <button
            onClick={handleToggleAlwaysOnTop}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              alwaysOnTop ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                alwaysOnTop ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm">最小化到托盘</div>
            <div className="text-xs text-text-secondary">关闭窗口时最小化到系统托盘</div>
          </div>
          <button
            onClick={handleToggleMinimizeToTray}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              minimizeToTray ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                minimizeToTray ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <div className="text-sm">开机自启</div>
            <div className="text-xs text-text-secondary">系统启动时自动运行 ChronoDesk</div>
          </div>
          <button
            onClick={async () => {
              const newVal = !startupWithOS
              setStartupWithOS(newVal)
              const settings = await window.api.storeGet<Record<string, unknown>>('settings')
              await window.api.storeSet('settings', { ...settings, startupWithOS: newVal })
            }}
            className={`w-10 h-5 rounded-full relative transition-colors ${
              startupWithOS ? 'bg-accent' : 'bg-border'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                startupWithOS ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  )
}
