import { useSettingsStore } from '@/store/settings-store'
import ClockView from '@/features/clock/ClockView'
import MonitorView from '@/features/monitor/MonitorView'
import PomodoroView from '@/features/pomodoro/PomodoroView'
import NotesView from '@/features/notes/NotesView'
import SettingsView from '@/features/settings/SettingsView'

const viewMap = {
  clock: ClockView,
  monitor: MonitorView,
  pomodoro: PomodoroView,
  notes: NotesView,
  settings: SettingsView
}

export default function PanelContainer() {
  const selectedView = useSettingsStore((s) => s.selectedView)
  const View = viewMap[selectedView]

  return (
    <div className="flex-1 h-full overflow-auto">
      <View />
    </div>
  )
}
