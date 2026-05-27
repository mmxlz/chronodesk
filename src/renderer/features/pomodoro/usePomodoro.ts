import { useEffect, useRef, useCallback } from 'react'
import { usePomodoroStore } from '@/store/pomodoro-store'
import { v4 as uuidv4 } from 'uuid'

export function usePomodoro() {
  const store = usePomodoroStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (store.status === 'idle') {
      store.setStatus('running')
      store.setTimeRemaining(store.settings.workDuration * 60)
    } else if (store.status === 'paused') {
      store.setStatus('running')
    }
  }, [store])

  const pause = useCallback(() => {
    store.setStatus('paused')
  }, [store])

  const reset = useCallback(() => {
    store.reset()
  }, [store])

  const skip = useCallback(() => {
    store.nextSession()
  }, [store])

  useEffect(() => {
    if (store.status === 'running' || store.status === 'break') {
      intervalRef.current = setInterval(() => {
        const state = usePomodoroStore.getState()
        if (state.timeRemaining <= 0) {
          // Session complete
          const isWork = state.status === 'running'
          state.addSession({
            id: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            duration: isWork ? state.settings.workDuration : state.settings.breakDuration,
            type: isWork ? 'work' : 'break',
            completedAt: new Date().toISOString()
          })

          if (isWork) {
            window.api.showNotification('休息时间到！', '辛苦了，休息一下吧~')
          } else {
            window.api.showNotification('休息结束！', '准备好继续了吗？')
          }

          state.nextSession()
        } else {
          state.decrement()
        }
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [store.status])

  return { start, pause, reset, skip }
}
