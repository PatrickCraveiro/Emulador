import type { Action, SystemButton } from '../types'
import { cx } from '../utils/cx'
import './SystemButtons.scss'

const SMALL_BUTTONS: Array<{ id: Exclude<SystemButton, 'home'>; label: string; hint: string }> = [
  { id: 'start', label: 'Start', hint: 'Jogar' },
  { id: 'select', label: 'Select', hint: 'Trocar a cor do console' }
]

interface Props {
  pressed: Action | null
  onPress(button: SystemButton): void
}

/** START e SELECT à direita, como no DS, e HOME abaixo da tela, como no 3DS. */
export function SystemButtons({ pressed, onPress }: Props) {
  return (
    <>
      {SMALL_BUTTONS.map(({ id, label, hint }) => (
        <button
          key={id}
          type="button"
          tabIndex={-1}
          className={cx('system-button', `system-button--${id}`, pressed === id && 'is-pressed')}
          aria-label={`${label}: ${hint}`}
          title={`${label}: ${hint}`}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPress(id)}
        >
          <span className="system-button__cap" />
          <span className="system-button__label">{label}</span>
        </button>
      ))}

      <button
        type="button"
        tabIndex={-1}
        className={cx('home-button', pressed === 'home' && 'is-pressed')}
        aria-label="Home: minimizar"
        title="Home: minimizar"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPress('home')}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 7.5 8 3l5.5 4.5M4.5 6.5V13h7V6.5" />
        </svg>
      </button>
    </>
  )
}
