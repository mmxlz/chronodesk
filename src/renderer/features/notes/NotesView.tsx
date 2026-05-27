import { useState } from 'react'
import NotesBoard from './NotesBoard'
import CalendarView from './CalendarView'
import { cn } from '@/lib/cn'

export default function NotesView() {
  const [tab, setTab] = useState<'board' | 'calendar'>('board')

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-3">
        <button
          onClick={() => setTab('board')}
          className={cn(
            'px-4 py-1.5 text-sm rounded-t-lg transition-colors',
            tab === 'board'
              ? 'bg-surface text-text border-b-2 border-accent'
              : 'text-text-secondary hover:text-text'
          )}
        >
          便签板
        </button>
        <button
          onClick={() => setTab('calendar')}
          className={cn(
            'px-4 py-1.5 text-sm rounded-t-lg transition-colors',
            tab === 'calendar'
              ? 'bg-surface text-text border-b-2 border-accent'
              : 'text-text-secondary hover:text-text'
          )}
        >
          日历
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {tab === 'board' ? <NotesBoard /> : <CalendarView />}
      </div>
    </div>
  )
}
