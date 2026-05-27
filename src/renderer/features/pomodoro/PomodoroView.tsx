import TimerDisplay from './TimerDisplay'
import TimerControls from './TimerControls'
import SessionHistory from './SessionHistory'
import PomodoroSettings from './PomodoroSettings'

export default function PomodoroView() {
  return (
    <div className="h-full p-6 flex flex-col items-center gap-6 overflow-auto">
      <TimerDisplay />
      <TimerControls />
      <SessionHistory />
      <PomodoroSettings />
    </div>
  )
}
