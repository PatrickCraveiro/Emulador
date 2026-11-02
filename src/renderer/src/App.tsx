import { useEffect, useRef, useState } from 'react'
import type { Game } from '@shared/types'
import { ActionButtons } from './components/ActionButtons'
import { Base } from './components/Base'
import { CirclePad } from './components/CirclePad'
import { DPad } from './components/DPad'
import { GameMenu } from './components/GameMenu'
import { Hinge } from './components/Hinge'
import { Lid } from './components/Lid'
import { PowerButton } from './components/PowerButton'
import { SystemButtons } from './components/SystemButtons'
import { TopScreen } from './components/TopScreen'
import { useBackgroundMusic } from './hooks/useBackgroundMusic'
import { useControls } from './hooks/useControls'
import { useLibrary } from './hooks/useLibrary'
import { useToast } from './hooks/useToast'
import { isThemeId, nextTheme, type ThemeId } from './themes'
import type { Action, PowerState } from './types'
import {
  isBoolean,
  isPercentage,
  isSelection,
  loadPreference,
  savePreference,
  type Selection
} from './utils/storage'

const BOOT_MS = 1100
const SHUTDOWN_MS = 1500
const PRESS_FEEDBACK_MS = 150
const LAUNCH_COOLDOWN_MS = 1500
const PAGE_SIZE = 6
const TYPEAHEAD_RESET_MS = 800

export default function App() {
  const { library, reload } = useLibrary()
  const { toast, showToast } = useToast()
  const [initialSelection] = useState(() => loadPreference<Selection | null>('selecao', isSelection, null))
  const [platformId, setPlatformId] = useState(initialSelection?.platformId)
  // Jogo selecionado em cada plataforma (id da plataforma → id do jogo).
  const [selectedGames, setSelectedGames] = useState<Record<string, string>>(() =>
    initialSelection ? { [initialSelection.platformId]: initialSelection.gameId } : {}
  )
  const [theme, setTheme] = useState<ThemeId>(() => loadPreference('tema', isThemeId, 'aqua'))
  const [crt, setCrt] = useState(() => loadPreference('crt', isPercentage, 0))
  const [music, setMusic] = useState(() => loadPreference('musica', isBoolean, true))
  const [power, setPower] = useState<PowerState>('booting')
  const [pressed, setPressed] = useState<Action | null>(null)
  const [busy, setBusy] = useState(false)
  const powerTimer = useRef<number | undefined>(undefined)
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
    if (platform && game) savePreference('selecao', { platformId: platform.id, gameId: game.id })
  }, [platform, game])

  useEffect(() => savePreference('tema', theme), [theme])
  useEffect(() => savePreference('crt', crt), [crt])
  useEffect(() => savePreference('musica', music), [music])

  useBackgroundMusic(library?.music ?? [], isOn && music)

  // Animação de boot ao abrir o app.
  useEffect(() => {
    powerTimer.current = window.setTimeout(() => setPower('on'), BOOT_MS)
    return () => window.clearTimeout(powerTimer.current)
  }, [])

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
    setBusy(true)
    const result = await window.emulador.launchGame(target.id)
    window.setTimeout(() => setBusy(false), 1200)
    if (!result.ok) showToast(result.error, 'error', 5000)
  }

  async function reloadLibrary() {
    await reload()
    showToast('Lista de jogos atualizada')
  }

  function changeTheme() {
    const next = nextTheme(theme)
    setTheme(next.id)
    showToast(`Cor do console: ${next.name}`)
  }

  function toggleMusic() {
    const next = !music
    setMusic(next)
    if (!next) showToast('Música desligada')
    else if (library?.music.length === 0) showToast('Música ligada, mas a pasta "musica" da biblioteca está vazia')
    else showToast('Música ligada')
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
      case 'first':
        return selectGame(0)
      case 'last':
        return selectGame(games.length - 1)
      case 'left':
        return switchPlatform(-1)
      case 'right':
        return switchPlatform(1)
      case 'a':
      case 'start':
        return void launch()
      case 'x':
        return void reloadLibrary()
      case 'y':
        return selectRandomGame()
      case 'select':
        return changeTheme()
      case 'home':
        return window.emulador.minimizeWindow()
      case 'b':
        return toggleMusic()
    }
  }

  function togglePower() {
    window.clearTimeout(powerTimer.current)
    if (power === 'off' || power === 'shutting-down') {
      setPower('booting')
      powerTimer.current = window.setTimeout(() => setPower('on'), BOOT_MS)
    } else {
      setPower('shutting-down')
      powerTimer.current = window.setTimeout(() => setPower('off'), SHUTDOWN_MS)
    }
  }

  useControls({ enabled: isOn, onAction: handleAction, onType: typeToSearch })

  return (
    <main className="console" data-theme={theme}>
      <Lid crt={crt} onCrtChange={setCrt} music={music} onToggleMusic={() => handleAction('b')}>
        <TopScreen power={power} game={game} platformName={platform?.name} toast={toast} crt={crt} />
      </Lid>
      <Hinge on={power !== 'off' && power !== 'shutting-down'} busy={busy} />
      <Base
        controls={
          <>
            <CirclePad pressed={pressed} onPress={handleAction} />
            <DPad pressed={pressed} onPress={handleAction} />
            <PowerButton on={power === 'on' || power === 'booting'} onToggle={togglePower} />
            <ActionButtons pressed={pressed} onPress={handleAction} />
            <SystemButtons pressed={pressed} onPress={handleAction} />
          </>
        }
      >
        <GameMenu
          on={power === 'on' || power === 'booting'}
          library={library}
          platform={platform}
          selectedIndex={gameIndex}
          canSwitchPlatform={platforms.length > 1}
          onSwitchPlatform={(step) => handleAction(step < 0 ? 'left' : 'right')}
          onSelect={selectGame}
          onLaunch={(index) => void launch(games[index])}
        />
      </Base>
    </main>
  )
}

/** Minúsculas e sem acentos, para comparar títulos. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
