import { describe, expect, it } from 'vitest'
import { launchGame } from './launcher'
import type { GameEntry } from './library'

const entry = (args: string[]): GameEntry => ({
  game: { id: 'x', title: 'Teste', platformId: 'p', coverUrl: null },
  romPath: 'rom.bin',
  coverPath: null,
  // Um "emulador" que fecha sozinho logo depois de abrir.
  emulator: process.execPath,
  args,
  maximize: false
})

describe('launchGame', () => {
  it('avisa quando o emulador abre e quando fecha', async () => {
    const changes: boolean[] = []
    const closed = new Promise<void>((resolve) => {
      void launchGame(entry(['-e', 'setTimeout(() => {}, 200)']), (running) => {
        changes.push(running)
        if (!running) resolve()
      })
    })

    await closed
    expect(changes).toEqual([true, false])
  })

  it('não avisa nada quando o emulador não abre', async () => {
    const changes: boolean[] = []
    const result = await launchGame({ ...entry([]), emulator: 'emulador-que-nao-existe.exe' }, (r) => changes.push(r))

    expect(result).toMatchObject({ ok: false, error: expect.stringMatching(/não encontrado/) })
    expect(changes).toEqual([])
  })
})
