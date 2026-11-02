export const IPC = {
  getLibrary: 'library:get',
  launchGame: 'game:launch',
  /** Do processo principal para a interface: segurar a música (jogo aberto ou launcher minimizado). */
  musicHold: 'music:hold',
  openLibraryFolder: 'library:open-folder',
  minimizeWindow: 'window:minimize',
  closeWindow: 'window:close'
} as const
