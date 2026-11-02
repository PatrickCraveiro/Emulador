import type { Action, FaceButton } from '../types'
import { cx } from '../utils/cx'
import './ActionButtons.scss'

// Layout Nintendo: X em cima, Y à esquerda, A à direita e B embaixo.
const BUTTONS: Array<{ id: FaceButton; hint?: string }> = [
  { id: 'x', hint: 'Recarregar lista' },
  { id: 'y', hint: 'Jogo aleatório' },
  { id: 'a', hint: 'Jogar' },
  { id: 'b' }
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
          <span key={id} className={`action-buttons__socket action-buttons__socket--${id}`}>
            <button
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
          </span>
        )
      })}
    </div>
  )
}
