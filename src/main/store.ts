import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

interface StoreSchema {
  theme: {
    current: string
    customColors: Record<string, string>
    font: string
  }
  pomodoro: {
    workDuration: number
    breakDuration: number
    longBreakDuration: number
    sessionsBeforeLongBreak: number
    sessions: Array<{
      id: string
      date: string
      duration: number
      type: 'work' | 'break'
      completedAt: string
    }>
  }
  notes: Array<{
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
  }>
  settings: {
    alwaysOnTop: boolean
    minimizeToTray: boolean
    startupWithOS: boolean
  }
  window: {
    width: number
    height: number
    x?: number
    y?: number
  }
}

const defaults: StoreSchema = {
  theme: { current: 'dark', customColors: {}, font: 'Inter' },
  pomodoro: {
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    sessions: []
  },
  notes: [],
  settings: {
    alwaysOnTop: false,
    minimizeToTray: true,
    startupWithOS: false
  },
  window: { width: 1000, height: 700 }
}

let data: StoreSchema | null = null
let filePath: string | null = null

function getFilePath(): string {
  if (!filePath) {
    const dir = join(app.getPath('userData'), 'chronodesk')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    filePath = join(dir, 'config.json')
  }
  return filePath
}

function load(): StoreSchema {
  if (data) return data
  try {
    const raw = readFileSync(getFilePath(), 'utf-8')
    data = { ...defaults, ...JSON.parse(raw) }
  } catch {
    data = { ...defaults }
  }
  return data!
}

function save(): void {
  if (data) {
    writeFileSync(getFilePath(), JSON.stringify(data, null, 2), 'utf-8')
  }
}

export function getStore() {
  return {
    get(key: string): unknown {
      const d = load()
      return (d as any)[key]
    },
    set(key: string, value: unknown): void {
      const d = load()
      ;(d as any)[key] = value
      save()
    },
    delete(key: string): void {
      const d = load()
      delete (d as any)[key]
      save()
    }
  }
}
