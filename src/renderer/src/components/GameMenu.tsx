import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Game, Library, Platform } from '@shared/types'
import type { FaceButton } from '../types'
import { cx } from '../utils/cx'
import './GameMenu.scss'

interface Props {
  on: boolean
  library: Library | null
  platform?: Platform
  selectedIndex: number
  canSwitchPlatform: boolean
  onSwitchPlatform(step: -1 | 1): void
  onSelect(index: number): void
  onLaunch(index: number): void
}

/** Tela de baixo: plataforma atual e lista de jogos. */
export function GameMenu({ on, library, platform, canSwitchPlatform, onSwitchPlatform, ...listProps }: Props) {
  if (!on) return <div className="screen" />

  const games = platform?.games ?? []

  return (
    <div className="screen menu">
      <header className="menu__header">
        {canSwitchPlatform && (
          <button
            type="button"
            tabIndex={-1}
            className="menu__arrow"
            aria-label="Plataforma anterior"
            onClick={() => onSwitchPlatform(-1)}
          >
            <Chevron direction="left" />
          </button>
        )}
        <span className="menu__title">
          {platform?.name ?? 'Emulador'}
          {platform && <span className="menu__count">{games.length}</span>}
        </span>
        {canSwitchPlatform && (
          <button
            type="button"
            tabIndex={-1}
            className="menu__arrow"
            aria-label="Próxima plataforma"
            onClick={() => onSwitchPlatform(1)}
          >
            <Chevron direction="right" />
          </button>
        )}
      </header>

      {platform?.warning && games.length > 0 && <p className="menu__warning">{platform.warning}</p>}

      {library === null ? (
        <Message title="Carregando…" />
      ) : library.error ? (
        <Message title="Não foi possível ler a biblioteca" detail={library.error} />
      ) : !platform ? (
        <Message
          title="Nenhuma plataforma configurada"
          detail="Adicione plataformas em plataforma/plataformas.json."
        />
      ) : games.length === 0 ? (
        <Message
          title="Nenhum jogo encontrado"
          detail={platform.warning ?? `Coloque as ROMs em plataforma/${platform.romsDir}`}
        />
      ) : (
        <GameList games={games} {...listProps} />
      )}

      <footer className="menu__legend">
        <Hint button="a">Jogar</Hint>
        <Hint button="x">Recarregar</Hint>
        <Hint button="y">Aleatório</Hint>
        <span className="menu__hint">
          <span className="menu__hint-pill">Select</span>
          Cor
        </span>
      </footer>
    </div>
  )
}

interface GameListProps {
  games: Game[]
  selectedIndex: number
  onSelect(index: number): void
  onLaunch(index: number): void
}

function GameList({ games, selectedIndex, onSelect, onLaunch }: GameListProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const previousGames = useRef(games)

  // Mantém o jogo selecionado no centro da lista. Rola só a lista, nunca a página.
  useLayoutEffect(() => {
    const list = listRef.current
    const item = list?.children[selectedIndex] as HTMLElement | undefined
    if (!list || !item) return
    const sameList = previousGames.current === games
    previousGames.current = games
    list.scrollTo({
      top: item.offsetTop - (list.clientHeight - item.offsetHeight) / 2,
      behavior: sameList ? 'smooth' : 'instant'
    })
  }, [games, selectedIndex])

  const selected = games[selectedIndex]

  return (
    <ul
      ref={listRef}
      className="menu__list"
      role="listbox"
      aria-label="Jogos"
      aria-activedescendant={selected && `game-${selected.id}`}
    >
      {games.map((game, index) => (
        <li
          key={game.id}
          id={`game-${game.id}`}
          role="option"
          aria-selected={index === selectedIndex}
          title={game.title}
          className={cx('menu__item', index === selectedIndex && 'menu__item--selected')}
          onClick={() => onSelect(index)}
          onDoubleClick={() => onLaunch(index)}
        >
          {game.title}
        </li>
      ))}
    </ul>
  )
}

function Message({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="menu__message">
      <strong>{title}</strong>
      {detail && <span>{detail}</span>}
    </div>
  )
}

function Hint({ button, children }: { button: FaceButton; children: ReactNode }) {
  return (
    <span className="menu__hint">
      <span className={`menu__hint-button menu__hint-button--${button}`}>{button.toUpperCase()}</span>
      {children}
    </span>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true">
      <path d={direction === 'left' ? 'M6.5 2 3.5 5l3 3' : 'M3.5 2l3 3-3 3'} />
    </svg>
  )
}
