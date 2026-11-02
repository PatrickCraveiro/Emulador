import { cx } from '../utils/cx'
import './Hinge.scss'

interface Props {
  on: boolean
  /** Pisca enquanto um jogo está sendo aberto. */
  busy: boolean
}

/** Dobradiça entre as duas metades, com o microfone e os LEDs. */
export function Hinge({ on, busy }: Props) {
  return (
    <div className="hinge">
      <span className="hinge__knuckle hinge__knuckle--left" />
      <div className="hinge__center" aria-hidden="true">
        <span className="hinge__mic" />
        <span className="hinge__mic-label">mic</span>
      </div>
      <span className="hinge__knuckle hinge__knuckle--right">
        <span className={cx('hinge__led', on && 'hinge__led--power')} title={on ? 'Ligado' : 'Desligado'} />
        <span className={cx('hinge__led', busy && 'hinge__led--busy')} title="Atividade" />
      </span>
    </div>
  )
}
