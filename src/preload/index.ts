import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc'
import type { EmuladorApi } from '@shared/types'

const api: EmuladorApi = {
  getLibrary: () => ipcRenderer.invoke(IPC.getLibrary),
  launchGame: (gameId) => ipcRenderer.invoke(IPC.launchGame, gameId),
  onMusicHold: (listener) => {
    const handler = (_event: Electron.IpcRendererEvent, hold: boolean) => listener(hold)
    ipcRenderer.on(IPC.musicHold, handler)
    return () => ipcRenderer.removeListener(IPC.musicHold, handler)
  },
  openLibraryFolder: () => ipcRenderer.send(IPC.openLibraryFolder),
  minimizeWindow: () => ipcRenderer.send(IPC.minimizeWindow),
  closeWindow: () => ipcRenderer.send(IPC.closeWindow)
}

contextBridge.exposeInMainWorld('emulador', api)
