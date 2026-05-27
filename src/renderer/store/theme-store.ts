import { create } from 'zustand'

export type BgType = 'theme' | 'solid' | 'gradient' | 'image'
export type ClockSize = 'small' | 'medium' | 'large' | 'xlarge'
export type ClockFormat = '24h' | '12h'
export type ClockPosition = 'center' | 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'

export interface WorldClockEntry {
  id: string
  label: string
  timezone: string
}

export interface CountdownEntry {
  id: string
  label: string
  targetTime: number // timestamp ms
}

interface ThemeState {
  // Theme
  currentTheme: string
  customColors: Record<string, string>

  // Background
  bgType: BgType
  bgColor: string
  bgGradient: string
  bgImage: string

  // Clock customization
  clockFormat: ClockFormat
  showSeconds: boolean
  showDate: boolean
  clockSize: ClockSize
  clockColor: string
  clockFont: string
  clockPosition: ClockPosition

  // World clocks
  worldClocks: WorldClockEntry[]

  // Countdowns
  countdowns: CountdownEntry[]

  // Setters
  setTheme: (name: string) => void
  setCustomColor: (key: string, value: string) => void
  setBgType: (t: BgType) => void
  setBgColor: (c: string) => void
  setBgGradient: (g: string) => void
  setBgImage: (i: string) => void
  setClockFormat: (f: ClockFormat) => void
  setShowSeconds: (v: boolean) => void
  setShowDate: (v: boolean) => void
  setClockSize: (s: ClockSize) => void
  setClockColor: (c: string) => void
  setClockFont: (f: string) => void
  setClockPosition: (p: ClockPosition) => void
  setWorldClocks: (w: WorldClockEntry[]) => void
  setCountdowns: (c: CountdownEntry[]) => void
  addCountdown: (c: CountdownEntry) => void
  removeCountdown: (id: string) => void
  hydrate: (data: Partial<ThemeState>) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  currentTheme: 'dark',
  customColors: {},

  bgType: 'theme',
  bgColor: '#0f172a',
  bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  bgImage: '',

  clockFormat: '24h',
  showSeconds: true,
  showDate: true,
  clockSize: 'large',
  clockColor: '',
  clockFont: '',
  clockPosition: 'center',

  worldClocks: [],
  countdowns: [],

  setTheme: (name) => set({ currentTheme: name }),
  setCustomColor: (key, value) =>
    set((s) => ({ customColors: { ...s.customColors, [key]: value } })),
  setBgType: (bgType) => set({ bgType }),
  setBgColor: (bgColor) => set({ bgColor }),
  setBgGradient: (bgGradient) => set({ bgGradient }),
  setBgImage: (bgImage) => set({ bgImage }),
  setClockFormat: (clockFormat) => set({ clockFormat }),
  setShowSeconds: (showSeconds) => set({ showSeconds }),
  setShowDate: (showDate) => set({ showDate }),
  setClockSize: (clockSize) => set({ clockSize }),
  setClockColor: (clockColor) => set({ clockColor }),
  setClockFont: (clockFont) => set({ clockFont }),
  setClockPosition: (clockPosition) => set({ clockPosition }),
  setWorldClocks: (worldClocks) => set({ worldClocks }),
  setCountdowns: (countdowns) => set({ countdowns }),
  addCountdown: (c) => set((s) => ({ countdowns: [...s.countdowns, c] })),
  removeCountdown: (id) =>
    set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) })),
  hydrate: (data) => set(data)
}))
