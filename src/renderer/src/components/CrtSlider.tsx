import { cx } from '../utils/cx'
import './CrtSlider.scss'

interface Props {
  value: number
  onChange(value: number): void
}

/** Slider na lateral da tela de cima (onde o 3DS tem o de 3D): intensidade do filtro CRT. */
export function CrtSlider({ value, onChange }: Props) {
  return (
    <div className="crt-slider" title={`Filtro CRT: ${value}%`}>
      <span className="crt-slider__label">CRT</span>
      <input
        type="range"
        className="crt-slider__input"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label="Intensidade do filtro CRT"
        onChange={(event) => onChange(Number(event.target.value))}
        // Devolve o foco à página para as setas voltarem a navegar na lista.
        onPointerUp={(event) => event.currentTarget.blur()}
      />
      <span className={cx('crt-slider__led', value > 0 && 'crt-slider__led--on')} />
    </div>
  )
}
