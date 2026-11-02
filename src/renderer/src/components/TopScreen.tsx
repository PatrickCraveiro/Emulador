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
}

/** Tela de cima: capa animada do jogo selecionado e avisos. */
export function TopScreen({ power, game, platformName, toast }: Props) {
  return (
    <div className={cx('screen', power === 'off' && 'screen--off')}>
      {power === 'shutting-down' && <img className="top-screen__static" src={turnOffGif} alt="" />}

      {power === 'on' &&
        (game ? (
          <Preview key={game.id} game={game} platformName={platformName} />
        ) : (
          <div className="top-screen__logo">Emulador</div>
        ))}

      {power === 'on' && toast && (
        <div key={toast.id} role="status" className={cx('toast', `toast--${toast.kind}`)}>
          {toast.text}
        </div>
      )}
    </div>
  )
}

function Preview({ game, platformName }: { game: Game; platformName?: string }) {
  return (
    <div className="preview">
      {/* Fica por baixo da capa: aparece enquanto ela carrega ou se não houver capa. */}
      <div className="preview__placeholder">
        {platformName && <span className="preview__platform">{platformName}</span>}
        <strong className="preview__title">{game.title}</strong>
      </div>
      {game.coverUrl && (
        <>
          <img className="preview__backdrop" src={game.coverUrl} alt="" />
          <img className="preview__cover" src={game.coverUrl} alt={game.title} />
        </>
      )}
    </div>
  )
}
