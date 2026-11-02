import type { ReactNode } from 'react'
import './Base.scss'

interface Props {
  /** Botões e direcionais; cada um se posiciona pelo próprio CSS. */
  controls: ReactNode
  children: ReactNode
}

/** Metade de baixo do console: tela do menu cercada pelos controles. */
export function Base({ controls, children }: Props) {
  return (
    <section className="base">
      {controls}
      <div className="bezel base__bezel">
        <div className="base__screen">{children}</div>
      </div>
    </section>
  )
}
