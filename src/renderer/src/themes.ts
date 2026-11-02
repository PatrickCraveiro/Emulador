/** Cores do console (as variáveis de cada tema ficam em styles/themes.scss). */
export const THEMES = [
  { id: 'aqua', name: 'Aqua' },
  { id: 'branco', name: 'Branco' },
  { id: 'preto', name: 'Preto' },
  { id: 'vermelho', name: 'Vermelho' }
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value)
}

export function nextTheme(current: ThemeId) {
  const index = THEMES.findIndex((theme) => theme.id === current)
  return THEMES[(index + 1) % THEMES.length]
}
