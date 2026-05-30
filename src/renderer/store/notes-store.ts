import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { Note } from '../types/note'
import { DEFAULT_NOTE_WIDTH, DEFAULT_NOTE_HEIGHT, NOTE_COLORS } from '../lib/constants'

interface NotesState {
  notes: Note[]
  addNote: (x?: number, y?: number) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  moveNote: (id: string, x: number, y: number) => void
  resizeNote: (id: string, width: number, height: number) => void
  getNotesByDate: (date: string) => Note[]
  hydrate: (data: Note[]) => void
}

function persistNotes(notes: Note[]) {
  if (!window.api) return
  window.api.storeSet('notes', notes).catch(console.error)
}

export const useNotesStore = create<NotesState>()((set, get) => ({
  notes: [],
  addNote: (x = 100, y = 100) => {
    const id = uuidv4()
    const note: Note = {
      id,
      title: '',
      content: '',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      x,
      y,
      width: DEFAULT_NOTE_WIDTH,
      height: DEFAULT_NOTE_HEIGHT,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    set((state) => ({ notes: [...state.notes, note] }))
    persistNotes(get().notes)
    return id
  },
  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n
      )
    }))
    persistNotes(get().notes)
  },
  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id)
    }))
    persistNotes(get().notes)
  },
  moveNote: (id, x, y) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, x, y, updatedAt: Date.now() } : n
      )
    }))
    persistNotes(get().notes)
  },
  resizeNote: (id, width, height) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, width, height, updatedAt: Date.now() } : n
      )
    }))
    persistNotes(get().notes)
  },
  getNotesByDate: (date) => {
    return get().notes.filter((n) => n.attachedDate === date)
  },
  hydrate: (data) => set({ notes: data })
}))
