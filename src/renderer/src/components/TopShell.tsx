import type { ReactNode } from 'react'
import './TopShell.scss'

/** Metade de cima do console: câmera, alto-falantes e a tela de preview. */
export function TopShell({ children }: { children: ReactNode }) {
  return (
    <section className="top-shell">
      <button
        type="button"
        className="top-shell__square top-shell__square--tl window-button"
        title="Minimizar"
        aria-label="Minimizar"
        onClick={() => window.emulador.minimizeWindow()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 5h6" />
        </svg>
      </button>
      <button
        type="button"
        className="top-shell__square top-shell__square--tr window-button window-button--close"
        title="Fechar"
        aria-label="Fechar"
        onClick={() => window.emulador.closeWindow()}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" />
        </svg>
      </button>
      <span className="top-shell__square top-shell__square--bl" />
      <span className="top-shell__square top-shell__square--br" />

      <span className="top-shell__detail top-shell__detail--left" />
      <span className="top-shell__detail top-shell__detail--right" />
      <span className="top-shell__finish top-shell__finish--left" />
      <span className="top-shell__finish top-shell__finish--right" />

      <div className="top-shell__camera">
        <div className="top-shell__camera-ring">
          <div className="top-shell__camera-lens" />
        </div>
      </div>
      <Speaker side="left" />
      <Speaker side="right" />

      <div className="screen-frame top-shell__screen-frame">{children}</div>
    </section>
  )
}

function Speaker({ side }: { side: 'left' | 'right' }) {
  return (
    <div className={`top-shell__speaker top-shell__speaker--${side}`} aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  )
}
