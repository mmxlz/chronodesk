import { create } from 'zustand'

export type ViewId = 'clock' | 'monitor' | 'pomodoro' | 'notes' | 'settings'

interface SettingsState {
  selectedView: ViewId
  alwaysOnTop: boolean
  minimizeToTray: boolean
  startupWithOS: boolean
  miniMode: boolean
  setSelectedView: (view: ViewId) => void
  setAlwaysOnTop: (v: boolean) => void
  setMinimizeToTray: (v: boolean) => void
  setStartupWithOS: (v: boolean) => void
  toggleMiniMode: () => void
  hydrate: (data: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  selectedView: 'clock',
  alwaysOnTop: false,
  minimizeToTray: true,
  startupWithOS: false,
  miniMode: false,
  setSelectedView: (view) => set({ selectedView: view }),
  setAlwaysOnTop: (v) => set({ alwaysOnTop: v }),
  setMinimizeToTray: (v) => set({ minimizeToTray: v }),
  setStartupWithOS: (v) => set({ startupWithOS: v }),
  toggleMiniMode: () => set((s) => ({ miniMode: !s.miniMode })),
  hydrate: (data) => set(data)
}))
