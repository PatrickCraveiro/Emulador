import { useEffect, useEffectEvent } from 'react'
import type { Action } from '../types'

const KEY_ACTIONS: Record<string, Action> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  PageUp: 'pageUp',
  PageDown: 'pageDown',
  Home: 'first',
  End: 'last',
  Enter: 'a',
  F5: 'x'
}

// Mapeamento "standard" da Gamepad API, pela posição física (A = botão de baixo, como no Xbox).
const GAMEPAD_BUTTONS: Record<number, Action> = {
  0: 'a',
  1: 'b',
  2: 'x',
  3: 'y',
  8: 'select',
  9: 'start',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
  16: 'home'
}

const REPEATABLE = new Set<Action>(['up', 'down', 'left', 'right', 'pageUp', 'pageDown'])
const STICK_DEADZONE = 0.5
const REPEAT_DELAY_MS = 350
const REPEAT_INTERVAL_MS = 90

interface Options {
  enabled: boolean
  onAction(action: Action): void
  /** Letra, número ou espaço digitado, usado na busca por digitação. */
  onType(char: string): void
}

/** Teclado e controles (gamepad) → ações do menu. */
export function useControls({ enabled, onAction, onType }: Options): void {
  const handleAction = useEffectEvent(onAction)
  const handleType = useEffectEvent(onType)

  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.altKey || event.metaKey) return
      // Com um controle da interface em foco (ex.: via Tab), ele cuida das próprias teclas.
      if (event.target instanceof Element && event.target.closest('button, input')) return
      const action = KEY_ACTIONS[event.key]
      if (action) {
        event.preventDefault()
        if (!event.repeat || REPEATABLE.has(action)) handleAction(action)
      } else if (/^[\p{L}\p{N} ]$/u.test(event.key)) {
        handleType(event.key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    // Próximo instante em que cada ação segurada deve se repetir.
    const held = new Map<Action, number>()
    let wasFocused = document.hasFocus()
    let frame = 0

    const poll = (now: number) => {
      if (!navigator.getGamepads().some(Boolean)) {
        frame = 0
        held.clear()
        return
      }
      frame = requestAnimationFrame(poll)

      // Sem foco (ex.: jogando no emulador) o launcher ignora o controle.
      const focused = document.hasFocus()
      const active = focused ? readGamepads() : new Set<Action>()

      for (const action of held.keys()) {
        if (!active.has(action)) held.delete(action)
      }
      for (const action of active) {
        const next = held.get(action)
        if (next === undefined) {
          // Botão que já estava pressionado quando a janela recuperou o foco:
          // só vale depois de solto, para não abrir um jogo sem querer.
          if (!wasFocused) {
            held.set(action, Infinity)
            continue
          }
          handleAction(action)
          held.set(action, REPEATABLE.has(action) ? now + REPEAT_DELAY_MS : Infinity)
        } else if (now >= next) {
          handleAction(action)
          held.set(action, now + REPEAT_INTERVAL_MS)
        }
      }
      wasFocused = focused
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(poll)
    }

    start()
    window.addEventListener('gamepadconnected', start)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('gamepadconnected', start)
    }
  }, [enabled])
}

function readGamepads(): Set<Action> {
  const active = new Set<Action>()
  for (const pad of navigator.getGamepads()) {
    if (!pad) continue
    pad.buttons.forEach((button, index) => {
      const action = GAMEPAD_BUTTONS[index]
      if (action && button.pressed) active.add(action)
    })
    const [x = 0, y = 0] = pad.axes
    if (y <= -STICK_DEADZONE) active.add('up')
    if (y >= STICK_DEADZONE) active.add('down')
    if (x <= -STICK_DEADZONE) active.add('left')
    if (x >= STICK_DEADZONE) active.add('right')
  }
  return active
}
