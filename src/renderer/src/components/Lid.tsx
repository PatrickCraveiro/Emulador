import type { ReactNode } from 'react'
import { CrtSlider } from './CrtSlider'
import './Lid.scss'

interface Props {
  crt: number
  onCrtChange(value: number): void
  children: ReactNode
}

/** Metade de cima do console: tela de preview, câmera, alto-falantes e controles da janela. */
export function Lid({ crt, onCrtChange, children }: Props) {
  return (
    <section className="lid">
      <span className="lid__brand">Emulador</span>

      <div className="lid__window-controls">
        <button
          type="button"
          className="lid__window-button"
          title="Abrir a pasta da biblioteca (ROMs e capas)"
          aria-label="Abrir a pasta da biblioteca"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => window.emulador.openLibraryFolder()}
        >
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M1.5 3V8h7V4H5L4 3Z" />
          </svg>
        </button>
        <button
          type="button"
          className="lid__window-button"
          title="Minimizar"
          aria-label="Minimizar"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => window.emulador.minimizeWindow()}
        >
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2 5h6" />
          </svg>
        </button>
        <button
          type="button"
          className="lid__window-button lid__window-button--close"
          title="Fechar"
          aria-label="Fechar"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => window.emulador.closeWindow()}
        >
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
          </svg>
        </button>
      </div>

      <span className="lid__speaker lid__speaker--left" aria-hidden="true" />
      <span className="lid__speaker lid__speaker--right" aria-hidden="true" />
      <CrtSlider value={crt} onChange={onCrtChange} />

      <div className="bezel lid__bezel">
        <span className="lid__camera" aria-hidden="true" />
        <div className="lid__screen">{children}</div>
      </div>
    </section>
  )
}
