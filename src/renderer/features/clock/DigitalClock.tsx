import { useClock } from './useClock'
import { formatDate } from '@/lib/formatters'
import { useThemeStore, ClockSize } from '@/store/theme-store'
import { getTheme } from '@/themes'

const sizeMap: Record<ClockSize, string> = {
  small: 'text-4xl',
  medium: 'text-6xl',
  large: 'text-[7rem]',
  xlarge: 'text-[9rem]'
}

export default function DigitalClock() {
  const now = useClock()
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const clockFormat = useThemeStore((s) => s.clockFormat)
  const showSeconds = useThemeStore((s) => s.showSeconds)
  const showDate = useThemeStore((s) => s.showDate)
  const clockSize = useThemeStore((s) => s.clockSize)
  const clockColor = useThemeStore((s) => s.clockColor)
  const clockFont = useThemeStore((s) => s.clockFont)

  const theme = getTheme(currentTheme)

  // Format hours based on 12/24h
  let hours = now.getHours()
  if (clockFormat === '12h') {
    hours = hours % 12 || 12
  }
  const h = hours.toString().padStart(2, '0')
  const m = now.getMinutes().toString().padStart(2, '0')
  const s = now.getSeconds().toString().padStart(2, '0')

  // Determine font: custom > theme default
  const fontFamily = clockFont || theme.clockFont

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${sizeMap[clockSize]} font-bold tracking-tight leading-none`}
        style={{
          fontFamily,
          color: clockColor || undefined
        }}
      >
        <span>{h}</span>
        <span className="animate-blink">:</span>
        <span>{m}</span>
        {showSeconds && (
          <>
            <span className="animate-blink">:</span>
            <span>{s}</span>
          </>
        )}
      </div>

      {showDate && (
        <div className="text-lg text-text-secondary">{formatDate(now)}</div>
      )}
    </div>
  )
}
