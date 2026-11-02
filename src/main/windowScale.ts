import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { app, screen, type BrowserWindow, type Display } from 'electron'

/** Tamanho da página em escala 1: o layout do console é desenhado nessa medida. */
export const BASE_WIDTH = 900
export const BASE_HEIGHT = 904

const MIN_SCALE = 0.5
const STEP = 0.1
const SCREEN_MARGIN = 24

/** Maior escala em que a janela inteira cabe na área útil da tela. */
function fitScale(display: Display): number {
  const { width, height } = display.workAreaSize
  return Math.min((width - SCREEN_MARGIN) / BASE_WIDTH, (height - SCREEN_MARGIN) / BASE_HEIGHT)
}

function clampScale(scale: number, display: Display): number {
  const rounded = Math.round(scale * 100) / 100
  return Math.min(fitScale(display), Math.max(MIN_SCALE, rounded))
}

const settingsFile = () => path.join(app.getPath('userData'), 'janela.json')

function loadSavedScale(): number | undefined {
  try {
    const { scale } = JSON.parse(readFileSync(settingsFile(), 'utf8'))
    return typeof scale === 'number' ? scale : undefined
  } catch {
    return undefined
  }
}

function saveScale(scale: number): void {
  try {
    writeFileSync(settingsFile(), JSON.stringify({ scale }))
  } catch {
    // Preferência opcional: se não der para salvar, o app só volta ao tamanho padrão.
  }
}

/** Escala inicial: a última escolhida pelo usuário ou 100%, sem passar do tamanho da tela. */
export function initialScale(): number {
  const display = screen.getPrimaryDisplay()
  return clampScale(loadSavedScale() ?? 1, display)
}

export function windowSize(scale: number) {
  return { width: Math.round(BASE_WIDTH * scale), height: Math.round(BASE_HEIGHT * scale) }
}

/**
 * Zoom do console inteiro: Ctrl + roda do mouse ou Ctrl +/−/0 redimensionam a janela
 * e aplicam o mesmo fator na página, mantendo o layout intacto.
 */
export function enableScaling(window: BrowserWindow, initial: number): void {
  let scale = initial

  const apply = (requested: number) => {
    const bounds = window.getBounds()
    const display = screen.getDisplayMatching(bounds)
    const next = clampScale(requested, display)
    if (next === scale) return

    const { width, height } = windowSize(next)
    const area = display.workArea
    // Redimensiona a partir do centro, sem deixar a janela sair da tela.
    const x = Math.round(bounds.x + (bounds.width - width) / 2)
    const y = Math.round(bounds.y + (bounds.height - height) / 2)
    window.setBounds({
      x: Math.min(Math.max(x, area.x), area.x + area.width - width),
      y: Math.min(Math.max(y, area.y), area.y + area.height - height),
      width,
      height
    })
    window.webContents.setZoomFactor(next)
    scale = next
    saveScale(next)
  }

  window.webContents.on('did-finish-load', () => {
    window.webContents.setZoomFactor(scale)
    void window.webContents.setVisualZoomLevelLimits(1, 1)
  })

  window.webContents.on('zoom-changed', (_event, direction) => {
    apply(scale + (direction === 'in' ? STEP : -STEP))
  })

  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || !(input.control || input.meta)) return
    if (input.key === '=' || input.key === '+') apply(scale + STEP)
    else if (input.key === '-') apply(scale - STEP)
    else if (input.key === '0') apply(1)
    else return
    event.preventDefault()
  })
}
