import { usePomodoroStore } from '@/store/pomodoro-store'
import { formatCountdown } from '@/lib/formatters'

export default function TimerDisplay() {
  const { timeRemaining, status, settings } = usePomodoroStore()
  const totalSeconds =
    status === 'break' ? settings.breakDuration * 60 : settings.workDuration * 60
  const progress = totalSeconds > 0 ? timeRemaining / totalSeconds : 0

  const size = 200
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - progress * circumference

  const isBreak = status === 'break'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isBreak ? 'var(--color-success)' : 'var(--color-accent)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span
          className="text-4xl font-bold"
          style={{ fontFamily: 'JetBrains Mono' }}
        >
          {formatCountdown(timeRemaining)}
        </span>
        <span className="text-xs text-text-secondary mt-1">
          {status === 'idle' && '准备开始'}
          {status === 'running' && '专注中'}
          {status === 'paused' && '已暂停'}
          {status === 'break' && '休息中'}
        </span>
      </div>
    </div>
  )
}
