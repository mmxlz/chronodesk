import { BrowserWindow, ipcMain, Notification, app } from 'electron'
import { join } from 'path'
import { getStore } from './store'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  const store = getStore()

  // Window control
  ipcMain.handle('window:toggleAlwaysOnTop', () => {
    const isOnTop = mainWindow.isAlwaysOnTop()
    mainWindow.setAlwaysOnTop(!isOnTop)
    return !isOnTop
  })

  ipcMain.handle('window:minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow.isMaximized()
  })

  // Store
  ipcMain.handle('store:get', (_event, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
  })

  ipcMain.handle('store:delete', (_event, key: string) => {
    store.delete(key)
  })

  // Notification
  ipcMain.handle('notification:show', (_event, title: string, body: string) => {
    new Notification({ title, body }).show()
  })

  // Sound
  ipcMain.handle('sound:play', (_event, soundName: string) => {
    const soundPath = join(__dirname, '../../resources/sounds', soundName)
    mainWindow.webContents.send('sound:playFile', soundPath)
  })

  // App info
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:getPath', () => {
    return app.getPath('userData')
  })
}
