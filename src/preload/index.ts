import { contextBridge, ipcRenderer } from 'electron'
import { SystemStats } from '../shared/monitor'

const api = {
  // System
  getStaticInfo: () => ipcRenderer.invoke('system:getStaticInfo'),
  onStatsUpdate: (callback: (stats: SystemStats) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, stats: SystemStats) => callback(stats)
    ipcRenderer.on('system:statsUpdate', handler)
    return () => ipcRenderer.removeListener('system:statsUpdate', handler)
  },

  // Window
  toggleAlwaysOnTop: (): Promise<boolean> => ipcRenderer.invoke('window:toggleAlwaysOnTop'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),

  // Store
  storeGet: <T = unknown>(key: string): Promise<T> => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
  storeDelete: (key: string) => ipcRenderer.invoke('store:delete', key),

  // Notification
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('notification:show', title, body),

  // Sound
  playSound: (name: string) => ipcRenderer.invoke('sound:play', name),
  onPlaySoundFile: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path)
    ipcRenderer.on('sound:playFile', handler)
    return () => ipcRenderer.removeListener('sound:playFile', handler)
  },
  onStoreFlush: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('store:flush', handler)
    return () => ipcRenderer.removeListener('store:flush', handler)
  },

  // App info
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  getUserDataPath: (): Promise<string> => ipcRenderer.invoke('app:getPath')
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
