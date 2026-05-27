import { useState, useEffect } from 'react'
import { useThemeStore, CountdownEntry } from '@/store/theme-store'
import { v4 as uuidv4 } from 'uuid'
import { FiPlus, FiX, FiBell } from 'react-icons/fi'

function formatRemaining(ms: number): string {
  if (ms <= 0) return '已到期'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  const h = hours % 24
  const m = minutes % 60
  const s = seconds % 60

  if (days > 0) return `${days}天 ${h}时 ${m}分 ${s}秒`
  if (h > 0) return `${h}时 ${m}分 ${s}秒`
  return `${m}分 ${s}秒`
}

export default function CountdownTimer() {
  const { countdowns, addCountdown, removeCountdown } = useThemeStore()
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [, setTick] = useState(0)

  // Tick every second to update countdowns
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Check for expired countdowns and notify
  useEffect(() => {
    countdowns.forEach((c) => {
      const remaining = c.targetTime - Date.now()
      if (remaining <= 0 && remaining > -2000) {
        window.api.showNotification('倒计时结束', `${c.label} 已到期！`)
      }
    })
  }, [countdowns])

  const handleAdd = () => {
    if (!label.trim() || !dateTime) return
    const targetTime = new Date(dateTime).getTime()
    if (isNaN(targetTime)) return

    addCountdown({
      id: uuidv4(),
      label: label.trim(),
      targetTime
    })
    setLabel('')
    setDateTime('')
    setShowForm(false)
  }

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">倒计时</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-text-secondary hover:text-accent transition-colors"
        >
          <FiPlus size={16} />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-surface-hover rounded-lg p-3 space-y-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="名称（如：生日、考试）"
            className="w-full bg-surface text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full bg-surface text-text rounded-lg px-3 py-2 text-sm border border-border focus:border-primary outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-xs rounded-lg bg-accent text-white hover:opacity-90"
            >
              添加
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface text-text-secondary hover:text-text"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Countdown list */}
      {countdowns.length === 0 ? (
        <div className="text-xs text-text-secondary text-center py-2">
          点击 + 添加倒计时
        </div>
      ) : (
        <div className="space-y-2">
          {countdowns.map((c) => {
            const remaining = c.targetTime - Date.now()
            const expired = remaining <= 0

            return (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  expired ? 'bg-error/10 border border-error/30' : 'bg-surface-hover'
                }`}
              >
                <div className="flex items-center gap-2">
                  {expired ? (
                    <FiBell size={14} className="text-error" />
                  ) : (
                    <FiBell size={14} className="text-accent" />
                  )}
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-[10px] text-text-secondary">
                      {new Date(c.targetTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-mono font-bold ${
                      expired ? 'text-error' : 'text-accent'
                    }`}
                  >
                    {formatRemaining(remaining)}
                  </span>
                  <button
                    onClick={() => removeCountdown(c.id)}
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
