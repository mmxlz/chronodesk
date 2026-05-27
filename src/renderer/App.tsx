import { useEffect, useMemo, useCallback } from 'react'
import TopBar from '@/components/layout/TopBar'
import Sidebar from '@/components/layout/Sidebar'
import PanelContainer from '@/components/layout/PanelContainer'
import { useThemeStore, BgType, BgImageSize } from '@/store/theme-store'
import { useSettingsStore, ViewId } from '@/store/settings-store'
import { usePomodoroStore } from '@/store/pomodoro-store'
import { useNotesStore } from '@/store/notes-store'
import { getTheme } from '@/themes'
import { playSound } from '@/lib/sounds'
import { useSystemStats } from '@/features/monitor/useSystemStats'

function getBackgroundStyle(
  bgType: BgType,
  bgColor: string,
  bgGradient: string,
  bgImage: string,
  bgImageSize: BgImageSize,
  bgImageBlur: number
): React.CSSProperties {
  switch (bgType) {
    case 'solid':
      return { backgroundColor: bgColor }
    case 'gradient':
      return { background: bgGradient }
    case 'image':
      return bgImage
        ? {
            backgroundImage: `url(${bgImage})`,
            backgroundSize: bgImageSize,
            backgroundPosition: 'center',
            filter: bgImageBlur > 0 ? `blur(${bgImageBlur}px)` : undefined
          }
        : {}
    default:
      return {}
  }
}

const viewIds: ViewId[] = ['clock', 'monitor', 'pomodoro', 'notes', 'settings']

export default function App() {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const bgType = useThemeStore((s) => s.bgType)
  const bgColor = useThemeStore((s) => s.bgColor)
  const bgGradient = useThemeStore((s) => s.bgGradient)
  const bgImage = useThemeStore((s) => s.bgImage)
  const bgImageSize = useThemeStore((s) => s.bgImageSize)
  const bgImageBlur = useThemeStore((s) => s.bgImageBlur)
  const miniMode = useSettingsStore((s) => s.miniMode)
  const setSelectedView = useSettingsStore((s) => s.setSelectedView)
  const toggleMiniMode = useSettingsStore((s) => s.toggleMiniMode)

  useSystemStats()

  // Apply theme CSS variables
  useEffect(() => {
    const theme = getTheme(currentTheme)
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }, [currentTheme])

  // Background style
  const bgStyle = useMemo(
    () => getBackgroundStyle(bgType, bgColor, bgGradient, bgImage, bgImageSize, bgImageBlur),
    [bgType, bgColor, bgGradient, bgImage, bgImageSize, bgImageBlur]
  )

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

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return

      // Ctrl+1~5: switch views
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5) {
        e.preventDefault()
        setSelectedView(viewIds[num - 1])
        return
      }

      // Ctrl+M: toggle mini mode
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMiniMode()
        return
      }

      // Ctrl+T: toggle always on top
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        window.api.toggleAlwaysOnTop().then((v) => {
          useSettingsStore.getState().setAlwaysOnTop(v)
        })
      }
    },
    [setSelectedView, toggleMiniMode]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Listen for sound play events from main process
  useEffect(() => {
    const unsubscribe = window.api.onPlaySoundFile((path) => {
      playSound(path)
    })
    return unsubscribe
  }, [])

  // Mini mode: compact clock-only view
  if (miniMode) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-bg text-text"
        style={bgStyle}
        onDoubleClick={toggleMiniMode}
        title="双击退出迷你模式"
      >
        <MiniClock />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-bg text-text" style={bgStyle}>
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <PanelContainer />
      </div>
    </div>
  )
}

// Inline mini clock component
function MiniClock() {
  const clockColor = useThemeStore((s) => s.clockColor)
  const clockFormat = useThemeStore((s) => s.clockFormat)
  const showSeconds = useThemeStore((s) => s.showSeconds)

  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours =
    clockFormat === '12h'
      ? time.getHours() % 12 || 12
      : time.getHours()
  const h = hours.toString().padStart(2, '0')
  const m = time.getMinutes().toString().padStart(2, '0')
  const s = time.getSeconds().toString().padStart(2, '0')

  return (
    <div
      className="text-6xl font-bold cursor-pointer select-none"
      style={{
        fontFamily: 'JetBrains Mono',
        color: clockColor || undefined
      }}
    >
      {h}:{m}
      {showSeconds && (
        <>
          <span className="animate-blink">:</span>
          {s}
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
