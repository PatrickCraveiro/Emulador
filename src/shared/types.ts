export interface Game {
  id: string
  title: string
  platformId: string
  /** URL da capa (protocolo `cover://`) ou `null` se não houver imagem. */
  coverUrl: string | null
}

export interface Platform {
  id: string
  name: string
  /** Pasta das ROMs, relativa à pasta `plataforma/`, como está no arquivo de configuração. */
  romsDir: string
  games: Game[]
  /** Problema de configuração que não impede a listagem (ex.: emulador ausente). */
  warning?: string
}

export interface Library {
  platforms: Platform[]
  /** Faixas da música ambiente do menu (protocolo `music://`), em ordem. */
  music: string[]
  /** Erro que impediu a leitura da biblioteca (ex.: `plataformas.json` inválido). */
  error?: string
}

export type LaunchResult = { ok: true } | { ok: false; error: string }

/** API exposta pelo preload em `window.emulador`. */
export interface EmuladorApi {
  getLibrary(): Promise<Library>
  launchGame(gameId: string): Promise<LaunchResult>
  /**
   * Avisa quando a música ambiente deve parar (um jogo aberto pelo launcher está rodando ou a
   * janela está minimizada) e quando pode voltar; devolve a função que cancela o aviso.
   */
  onMusicHold(listener: (hold: boolean) => void): () => void
  /** Abre a pasta da biblioteca no Explorer (para adicionar ROMs e capas). */
  openLibraryFolder(): void
  minimizeWindow(): void
  closeWindow(): void
}
