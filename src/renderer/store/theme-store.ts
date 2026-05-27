import { create } from 'zustand'

interface ThemeState {
  currentTheme: string
  customColors: Record<string, string>
  fontFamily: string
  fontSize: number
  setTheme: (name: string) => void
  setCustomColor: (key: string, value: string) => void
  setFont: (family: string, size: number) => void
  hydrate: (data: Partial<ThemeState>) => void
}

export const useThemeStore = create<ThemeState>()((set) => ({
  currentTheme: 'dark',
  customColors: {},
  fontFamily: 'Inter',
  fontSize: 16,
  setTheme: (name) => set({ currentTheme: name }),
  setCustomColor: (key, value) =>
    set((s) => ({ customColors: { ...s.customColors, [key]: value } })),
  setFont: (family, size) => set({ fontFamily: family, fontSize: size }),
  hydrate: (data) => set(data)
}))
