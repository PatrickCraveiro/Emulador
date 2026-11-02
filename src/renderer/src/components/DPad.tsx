import type { Action, Direction } from '../types'
import { cx } from '../utils/cx'
import './DPad.scss'

const ARMS: Array<{ direction: Direction; label: string }> = [
  { direction: 'up', label: 'Cima' },
  { direction: 'left', label: 'Esquerda (plataforma anterior)' },
  { direction: 'right', label: 'Direita (próxima plataforma)' },
  { direction: 'down', label: 'Baixo' }
]

interface Props {
  pressed: Action | null
  onPress(direction: Direction): void
}

export function DPad({ pressed, onPress }: Props) {
  return (
    <div className="dpad">
      <div className="dpad__cross">
        {ARMS.map(({ direction, label }) => (
          <button
            key={direction}
            type="button"
            tabIndex={-1}
            aria-label={label}
            title={label}
            className={cx('dpad__arm', `dpad__arm--${direction}`, pressed === direction && 'is-pressed')}
            // Sem foco: senão o Enter "clicaria" o botão além de abrir o jogo.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onPress(direction)}
          />
        ))}
        <span className="dpad__center" aria-hidden="true" />
      </div>
    </div>
  )
}
