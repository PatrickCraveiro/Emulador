/** Preferências salvas entre sessões (localStorage). Valores inválidos voltam ao padrão. */
export function loadPreference<T>(key: string, isValid: (value: unknown) => value is T, fallback: T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(`emulador:${key}`) ?? 'null')
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function savePreference(key: string, value: unknown): void {
  localStorage.setItem(`emulador:${key}`, JSON.stringify(value))
}

export interface Selection {
  platformId: string
  gameId: string
}

export function isSelection(value: unknown): value is Selection {
  const v = value as Partial<Selection> | null
  return typeof v?.platformId === 'string' && typeof v?.gameId === 'string'
}

export function isPercentage(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && value <= 100
}
