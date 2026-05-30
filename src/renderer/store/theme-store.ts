import { create } from 'zustand'

export type BgType = 'theme' | 'solid' | 'gradient' | 'image'
export type BgImageSize = 'cover' | 'contain' | 'auto' | number
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
  bgImageSize: BgImageSize
  bgImageBlur: number
  bgImageX: number
  bgImageY: number

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
  setBgImageSize: (s: BgImageSize) => void
  setBgImageBlur: (b: number) => void
  setBgImageX: (x: number) => void
  setBgImageY: (y: number) => void
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

function persistTheme(state: ThemeState) {
  if (!window.api) return
  const {
    setTheme,
    setCustomColor,
    setBgType,
    setBgColor,
    setBgGradient,
    setBgImage,
    setBgImageSize,
    setBgImageBlur,
    setBgImageX,
    setBgImageY,
    setClockFormat,
    setShowSeconds,
    setShowDate,
    setClockSize,
    setClockColor,
    setClockFont,
    setClockPosition,
    setWorldClocks,
    setCountdowns,
    addCountdown,
    removeCountdown,
    hydrate,
    ...data
  } = state
  window.api.storeSet('theme', data).catch(console.error)
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  currentTheme: 'dark',
  customColors: {},

  bgType: 'theme',
  bgColor: '#0f172a',
  bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  bgImage: '',
  bgImageSize: 100,
  bgImageBlur: 0,
  bgImageX: 50,
  bgImageY: 50,

  clockFormat: '24h',
  showSeconds: true,
  showDate: true,
  clockSize: 'large',
  clockColor: '',
  clockFont: '',
  clockPosition: 'center',

  worldClocks: [],
  countdowns: [],

  setTheme: (name) => { set({ currentTheme: name }); persistTheme(get()) },
  setCustomColor: (key, value) => {
    set((s) => ({ customColors: { ...s.customColors, [key]: value } }))
    persistTheme(get())
  },
  setBgType: (bgType) => { set({ bgType }); persistTheme(get()) },
  setBgColor: (bgColor) => { set({ bgColor }); persistTheme(get()) },
  setBgGradient: (bgGradient) => { set({ bgGradient }); persistTheme(get()) },
  setBgImage: (bgImage) => { set({ bgImage }); persistTheme(get()) },
  setBgImageSize: (bgImageSize) => { set({ bgImageSize }); persistTheme(get()) },
  setBgImageBlur: (bgImageBlur) => { set({ bgImageBlur }); persistTheme(get()) },
  setBgImageX: (bgImageX) => { set({ bgImageX }); persistTheme(get()) },
  setBgImageY: (bgImageY) => { set({ bgImageY }); persistTheme(get()) },
  setClockFormat: (clockFormat) => { set({ clockFormat }); persistTheme(get()) },
  setShowSeconds: (showSeconds) => { set({ showSeconds }); persistTheme(get()) },
  setShowDate: (showDate) => { set({ showDate }); persistTheme(get()) },
  setClockSize: (clockSize) => { set({ clockSize }); persistTheme(get()) },
  setClockColor: (clockColor) => { set({ clockColor }); persistTheme(get()) },
  setClockFont: (clockFont) => { set({ clockFont }); persistTheme(get()) },
  setClockPosition: (clockPosition) => { set({ clockPosition }); persistTheme(get()) },
  setWorldClocks: (worldClocks) => { set({ worldClocks }); persistTheme(get()) },
  setCountdowns: (countdowns) => { set({ countdowns }); persistTheme(get()) },
  addCountdown: (c) => {
    set((s) => ({ countdowns: [...s.countdowns, c] }))
    persistTheme(get())
  },
  removeCountdown: (id) =>
    {
      set((s) => ({ countdowns: s.countdowns.filter((c) => c.id !== id) }))
      persistTheme(get())
    },
  hydrate: (data) => set(data)
}))
