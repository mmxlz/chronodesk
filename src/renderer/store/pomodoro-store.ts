import { create } from 'zustand'
import { PomodoroStatus, PomodoroSettings, PomodoroSession } from '../types/pomodoro'

interface PomodoroState {
  status: PomodoroStatus
  timeRemaining: number
  currentSession: number
  settings: PomodoroSettings
  sessions: PomodoroSession[]
  setStatus: (s: PomodoroStatus) => void
  setTimeRemaining: (t: number) => void
  decrement: () => void
  nextSession: () => void
  reset: () => void
  updateSettings: (s: Partial<PomodoroSettings>) => void
  addSession: (session: PomodoroSession) => void
  hydrate: (data: Partial<PomodoroState>) => void
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4
}

export const usePomodoroStore = create<PomodoroState>()((set, get) => ({
  status: 'idle',
  timeRemaining: 25 * 60,
  currentSession: 0,
  settings: defaultSettings,
  sessions: [],
  setStatus: (status) => set({ status }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  decrement: () =>
    set((state) => ({
      timeRemaining: Math.max(0, state.timeRemaining - 1)
    })),
  nextSession: () =>
    set((state) => {
      const { settings, currentSession } = state
      const isWork = state.status === 'running'

      if (isWork) {
        const isLongBreak =
          (currentSession + 1) % settings.sessionsBeforeLongBreak === 0
        return {
          status: 'break' as PomodoroStatus,
          currentSession: currentSession + 1,
          timeRemaining: (isLongBreak ? settings.longBreakDuration : settings.breakDuration) * 60
        }
      } else {
        return {
          status: 'running' as PomodoroStatus,
          timeRemaining: settings.workDuration * 60
        }
      }
    }),
  reset: () =>
    set((state) => ({
      status: 'idle',
      timeRemaining: state.settings.workDuration * 60,
      currentSession: 0
    })),
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    })),
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, session]
    })),
  hydrate: (data) => set(data)
}))
