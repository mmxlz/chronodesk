import { useState } from 'react'
import { useThemeStore, WorldClockEntry } from '@/store/theme-store'
import { v4 as uuidv4 } from 'uuid'
import { FiPlus, FiX } from 'react-icons/fi'

const popularTimezones: { label: string; tz: string }[] = [
  { label: '纽约', tz: 'America/New_York' },
  { label: '洛杉矶', tz: 'America/Los_Angeles' },
  { label: '伦敦', tz: 'Europe/London' },
  { label: '巴黎', tz: 'Europe/Paris' },
  { label: '东京', tz: 'Asia/Tokyo' },
  { label: '首尔', tz: 'Asia/Seoul' },
  { label: '悉尼', tz: 'Australia/Sydney' },
  { label: '迪拜', tz: 'Asia/Dubai' },
  { label: '新加坡', tz: 'Asia/Singapore' },
  { label: '上海', tz: 'Asia/Shanghai' }
]

function getTimeInTimezone(tz: string): { time: string; offset: string } {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('zh-CN', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const offsetStr = now.toLocaleTimeString('zh-CN', {
    timeZone: tz,
    timeZoneName: 'shortOffset'
  })
  const offset = offsetStr.split(' ')[1] || ''
  return { time: timeStr, offset }
}

export default function WorldClocks() {
  const { worldClocks, setWorldClocks } = useThemeStore()
  const [showAdd, setShowAdd] = useState(false)

  const addClock = (tz: { label: string; tz: string }) => {
    const entry: WorldClockEntry = {
      id: uuidv4(),
      label: tz.label,
      timezone: tz.tz
    }
    setWorldClocks([...worldClocks, entry])
    setShowAdd(false)
  }

  const removeClock = (id: string) => {
    setWorldClocks(worldClocks.filter((c) => c.id !== id))
  }

  // Filter out already-added timezones
  const availableTimezones = popularTimezones.filter(
    (tz) => !worldClocks.some((w) => w.timezone === tz.tz)
  )

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">世界时钟</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-text-secondary hover:text-accent transition-colors"
        >
          <FiPlus size={16} />
        </button>
      </div>

      {/* Add timezone dropdown */}
      {showAdd && availableTimezones.length > 0 && (
        <div className="bg-surface-hover rounded-lg p-2 space-y-1 max-h-40 overflow-auto">
          {availableTimezones.map((tz) => (
            <button
              key={tz.tz}
              onClick={() => addClock(tz)}
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-border transition-colors"
            >
              {tz.label} ({tz.tz})
            </button>
          ))}
        </div>
      )}

      {/* World clock list */}
      {worldClocks.length === 0 ? (
        <div className="text-xs text-text-secondary text-center py-2">
          点击 + 添加时区
        </div>
      ) : (
        <div className="space-y-2">
          {worldClocks.map((wc) => {
            const { time, offset } = getTimeInTimezone(wc.timezone)
            return (
              <div
                key={wc.id}
                className="flex items-center justify-between bg-surface-hover rounded-lg px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{wc.label}</div>
                  <div className="text-[10px] text-text-secondary">{offset}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-mono font-bold">{time}</span>
                  <button
                    onClick={() => removeClock(wc.id)}
                    className="text-text-secondary hover:text-error transition-colors"
                  >
                    <FiX size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
