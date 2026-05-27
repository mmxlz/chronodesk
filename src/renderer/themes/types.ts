export interface ThemeColors {
  background: string
  surface: string
  surfaceHover: string
  primary: string
  primaryHover: string
  accent: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
}

export interface ThemeConfig {
  name: string
  label: string
  colors: ThemeColors
  clockFont: string
}
