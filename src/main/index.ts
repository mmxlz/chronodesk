import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window'
import { registerIpcHandlers } from './ipc-handlers'
import { createTray } from './tray'
import { startSystemMonitor, stopSystemMonitor } from './services/system-monitor'

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  mainWindow = createMainWindow()
  registerIpcHandlers(mainWindow)
  createTray(mainWindow)
  if (!__LIGHT_BUILD__) {
    startSystemMonitor(mainWindow)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
})

app.on('window-all-closed', () => {
  if (!__LIGHT_BUILD__) {
    stopSystemMonitor()
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createMainWindow()
    registerIpcHandlers(mainWindow)
    createTray(mainWindow)
    if (!__LIGHT_BUILD__) {
      startSystemMonitor(mainWindow)
    }
  }
})
