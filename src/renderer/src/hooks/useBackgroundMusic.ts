import { useEffect, useRef, useState } from 'react'

const VOLUME = 0.35
const FADE_IN_S = 1.5
const FADE_OUT_S = 0.5

interface Player {
  context: AudioContext
  gain: GainNode
  tracks: string[]
  index: number
  source: AudioBufferSourceNode | null
  /** Se a música deve estar tocando; descarta carregamentos que terminam depois de pausar. */
  wanted: boolean
}

/**
 * Música ambiente do menu. Toca enquanto `enabled` e a janela estiver em foco: ao abrir um
 * jogo, o emulador pega o foco e a música some, e volta quando o launcher volta à frente.
 * Uma faixa só fica em loop sem emenda (Web Audio, sem o intervalo do <audio loop>); várias
 * tocam em sequência.
 */
export function useBackgroundMusic(tracks: string[], enabled: boolean): void {
  const focused = useWindowFocus()
  const playing = enabled && focused && tracks.length > 0
  const key = tracks.join('\n')
  const player = useRef<Player | null>(null)

  useEffect(() => {
    if (!playing) {
      if (player.current) pause(player.current)
      return
    }
    const p = (player.current ??= createPlayer())
    if (p.tracks.join('\n') !== key) {
      // Lista nova (ex.: recarregou a biblioteca): recomeça da primeira faixa.
      stopSource(p)
      p.tracks = key.split('\n')
      p.index = 0
    }
    p.wanted = true
    void play(p)
  }, [playing, key])

  useEffect(() => () => void player.current?.context.close(), [])
}

function useWindowFocus(): boolean {
  const [focused, setFocused] = useState(() => document.hasFocus())
  useEffect(() => {
    const update = () => setFocused(document.hasFocus())
    window.addEventListener('focus', update)
    window.addEventListener('blur', update)
    return () => {
      window.removeEventListener('focus', update)
      window.removeEventListener('blur', update)
    }
  }, [])
  return focused
}

function createPlayer(): Player {
  const context = new AudioContext()
  const gain = context.createGain()
  gain.gain.value = 0
  gain.connect(context.destination)
  return { context, gain, tracks: [], index: 0, source: null, wanted: false }
}

async function play(p: Player): Promise<void> {
  if (p.context.state === 'suspended') await p.context.resume()
  if (!p.source) await startTrack(p)
  if (p.wanted) fade(p, VOLUME, FADE_IN_S)
}

async function startTrack(p: Player): Promise<void> {
  const url = p.tracks[p.index]
  let buffer: AudioBuffer
  try {
    const response = await fetch(url)
    buffer = await p.context.decodeAudioData(await response.arrayBuffer())
  } catch (error) {
    console.error(`Não foi possível tocar ${decodeURIComponent(url)}:`, error)
    return
  }
  if (!p.wanted || p.source || p.tracks[p.index] !== url) return

  const source = p.context.createBufferSource()
  source.buffer = buffer
  source.loop = p.tracks.length === 1
  source.connect(p.gain)
  source.onended = () => {
    if (p.source !== source) return
    p.source = null
    p.index = (p.index + 1) % p.tracks.length
    void startTrack(p)
  }
  p.source = source
  source.start()
}

function pause(p: Player): void {
  p.wanted = false
  fade(p, 0, FADE_OUT_S)
  window.setTimeout(() => {
    if (!p.wanted && p.context.state === 'running') void p.context.suspend()
  }, FADE_OUT_S * 1000)
}

function fade(p: Player, to: number, seconds: number): void {
  const now = p.context.currentTime
  const volume = p.gain.gain
  volume.cancelScheduledValues(now)
  volume.setValueAtTime(volume.value, now)
  volume.linearRampToValueAtTime(to, now + seconds)
}

function stopSource(p: Player): void {
  const source = p.source
  p.source = null
  source?.stop()
}
