import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, ipcMain, Menu, net, protocol } from 'electron'
import { IPC } from '@shared/ipc'
import type { LaunchResult } from '@shared/types'
import icon from '../../resources/icon.png?asset'
import { launchGame } from './launcher'
import { COVER_PROTOCOL, scanLibrary, type GameEntry } from './library'

/** Jogos da última leitura da biblioteca, indexados por id. */
let games = new Map<string, GameEntry>()

/**
 * Pasta com `plataformas.json`, ROMs, emuladores e capas. Em desenvolvimento fica
 * na raiz do projeto; no app empacotado, ao lado do executável.
 */
function libraryRoot(): string {
  const base = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath()
  return path.join(base, 'plataforma')
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: false,
    maximizable: false,
    frame: false,
    transparent: true,
    show: false,
    title: 'Emulador',
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    window.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    window.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  return window
}

function registerIpc(): void {
  ipcMain.handle(IPC.getLibrary, async () => {
    const result = await scanLibrary(libraryRoot())
    games = result.entries
    return result.library
  })

  ipcMain.handle(IPC.launchGame, async (_event, gameId: unknown): Promise<LaunchResult> => {
    const entry = typeof gameId === 'string' ? games.get(gameId) : undefined
    if (!entry) return { ok: false, error: 'Jogo não encontrado. Recarregue a lista.' }
    return launchGame(entry)
  })

  ipcMain.on(IPC.minimizeWindow, (event) => BrowserWindow.fromWebContents(event.sender)?.minimize())
  ipcMain.on(IPC.closeWindow, (event) => BrowserWindow.fromWebContents(event.sender)?.close())
}

/** Serve as capas para a interface sem expor o sistema de arquivos ao renderer. */
function registerCoverProtocol(): void {
  protocol.handle(COVER_PROTOCOL, (request) => {
    const gameId = new URL(request.url).pathname.slice(1)
    const coverPath = games.get(gameId)?.coverPath
    if (!coverPath) return new Response(null, { status: 404 })
    return net.fetch(pathToFileURL(coverPath).toString())
  })
}

protocol.registerSchemesAsPrivileged([
  { scheme: COVER_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } }
])

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.focus()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.patrickcraveiro.emulador')
    if (app.isPackaged) Menu.setApplicationMenu(null)
    registerIpc()
    registerCoverProtocol()
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
