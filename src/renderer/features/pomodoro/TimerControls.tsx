import { usePomodoroStore } from '@/store/pomodoro-store'
import { usePomodoro } from './usePomodoro'
import { FiPlay, FiPause, FiRotateCcw, FiSkipForward } from 'react-icons/fi'

export default function TimerControls() {
  const status = usePomodoroStore((s) => s.status)
  const { start, pause, reset, skip } = usePomodoro()

  return (
    <div className="flex items-center gap-3">
      {status === 'idle' || status === 'paused' ? (
        <button
          onClick={start}
          className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FiPlay size={20} />
        </button>
      ) : (
        <button
          onClick={pause}
          className="w-12 h-12 rounded-full bg-surface-hover text-text flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <FiPause size={20} />
        </button>
      )}

      <button
        onClick={reset}
        className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover text-text-secondary flex items-center justify-center transition-colors"
        title="重置"
      >
        <FiRotateCcw size={16} />
      </button>

      <button
        onClick={skip}
        className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover text-text-secondary flex items-center justify-center transition-colors"
        title="跳过"
      >
        <FiSkipForward size={16} />
      </button>
    </div>
  )
}
