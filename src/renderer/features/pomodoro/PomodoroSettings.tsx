import { usePomodoroStore } from '@/store/pomodoro-store'

export default function PomodoroSettings() {
  const settings = usePomodoroStore((s) => s.settings)
  const updateSettings = usePomodoroStore((s) => s.updateSettings)

  return (
    <div className="bg-surface rounded-xl p-4 space-y-4">
      <h3 className="text-sm font-medium">番茄钟设置</h3>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">工作时长 (分钟)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={settings.workDuration}
            onChange={(e) => updateSettings({ workDuration: Number(e.target.value) })}
            className="bg-surface-hover text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">短休息 (分钟)</span>
          <input
            type="number"
            min={1}
            max={15}
            value={settings.breakDuration}
            onChange={(e) => updateSettings({ breakDuration: Number(e.target.value) })}
            className="bg-surface-hover text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">长休息 (分钟)</span>
          <input
            type="number"
            min={5}
            max={30}
            value={settings.longBreakDuration}
            onChange={(e) => updateSettings({ longBreakDuration: Number(e.target.value) })}
            className="bg-surface-hover text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-secondary">长休息间隔</span>
          <input
            type="number"
            min={2}
            max={8}
            value={settings.sessionsBeforeLongBreak}
            onChange={(e) =>
              updateSettings({ sessionsBeforeLongBreak: Number(e.target.value) })
            }
            className="bg-surface-hover text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
        </label>
      </div>
    </div>
  )
}
