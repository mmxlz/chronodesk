interface MiniBarProps {
  value: number
  label: string
  sublabel?: string
  color?: string
}

export default function MiniBar({ value, label, sublabel, color }: MiniBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span>{sublabel ?? `${Math.round(value)}%`}</span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, value)}%`,
            backgroundColor: color ?? 'var(--color-accent)'
          }}
        />
      </div>
    </div>
  )
}
