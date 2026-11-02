import type { MouseEvent } from 'react'
import type { Action, Direction } from '../types'
import { cx } from '../utils/cx'
import './CirclePad.scss'

interface Props {
  pressed: Action | null
  onPress(direction: Direction): void
}

/** Analógico decorativo: inclina junto com as setas e aceita clique na direção desejada. */
export function CirclePad({ pressed, onPress }: Props) {
  const tilt = pressed === 'up' || pressed === 'down' || pressed === 'left' || pressed === 'right' ? pressed : null

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    if (Math.abs(dx) > Math.abs(dy)) onPress(dx < 0 ? 'left' : 'right')
    else onPress(dy < 0 ? 'up' : 'down')
  }

  return (
    <button
      type="button"
      tabIndex={-1}
      className={cx('circle-pad', tilt && `circle-pad--${tilt}`)}
      aria-label="Analógico (clique na direção)"
      title="Analógico"
      onMouseDown={(event) => event.preventDefault()}
      onClick={handleClick}
    >
      <span className="circle-pad__nub" />
    </button>
  )
}
