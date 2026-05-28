import { BrowserWindow, Tray, Menu, nativeImage, app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { getStore } from './store'

let tray: Tray | null = null

function createTrayIcon(): Electron.NativeImage {
  const iconPath = join(__dirname, '../../build/tray-icon.png')
  if (existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  }
  // Fallback: create a simple 16x16 icon from data
  const size = 16
  const buffer = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const cx = x - size / 2
      const cy = y - size / 2
      const dist = Math.sqrt(cx * cx + cy * cy)
      if (dist < 7) {
        buffer[i] = 6       // R
        buffer[i + 1] = 182 // G
        buffer[i + 2] = 212 // B
        buffer[i + 3] = 255 // A
      } else {
        buffer[i + 3] = 0
      }
    }
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size })
}

export function createTray(mainWindow: BrowserWindow): Tray {
  const icon = createTrayIcon()
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 ChronoDesk',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      }
    },
    { type: 'separator' },
    {
      label: '置顶窗口',
      type: 'checkbox',
      checked: mainWindow.isAlwaysOnTop(),
      click: () => {
        const isOnTop = mainWindow.isAlwaysOnTop()
        mainWindow.setAlwaysOnTop(!isOnTop)
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        ;(app as any).isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('ChronoDesk')
  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('close', (event) => {
    if (!(app as any).isQuitting) {
      const store = getStore()
      const settings = store.get('settings') as { minimizeToTray?: boolean } | undefined
      if (settings?.minimizeToTray !== false) {
        event.preventDefault()
        mainWindow.hide()
      }
    }
  })

  return tray
}
