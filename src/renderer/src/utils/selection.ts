const STORAGE_KEY = 'emulador:selecao'

export interface Selection {
  platformId: string
  gameId: string
}

/** Último jogo selecionado, para reabrir o app no mesmo lugar. */
export function loadSelection(): Selection | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    return typeof value?.platformId === 'string' && typeof value?.gameId === 'string' ? value : null
  } catch {
    return null
  }
}

export function saveSelection(selection: Selection): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selection))
}
