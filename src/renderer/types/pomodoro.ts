export interface PomodoroSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
}

export interface PomodoroSession {
  id: string
  date: string
  duration: number
  type: 'work' | 'break'
  completedAt: string
}

export type PomodoroStatus = 'idle' | 'running' | 'paused' | 'break'
