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

function persistSettings(state: SettingsState) {
  if (!window.api) return
  const {
    setSelectedView,
    setAlwaysOnTop,
    setMinimizeToTray,
    setStartupWithOS,
    toggleMiniMode,
    hydrate,
    ...data
  } = state
  window.api.storeSet('settings', data).catch(console.error)
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  selectedView: 'clock',
  alwaysOnTop: false,
  minimizeToTray: true,
  startupWithOS: false,
  miniMode: false,
  setSelectedView: (view) =>
    {
      set({ selectedView: __LIGHT_BUILD__ && view === 'monitor' ? 'clock' : view })
      persistSettings(get())
    },
  setAlwaysOnTop: (v) => { set({ alwaysOnTop: v }); persistSettings(get()) },
  setMinimizeToTray: (v) => { set({ minimizeToTray: v }); persistSettings(get()) },
  setStartupWithOS: (v) => { set({ startupWithOS: v }); persistSettings(get()) },
  toggleMiniMode: () => {
    set((s) => ({ miniMode: !s.miniMode }))
    persistSettings(get())
  },
  hydrate: (data) =>
    set((state) => ({
      ...data,
      selectedView:
        data.selectedView === undefined
          ? state.selectedView
          : __LIGHT_BUILD__ && data.selectedView === 'monitor'
            ? 'clock'
            : data.selectedView
    }))
}))
