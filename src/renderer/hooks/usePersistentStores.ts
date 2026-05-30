import { useEffect, useRef } from 'react'
import { useThemeStore } from '@/store/theme-store'
import { useSettingsStore } from '@/store/settings-store'
import { usePomodoroStore } from '@/store/pomodoro-store'
import { useNotesStore } from '@/store/notes-store'

const SAVE_DELAY = 250

function getThemeSnapshot() {
  const { hydrate, ...state } = useThemeStore.getState()
  return state
}

function getSettingsSnapshot() {
  const {
    setSelectedView,
    setAlwaysOnTop,
    setMinimizeToTray,
    setStartupWithOS,
    toggleMiniMode,
    hydrate,
    ...state
  } = useSettingsStore.getState()
  return state
}

function getPomodoroSnapshot() {
  const {
    setStatus,
    setTimeRemaining,
    decrement,
    nextSession,
    reset,
    updateSettings,
    addSession,
    hydrate,
    ...state
  } = usePomodoroStore.getState()
  return state
}

function getNotesSnapshot() {
  return useNotesStore.getState().notes
}

function saveAll() {
  return Promise.all([
    window.api.storeSet('theme', getThemeSnapshot()),
    window.api.storeSet('settings', getSettingsSnapshot()),
    window.api.storeSet('pomodoro', getPomodoroSnapshot()),
    window.api.storeSet('notes', getNotesSnapshot())
  ])
}

export function usePersistentStores() {
  const hydratedRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentTheme = useThemeStore((s) => s.currentTheme)
  const customColors = useThemeStore((s) => s.customColors)
  const bgType = useThemeStore((s) => s.bgType)
  const bgColor = useThemeStore((s) => s.bgColor)
  const bgGradient = useThemeStore((s) => s.bgGradient)
  const bgImage = useThemeStore((s) => s.bgImage)
  const bgImageSize = useThemeStore((s) => s.bgImageSize)
  const bgImageBlur = useThemeStore((s) => s.bgImageBlur)
  const bgImageX = useThemeStore((s) => s.bgImageX)
  const bgImageY = useThemeStore((s) => s.bgImageY)
  const clockFormat = useThemeStore((s) => s.clockFormat)
  const showSeconds = useThemeStore((s) => s.showSeconds)
  const showDate = useThemeStore((s) => s.showDate)
  const clockSize = useThemeStore((s) => s.clockSize)
  const clockColor = useThemeStore((s) => s.clockColor)
  const clockFont = useThemeStore((s) => s.clockFont)
  const clockPosition = useThemeStore((s) => s.clockPosition)
  const worldClocks = useThemeStore((s) => s.worldClocks)
  const countdowns = useThemeStore((s) => s.countdowns)

  const selectedView = useSettingsStore((s) => s.selectedView)
  const alwaysOnTop = useSettingsStore((s) => s.alwaysOnTop)
  const minimizeToTray = useSettingsStore((s) => s.minimizeToTray)
  const startupWithOS = useSettingsStore((s) => s.startupWithOS)
  const miniMode = useSettingsStore((s) => s.miniMode)

  const pomodoroStatus = usePomodoroStore((s) => s.status)
  const timeRemaining = usePomodoroStore((s) => s.timeRemaining)
  const currentSession = usePomodoroStore((s) => s.currentSession)
  const pomodoroSettings = usePomodoroStore((s) => s.settings)
  const pomodoroSessions = usePomodoroStore((s) => s.sessions)

  const notes = useNotesStore((s) => s.notes)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      window.api.storeGet('theme'),
      window.api.storeGet('settings'),
      window.api.storeGet('pomodoro'),
      window.api.storeGet('notes')
    ]).then(([theme, settings, pomodoro, savedNotes]) => {
      if (cancelled) return

      if (theme) useThemeStore.getState().hydrate(theme as any)
      if (settings) useSettingsStore.getState().hydrate(settings as any)
      if (pomodoro) usePomodoroStore.getState().hydrate(pomodoro as any)
      if (Array.isArray(savedNotes)) useNotesStore.getState().hydrate(savedNotes as any[])

      hydratedRef.current = true
    }).catch(console.error)

    const flushOnUnload = () => {
      if (hydratedRef.current) {
        void saveAll()
      }
    }
    window.addEventListener('beforeunload', flushOnUnload)
    const unsubscribeFlush = window.api.onStoreFlush(() => {
      if (hydratedRef.current) {
        void saveAll()
      }
    })

    return () => {
      cancelled = true
      window.removeEventListener('beforeunload', flushOnUnload)
      unsubscribeFlush()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveAll().catch(console.error)
    }, SAVE_DELAY)
  }, [
    currentTheme,
    customColors,
    bgType,
    bgColor,
    bgGradient,
    bgImage,
    bgImageSize,
    bgImageBlur,
    bgImageX,
    bgImageY,
    clockFormat,
    showSeconds,
    showDate,
    clockSize,
    clockColor,
    clockFont,
    clockPosition,
    worldClocks,
    countdowns,
    selectedView,
    alwaysOnTop,
    minimizeToTray,
    startupWithOS,
    miniMode,
    pomodoroStatus,
    timeRemaining,
    currentSession,
    pomodoroSettings,
    pomodoroSessions,
    notes
  ])
}
