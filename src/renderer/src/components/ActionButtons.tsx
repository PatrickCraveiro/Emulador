import type { Action, FaceButton } from '../types'
import { cx } from '../utils/cx'
import './ActionButtons.scss'

const BUTTONS: Array<{ id: FaceButton; hint?: string }> = [
  { id: 'y', hint: 'Jogo aleatório' },
  { id: 'x', hint: 'Recarregar lista' },
  { id: 'b' },
  { id: 'a', hint: 'Jogar' }
]

interface Props {
  pressed: Action | null
  onPress(button: FaceButton): void
}

export function ActionButtons({ pressed, onPress }: Props) {
  return (
    <div className="action-buttons">
      {BUTTONS.map(({ id, hint }) => {
        const label = hint ? `${id.toUpperCase()}: ${hint}` : id.toUpperCase()
        return (
          <button
            key={id}
            type="button"
            tabIndex={-1}
            aria-label={label}
            title={label}
            className={cx(
              'action-buttons__button',
              `action-buttons__button--${id}`,
              pressed === id && 'is-pressed'
            )}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPress(id)}
          >
            {id.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}
