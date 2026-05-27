import { usePomodoroStore } from '@/store/pomodoro-store'

export default function SessionHistory() {
  const sessions = usePomodoroStore((s) => s.sessions)
  const today = new Date().toISOString().split('T')[0]
  const todaySessions = sessions.filter((s) => s.date === today)
  const workSessions = todaySessions.filter((s) => s.type === 'work')
  const totalMinutes = workSessions.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="bg-surface rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">今日统计</h3>
        <span className="text-xs text-text-secondary">
          {workSessions.length} 个番茄 · {totalMinutes} 分钟
        </span>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {todaySessions.map((s, i) => (
          <div
            key={s.id}
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
            style={{
              backgroundColor:
                s.type === 'work' ? 'var(--color-accent)' : 'var(--color-success)',
              opacity: 0.8
            }}
            title={`${s.type === 'work' ? '工作' : '休息'} ${s.duration}分钟`}
          >
            {s.type === 'work' ? '🍅' : '☕'}
          </div>
        ))}
        {todaySessions.length === 0 && (
          <span className="text-xs text-text-secondary">今天还没有完成的番茄钟</span>
        )}
      </div>
    </div>
  )
}
