import './PowerSwitch.scss'

interface Props {
  on: boolean
  onChange(on: boolean): void
}

export function PowerSwitch({ on, onChange }: Props) {
  return (
    // O clique não dá foco ao switch: o contorno de foco fica só para quem navega com Tab.
    <label className="power-switch" onMouseDown={(event) => event.preventDefault()}>
      <span className="power-switch__label">Power</span>
      <input
        type="checkbox"
        role="switch"
        className="power-switch__input"
        checked={on}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}
