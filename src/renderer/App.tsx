import { useEffect } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import PanelContainer from '@/components/layout/PanelContainer'
import { useThemeStore } from '@/store/theme-store'
import { useSettingsStore } from '@/store/settings-store'
import { usePomodoroStore } from '@/store/pomodoro-store'
import { useNotesStore } from '@/store/notes-store'
import { getTheme } from '@/themes'
import { playSound } from '@/lib/sounds'
import { useSystemStats } from '@/features/monitor/useSystemStats'

export default function App() {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  useSystemStats()

  // Apply theme CSS variables
  useEffect(() => {
    const theme = getTheme(currentTheme)
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [currentTheme])

  // Hydrate stores from electron-store on mount
  useEffect(() => {
    Promise.all([
      window.api.storeGet('theme'),
      window.api.storeGet('settings'),
      window.api.storeGet('pomodoro'),
      window.api.storeGet('notes')
    ]).then(([theme, settings, pomodoro, notes]) => {
      if (theme) useThemeStore.getState().hydrate(theme as any)
      if (settings) useSettingsStore.getState().hydrate(settings as any)
      if (pomodoro) usePomodoroStore.getState().hydrate(pomodoro as any)
      if (notes) useNotesStore.getState().hydrate(notes as any[])
    })
  }, [])

  // Listen for sound play events from main process
  useEffect(() => {
    const unsubscribe = window.api.onPlaySoundFile((path) => {
      playSound(path)
    })
    return unsubscribe
  }, [])

  return (
    <div className="h-screen flex flex-col bg-bg text-text">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <PanelContainer />
      </div>
    </div>
  )
}
