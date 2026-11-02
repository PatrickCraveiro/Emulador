import { cx } from '../utils/cx'
import './PowerButton.scss'

interface Props {
  on: boolean
  onToggle(): void
}

export function PowerButton({ on, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={cx('power-button', on && 'power-button--on')}
      title={on ? 'Desligar' : 'Ligar'}
      // O clique não dá foco: o contorno de foco fica só para quem navega com Tab.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
    >
      <span className="power-button__cap">
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 2.5V8M4.6 4.4a5 5 0 1 0 6.8 0" />
        </svg>
      </span>
      <span className="power-button__label">Power</span>
    </button>
  )
}
