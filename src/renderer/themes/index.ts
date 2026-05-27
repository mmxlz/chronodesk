import { ThemeConfig } from './types'
import { darkTheme } from './dark'
import { lightTheme } from './light'
import { neonTheme } from './neon'
import { minimalTheme } from './minimal'
import { retroTheme } from './retro'

export const themes: Record<string, ThemeConfig> = {
  dark: darkTheme,
  light: lightTheme,
  neon: neonTheme,
  minimal: minimalTheme,
  retro: retroTheme
}

export const themeList = Object.values(themes)

export function getTheme(name: string): ThemeConfig {
  return themes[name] ?? darkTheme
}

export type { ThemeConfig, ThemeColors } from './types'
