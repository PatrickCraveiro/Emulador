import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, ipcMain, Menu, net, protocol, shell } from 'electron'
import { IPC } from '@shared/ipc'
import type { LaunchResult, Library } from '@shared/types'
import iconIco from '../../resources/icon.ico?asset'
import iconPng from '../../resources/icon.png?asset'
import { launchGame } from './launcher'
import { COVER_PROTOCOL, scanLibrary, type GameEntry } from './library'
import { syncBundledLibrary } from './librarySync'
import { enableScaling, initialScale, windowSize } from './windowScale'

/** No Windows, o .ico traz cada tamanho desenhado à parte (16 e 24 px em pixel art). */
const icon = process.platform === 'win32' ? iconIco : iconPng

/** Jogos da última leitura da biblioteca, indexados por id. */
let games = new Map<string, GameEntry>()

/** Cópia da biblioteca do instalador para a pasta do usuário (só no app instalado). */
let libraryReady: Promise<void> = Promise.resolve()
let libraryError: Error | null = null

/**
 * Pasta com `plataformas.json`, ROMs, emuladores e capas. Em desenvolvimento é a pasta
 * `plataforma/` do projeto. No app instalado fica na pasta de dados do usuário: assim
 * sobrevive a atualizações e à desinstalação, e os emuladores podem gravar os saves.
 */
function libraryRoot(): string {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'biblioteca')
    : path.join(app.getAppPath(), 'plataforma')
}

async function prepareLibrary(): Promise<void> {
  if (!app.isPackaged) return
  await syncBundledLibrary(
    path.join(process.resourcesPath, 'plataforma'),
    libraryRoot(),
    path.join(app.getPath('userData'), 'plataformas.instalado.json'),
    path.join(app.getPath('userData'), 'controles.instalados.json')
  )
}

function createWindow(): BrowserWindow {
  const scale = initialScale()
  const window = new BrowserWindow({
    ...windowSize(scale),
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    show: false,
    title: 'Emulador',
    icon,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      zoomFactor: scale
    }
  })

  enableScaling(window, scale)
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
  ipcMain.handle(IPC.getLibrary, async (): Promise<Library> => {
    await libraryReady
    if (libraryError) {
      return { platforms: [], error: `Não foi possível preparar a biblioteca: ${libraryError.message}` }
    }
    const result = await scanLibrary(libraryRoot())
    games = result.entries
    return result.library
  })

  ipcMain.handle(IPC.launchGame, async (_event, gameId: unknown): Promise<LaunchResult> => {
    const entry = typeof gameId === 'string' ? games.get(gameId) : undefined
    if (!entry) return { ok: false, error: 'Jogo não encontrado. Recarregue a lista.' }
    return launchGame(entry)
  })

  ipcMain.on(IPC.openLibraryFolder, () => {
    void libraryReady.then(() => shell.openPath(libraryRoot()))
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

// A trava de instância única e as preferências ficam na pasta de dados. Em desenvolvimento
// (npm start / npm run dev) ela é separada, para não disputar com o app instalado.
// EMULADOR_USER_DATA permite abrir mais uma instância isolada (ex.: testes automatizados).
if (process.env.EMULADOR_USER_DATA) {
  app.setPath('userData', path.resolve(process.env.EMULADOR_USER_DATA))
} else if (!app.isPackaged) {
  app.setPath('userData', path.join(app.getPath('appData'), 'Emulador (dev)'))
}

if (!app.requestSingleInstanceLock()) {
  // A instância que já está aberta recebe 'second-instance' e vem para a frente.
  console.log('O Emulador já está aberto: a janela existente foi trazida para a frente.')
  app.quit()
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows()
    if (!window) return
    if (window.isMinimized()) window.restore()
    window.show()
    window.focus()
  })

  app.whenReady().then(() => {
    // O atalho do app instalado leva este id, e a barra de tarefas desenha a janela com o
    // ícone do atalho. A cópia de desenvolvimento usa outro id para mostrar o próprio ícone
    // (e não se juntar ao botão do app instalado).
    app.setAppUserModelId(app.isPackaged ? 'com.patrickcraveiro.emulador' : 'com.patrickcraveiro.emulador.dev')
    if (app.isPackaged) Menu.setApplicationMenu(null)
    // Na primeira execução a cópia leva alguns segundos: a janela abre logo e a lista
    // aparece quando a biblioteca estiver pronta.
    libraryReady = prepareLibrary().catch((error: Error) => {
      libraryError = error
    })
    registerIpc()
    registerCoverProtocol()
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
