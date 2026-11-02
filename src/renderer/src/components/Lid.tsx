import type { ReactNode } from 'react'
import { cx } from '../utils/cx'
import { LidSlider } from './LidSlider'
import './Lid.scss'

interface Props {
  crt: number
  onCrtChange(value: number): void
  music: boolean
  onToggleMusic(): void
  volume: number
  onVolumeChange(value: number): void
  children: ReactNode
}

/** Metade de cima do console: tela de preview, câmera, alto-falantes e controles da janela. */
export function Lid({ crt, onCrtChange, music, onToggleMusic, volume, onVolumeChange, children }: Props) {
  const speakerHint = music ? 'Música ambiente: desligar (B)' : 'Música ambiente: ligar (B)'
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

      {(['left', 'right'] as const).map((side) => (
        <button
          key={side}
          type="button"
          tabIndex={-1}
          className={cx('lid__speaker', `lid__speaker--${side}`, (!music || volume === 0) && 'is-muted')}
          title={speakerHint}
          aria-label={speakerHint}
          aria-pressed={music}
          onMouseDown={(event) => event.preventDefault()}
          onClick={onToggleMusic}
        />
      ))}
      <LidSlider side="left" label="Vol" description="Volume da música ambiente" value={volume} onChange={onVolumeChange} />
      <LidSlider side="right" label="CRT" description="Filtro CRT (linhas de TV antiga)" value={crt} onChange={onCrtChange} />

      <div className="bezel lid__bezel">
        <span className="lid__camera" aria-hidden="true" />
        <div className="lid__screen">{children}</div>
      </div>
    </section>
  )
}
