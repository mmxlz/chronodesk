import { useState, useRef, useCallback } from 'react'
import { Note } from '@/types/note'
import { useNotesStore } from '@/store/notes-store'
import { FiX, FiCalendar } from 'react-icons/fi'

interface StickyNoteProps {
  note: Note
}

export default function StickyNote({ note }: StickyNoteProps) {
  const { updateNote, deleteNote, moveNote } = useNotesStore()
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return
      setIsDragging(true)
      dragOffset.current = { x: e.clientX - note.x, y: e.clientY - note.y }

      const handleMouseMove = (e: MouseEvent) => {
        moveNote(note.id, e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y)
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [note.id, note.x, note.y, moveNote]
  )

  return (
    <div
      className="absolute rounded-lg shadow-lg overflow-hidden flex flex-col"
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        backgroundColor: note.color + '22',
        borderLeft: `3px solid ${note.color}`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5" style={{ backgroundColor: note.color + '33' }}>
        <input
          value={note.title}
          onChange={(e) => updateNote(note.id, { title: e.target.value })}
          placeholder="标题"
          className="bg-transparent text-xs font-medium w-full outline-none"
          style={{ cursor: 'text' }}
        />
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const date = prompt('输入日期 (YYYY-MM-DD):', note.attachedDate || new Date().toISOString().split('T')[0])
              if (date) updateNote(note.id, { attachedDate: date })
            }}
            className="text-text-secondary hover:text-text transition-colors"
            title="关联到日期"
          >
            <FiCalendar size={12} />
          </button>
          <button
            onClick={() => deleteNote(note.id)}
            className="text-text-secondary hover:text-error transition-colors"
          >
            <FiX size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <textarea
        value={note.content}
        onChange={(e) => updateNote(note.id, { content: e.target.value })}
        placeholder="写点什么..."
        className="flex-1 bg-transparent p-2 text-sm resize-none outline-none"
        style={{ cursor: 'text' }}
      />

      {note.attachedDate && (
        <div className="px-2 py-1 text-[10px] text-text-secondary border-t border-border/30">
          📅 {note.attachedDate}
        </div>
      )}
    </div>
  )
}
