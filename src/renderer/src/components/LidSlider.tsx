import { cx } from '../utils/cx'
import './LidSlider.scss'

interface Props {
  /** Lado da tela de cima: o CRT fica à direita (onde o 3DS tem o de 3D) e o volume à esquerda. */
  side: 'left' | 'right'
  label: string
  /** Descrição do controle, para leitores de tela e a dica do mouse (junto com o valor). */
  description: string
  value: number
  onChange(value: number): void
}

/** Slider vertical na lateral da tela de cima, com um LED que acende quando o valor passa de 0. */
export function LidSlider({ side, label, description, value, onChange }: Props) {
  return (
    <div className={cx('lid-slider', `lid-slider--${side}`)} title={`${description}: ${value}%`}>
      <span className="lid-slider__label">{label}</span>
      <input
        type="range"
        className="lid-slider__input"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={description}
        onChange={(event) => onChange(Number(event.target.value))}
        // Devolve o foco à página para as setas voltarem a navegar na lista.
        onPointerUp={(event) => event.currentTarget.blur()}
      />
      <span className={cx('lid-slider__led', value > 0 && 'lid-slider__led--on')} />
    </div>
  )
}
