import { useClock } from './useClock'
import { formatTime, formatDate } from '@/lib/formatters'
import { useThemeStore } from '@/store/theme-store'
import { getTheme } from '@/themes'

export default function DigitalClock() {
  const now = useClock()
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const theme = getTheme(currentTheme)
  const timeStr = formatTime(now)
  const [h, m, s] = timeStr.split(':')

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="text-[7rem] font-bold tracking-tight leading-none"
        style={{ fontFamily: theme.clockFont }}
      >
        <span>{h}</span>
        <span className="animate-blink">:</span>
        <span>{m}</span>
        <span className="animate-blink">:</span>
        <span>{s}</span>
      </div>
      <div className="text-lg text-text-secondary">{formatDate(now)}</div>
    </div>
  )
}
