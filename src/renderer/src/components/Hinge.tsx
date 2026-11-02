import { cx } from '../utils/cx'
import './Hinge.scss'

/** Dobradiça entre as duas metades, com o microfone e os LEDs. */
export function Hinge({ on }: { on: boolean }) {
  return (
    <div className="hinge" aria-hidden="true">
      <div className="hinge__left" />
      <div className="hinge__middle">
        <span className="hinge__mic" />
        <span className="hinge__mic-label">mic.</span>
      </div>
      <div className="hinge__right">
        <span className="hinge__led" />
        <span className={cx('hinge__led', on && 'hinge__led--on')} />
      </div>
    </div>
  )
}
