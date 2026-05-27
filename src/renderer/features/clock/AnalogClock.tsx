import { useClock } from './useClock'

export default function AnalogClock() {
  const now = useClock()

  const seconds = now.getSeconds()
  const minutes = now.getMinutes()
  const hours = now.getHours() % 12

  const secondsDeg = (seconds / 60) * 360
  const minutesDeg = (minutes / 60) * 360 + (seconds / 60) * 6
  const hoursDeg = (hours / 12) * 360 + (minutes / 60) * 30

  const size = 280
  const center = size / 2
  const hourMarkers = Array.from({ length: 12 }, (_, i) => i)
  const minuteMarkers = Array.from({ length: 60 }, (_, i) => i)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Clock face */}
      <circle
        cx={center}
        cy={center}
        r={center - 4}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="2"
      />

      {/* Hour markers */}
      {hourMarkers.map((i) => {
        const angle = (i * 30 - 90) * (Math.PI / 180)
        const x1 = center + (center - 18) * Math.cos(angle)
        const y1 = center + (center - 18) * Math.sin(angle)
        const x2 = center + (center - 8) * Math.cos(angle)
        const y2 = center + (center - 8) * Math.sin(angle)
        return (
          <line
            key={`h-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-text)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )
      })}

      {/* Minute markers */}
      {minuteMarkers.map((i) => {
        if (i % 5 === 0) return null
        const angle = (i * 6 - 90) * (Math.PI / 180)
        const x1 = center + (center - 12) * Math.cos(angle)
        const y1 = center + (center - 12) * Math.sin(angle)
        const x2 = center + (center - 8) * Math.cos(angle)
        const y2 = center + (center - 8) * Math.sin(angle)
        return (
          <line
            key={`m-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-text-secondary)"
            strokeWidth="1"
          />
        )
      })}

      {/* Hour hand */}
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={center - 70}
        stroke="var(--color-text)"
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${hoursDeg}, ${center}, ${center})`}
        style={{ transition: 'transform 0.3s ease' }}
      />

      {/* Minute hand */}
      <line
        x1={center}
        y1={center}
        x2={center}
        y2={center - 95}
        stroke="var(--color-text)"
        strokeWidth="3"
        strokeLinecap="round"
        transform={`rotate(${minutesDeg}, ${center}, ${center})`}
        style={{ transition: 'transform 0.3s ease' }}
      />

      {/* Second hand */}
      <line
        x1={center}
        y1={center + 15}
        x2={center}
        y2={center - 100}
        stroke="var(--color-accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        transform={`rotate(${secondsDeg}, ${center}, ${center})`}
      />

      {/* Center dot */}
      <circle cx={center} cy={center} r="4" fill="var(--color-accent)" />
    </svg>
  )
}
