import { useState, type CSSProperties } from 'react'
import type { Game } from '@shared/types'
import turnOffGif from '../assets/turn-off.gif'
import type { PowerState, Toast } from '../types'
import { cx } from '../utils/cx'
import './TopScreen.scss'

interface Props {
  power: PowerState
  game?: Game
  platformName?: string
  toast: Toast | null
  /** Intensidade do filtro CRT, de 0 a 100. */
  crt: number
}

/** Tela de cima: capa animada do jogo selecionado e avisos. */
export function TopScreen({ power, game, platformName, toast, crt }: Props) {
  return (
    <div className="screen top-screen">
      {power === 'booting' && <Splash animated />}
      {power === 'shutting-down' && <img className="top-screen__static" src={turnOffGif} alt="" />}
      {power === 'on' &&
        (game ? <Preview key={game.id} game={game} platformName={platformName} /> : <Splash />)}

      {power === 'on' && toast && (
        <div key={toast.id} role="status" className={cx('toast', `toast--${toast.kind}`)}>
          {toast.text}
        </div>
      )}

      {power !== 'off' && crt > 0 && <div className="top-screen__crt" style={{ opacity: crt / 100 }} />}
    </div>
  )
}

function Preview({ game, platformName }: { game: Game; platformName?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (!game.coverUrl || failed) return <CoverCard game={game} platformName={platformName} />

  return (
    <div className={cx('preview', loaded && 'preview--loaded')}>
      <img className="preview__backdrop" src={game.coverUrl} alt="" />
      <img
        className="preview__cover"
        src={game.coverUrl}
        alt={game.title}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
      <div className="preview__caption">
        {platformName && <span className="preview__platform">{platformName}</span>}
        <strong className="preview__title">{game.title}</strong>
      </div>
    </div>
  )
}

/** Capa gerada para jogos sem imagem: cada título ganha uma cor própria. */
function CoverCard({ game, platformName }: { game: Game; platformName?: string }) {
  return (
    <div className="cover-card" style={{ '--hue': hueOf(game.title) } as CSSProperties}>
      <svg className="cover-card__cartridge" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M14 6h36a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4h-6v-5H20v5h-6a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z" />
        <rect x="18" y="13" width="28" height="22" rx="2" />
      </svg>
      {platformName && <span className="cover-card__platform">{platformName}</span>}
      <strong className="cover-card__title">{game.title}</strong>
      <span className="cover-card__hint">Sem capa · adicione uma imagem na pasta capas da biblioteca</span>
    </div>
  )
}

function Splash({ animated = false }: { animated?: boolean }) {
  return (
    <div className={cx('splash', animated && 'splash--animated')}>
      <span className="splash__logo">Emulador</span>
      <span className="splash__tagline">retro game launcher</span>
    </div>
  )
}

function hueOf(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) % 360
  return hash
}
