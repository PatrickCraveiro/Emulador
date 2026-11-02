import { useEffect, useRef, useState } from 'react'
import type { Game } from '@shared/types'
import { ActionButtons } from './components/ActionButtons'
import { BottomShell } from './components/BottomShell'
import { DPad } from './components/DPad'
import { GameMenu } from './components/GameMenu'
import { Hinge } from './components/Hinge'
import { PowerSwitch } from './components/PowerSwitch'
import { TopScreen } from './components/TopScreen'
import { TopShell } from './components/TopShell'
import { useControls } from './hooks/useControls'
import { useLibrary } from './hooks/useLibrary'
import { useToast } from './hooks/useToast'
import type { Action, PowerState } from './types'
import { loadSelection, saveSelection } from './utils/selection'

const SHUTDOWN_MS = 1500
const PRESS_FEEDBACK_MS = 150
const LAUNCH_COOLDOWN_MS = 1500
const PAGE_SIZE = 6
const TYPEAHEAD_RESET_MS = 800

export default function App() {
  const { library, reload } = useLibrary()
  const { toast, showToast } = useToast()
  const [initialSelection] = useState(loadSelection)
  const [platformId, setPlatformId] = useState(initialSelection?.platformId)
  // Jogo selecionado em cada plataforma (id da plataforma → id do jogo).
  const [selectedGames, setSelectedGames] = useState<Record<string, string>>(() =>
    initialSelection ? { [initialSelection.platformId]: initialSelection.gameId } : {}
  )
  const [power, setPower] = useState<PowerState>('on')
  const [pressed, setPressed] = useState<Action | null>(null)
  const shutdownTimer = useRef<number | undefined>(undefined)
  const pressTimer = useRef<number | undefined>(undefined)
  const lastLaunch = useRef(0)
  const typeahead = useRef({ text: '', time: 0 })

  const platforms = library?.platforms ?? []
  const platformIndex = Math.max(0, platforms.findIndex((p) => p.id === platformId))
  const platform = platforms[platformIndex]
  const games = platform?.games ?? []
  const gameIndex = Math.max(0, games.findIndex((g) => g.id === selectedGames[platform?.id ?? '']))
  const game: Game | undefined = games[gameIndex]
  const isOn = power === 'on'

  useEffect(() => {
    if (platform && game) saveSelection({ platformId: platform.id, gameId: game.id })
  }, [platform, game])

  function selectGame(index: number) {
    if (!platform || games.length === 0) return
    const clamped = Math.min(Math.max(index, 0), games.length - 1)
    setSelectedGames((current) => ({ ...current, [platform.id]: games[clamped].id }))
  }

  function selectRandomGame() {
    if (games.length < 2) return
    // Sorteia entre os outros jogos, para sempre mudar a seleção.
    selectGame((gameIndex + 1 + Math.floor(Math.random() * (games.length - 1))) % games.length)
  }

  /**
   * Busca por digitação: letras digitadas em sequência formam o termo buscado
   * ("sup" → "Super Mario…"); repetir a mesma letra alterna entre os jogos com ela.
   */
  function typeToSearch(char: string) {
    const now = Date.now()
    const state = typeahead.current
    const expired = now - state.time > TYPEAHEAD_RESET_MS
    if (expired && char === ' ') return
    state.text = expired ? char : state.text + char
    state.time = now

    const query = normalize(state.text)
    const sameLetter = [...query].every((c) => c === query[0])
    const prefix = sameLetter ? query[0] : query
    const first = sameLetter ? 1 : 0
    for (let step = first; step < games.length + first; step++) {
      const index = (gameIndex + step) % games.length
      if (normalize(games[index].title).startsWith(prefix)) return selectGame(index)
    }
  }

  function switchPlatform(step: number) {
    if (platforms.length < 2) return
    setPlatformId(platforms[(platformIndex + step + platforms.length) % platforms.length].id)
  }

  async function launch(target: Game | undefined = game) {
    const now = Date.now()
    if (!target || now - lastLaunch.current < LAUNCH_COOLDOWN_MS) return
    lastLaunch.current = now

    showToast(`Iniciando ${target.title}…`)
    const result = await window.emulador.launchGame(target.id)
    if (!result.ok) showToast(result.error, 'error', 5000)
  }

  async function reloadLibrary() {
    await reload()
    showToast('Lista de jogos atualizada')
  }

  function handleAction(action: Action) {
    if (!isOn) return

    window.clearTimeout(pressTimer.current)
    setPressed(action)
    pressTimer.current = window.setTimeout(() => setPressed(null), PRESS_FEEDBACK_MS)

    switch (action) {
      case 'up':
        return selectGame(gameIndex - 1)
      case 'down':
        return selectGame(gameIndex + 1)
      case 'pageUp':
        return selectGame(gameIndex - PAGE_SIZE)
      case 'pageDown':
        return selectGame(gameIndex + PAGE_SIZE)
      case 'home':
        return selectGame(0)
      case 'end':
        return selectGame(games.length - 1)
      case 'left':
        return switchPlatform(-1)
      case 'right':
        return switchPlatform(1)
      case 'a':
        return void launch()
      case 'x':
        return void reloadLibrary()
      case 'y':
        return selectRandomGame()
      case 'b':
        return
    }
  }

  function setPowerOn(on: boolean) {
    window.clearTimeout(shutdownTimer.current)
    if (on) {
      setPower('on')
    } else {
      setPower('shutting-down')
      shutdownTimer.current = window.setTimeout(() => setPower('off'), SHUTDOWN_MS)
    }
  }

  useControls({ enabled: isOn, onAction: handleAction, onType: typeToSearch })

  return (
    <main className="console">
      <TopShell>
        <TopScreen power={power} game={game} platformName={platform?.name} toast={toast} />
      </TopShell>
      <Hinge on={isOn} />
      <BottomShell
        dpad={<DPad pressed={pressed} onPress={handleAction} />}
        controls={
          <>
            <PowerSwitch on={isOn} onChange={setPowerOn} />
            <ActionButtons pressed={pressed} onPress={handleAction} />
          </>
        }
      >
        <GameMenu
          on={isOn}
          library={library}
          platform={platform}
          selectedIndex={gameIndex}
          canSwitchPlatform={platforms.length > 1}
          onSwitchPlatform={(step) => handleAction(step < 0 ? 'left' : 'right')}
          onSelect={selectGame}
          onLaunch={(index) => void launch(games[index])}
        />
      </BottomShell>
    </main>
  )
}

/** Minúsculas e sem acentos, para comparar títulos. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
