import { app, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { registerIpcHandlers } from './ipc.js'

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

function getAppIconPath(): string {
  if (process.platform === 'win32') {
    return join(app.getAppPath(), 'branding', 'app', 'app-icon.ico')
  }

  return join(app.getAppPath(), 'branding', 'png', 'light', 'icon-512.png')
}

async function createWindow(): Promise<void> {
  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#f6f1e8',
    icon: getAppIconPath(),
    webPreferences: {
      preload: join(app.getAppPath(), 'dist-electron', 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  registerIpcHandlers(window)

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await window.loadURL(process.env.VITE_DEV_SERVER_URL)
    window.webContents.openDevTools({ mode: 'detach' })
    return
  }

  await window.loadFile(join(app.getAppPath(), 'dist', 'index.html'))
}

app.whenReady().then(async () => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(getAppIconPath())
  }

  await createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
