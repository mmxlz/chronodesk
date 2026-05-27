import { useNotesStore } from '@/store/notes-store'
import StickyNote from './StickyNote'
import { FiPlus } from 'react-icons/fi'

export default function NotesBoard() {
  const { notes, addNote } = useNotesStore()

  return (
    <div className="relative min-h-full">
      {/* Add note button */}
      <button
        onClick={() => addNote(50 + Math.random() * 200, 50 + Math.random() * 200)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-50"
      >
        <FiPlus size={24} />
      </button>

      {/* Notes */}
      {notes
        .filter((n) => !n.attachedDate)
        .map((note) => (
          <StickyNote key={note.id} note={note} />
        ))}

      {notes.filter((n) => !n.attachedDate).length === 0 && (
        <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
          点击右下角 + 创建便签
        </div>
      )}
    </div>
  )
}
