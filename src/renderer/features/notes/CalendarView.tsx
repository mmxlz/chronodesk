import { useState } from 'react'
import { useNotesStore } from '@/store/notes-store'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const notes = useNotesStore((s) => s.notes)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyCells = Array.from({ length: startDayOfWeek }, (_, i) => i)

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const getNotesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return notes.filter((n) => n.attachedDate === dateStr)
  }

  return (
    <div className="bg-surface rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-surface-hover rounded-lg transition-colors">
          <FiChevronLeft size={18} />
        </button>
        <h3 className="font-medium">
          {year}年 {monthNames[month]}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-surface-hover rounded-lg transition-colors">
          <FiChevronRight size={18} />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs text-text-secondary py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCells.map((i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dayNotes = getNotesForDay(day)
          const isToday =
            day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear()

          return (
            <div
              key={day}
              className={`min-h-[3rem] rounded-lg p-1 text-xs cursor-pointer transition-colors ${
                isToday ? 'bg-primary/20 border border-primary/50' : 'hover:bg-surface-hover'
              }`}
              title={dayNotes.map((n) => n.title || '无标题').join(', ')}
            >
              <div className={`font-medium ${isToday ? 'text-primary' : ''}`}>{day}</div>
              <div className="flex gap-0.5 flex-wrap mt-0.5">
                {dayNotes.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: n.color }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
