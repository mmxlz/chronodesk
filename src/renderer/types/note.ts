export interface Note {
  id: string
  title: string
  content: string
  color: string
  x: number
  y: number
  width: number
  height: number
  attachedDate?: string
  createdAt: number
  updatedAt: number
}

export type NoteColor = '#fbbf24' | '#f472b6' | '#60a5fa' | '#34d399' | '#a78bfa' | '#fb923c'
