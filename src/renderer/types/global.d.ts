import type { StaticSystemInfo, SystemStats } from './monitor'

declare global {
  interface Window {
    api: {
      getStaticInfo: () => Promise<StaticSystemInfo>
      onStatsUpdate: (callback: (stats: SystemStats) => void) => () => void
      toggleAlwaysOnTop: () => Promise<boolean>
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
      storeGet: <T = unknown>(key: string) => Promise<T>
      storeSet: (key: string, value: unknown) => Promise<void>
      storeDelete: (key: string) => Promise<void>
      showNotification: (title: string, body: string) => Promise<void>
      playSound: (name: string) => Promise<void>
      onPlaySoundFile: (callback: (path: string) => void) => () => void
      getAppVersion: () => Promise<string>
      getUserDataPath: () => Promise<string>
    }
  }
}

export {}
