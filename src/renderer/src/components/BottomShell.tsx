import type { ReactNode } from 'react'
import './BottomShell.scss'

interface Props {
  dpad: ReactNode
  controls: ReactNode
  children: ReactNode
}

/** Metade de baixo do console: D-pad, tela do menu e botões. */
export function BottomShell({ dpad, controls, children }: Props) {
  return (
    <section className="bottom-shell">
      <div className="bottom-shell__side">{dpad}</div>
      <div className="screen-frame bottom-shell__screen-frame">{children}</div>
      <div className="bottom-shell__side">{controls}</div>
    </section>
  )
}
