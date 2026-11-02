import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { syncBundledLibrary } from './librarySync'

describe('syncBundledLibrary', () => {
  let dir: string
  let bundle: string
  let library: string
  let snapshot: string
  let controls: string

  const write = async (file: string, content: string) => {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }
  const read = (file: string) => readFile(file, 'utf8')
  const sync = () => syncBundledLibrary(bundle, library, snapshot, controls)

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'emulador-sync-'))
    bundle = path.join(dir, 'instalador')
    library = path.join(dir, 'biblioteca')
    snapshot = path.join(dir, 'plataformas.instalado.json')
    controls = path.join(dir, 'controles.instalados.json')
    await write(path.join(bundle, 'plataformas.json'), 'config v1')
    await write(path.join(bundle, 'roms/snes/Doom.smc'), 'rom')
    await write(path.join(bundle, 'emulador/snes9x/Saves/Doom.srm'), 'save original')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('copia a biblioteca inteira na primeira execução', async () => {
    await sync()
    expect(await read(path.join(library, 'roms/snes/Doom.smc'))).toBe('rom')
    expect(await read(path.join(library, 'plataformas.json'))).toBe('config v1')
    expect(await read(snapshot)).toBe('config v1')
  })

  it('preserva saves e acrescenta arquivos novos de uma versão mais nova', async () => {
    await sync()
    await writeFile(path.join(library, 'emulador/snes9x/Saves/Doom.srm'), 'progresso do jogador')
    await write(path.join(bundle, 'roms/snes/Chrono Trigger.smc'), 'rom nova')

    await sync()

    expect(await read(path.join(library, 'emulador/snes9x/Saves/Doom.srm'))).toBe('progresso do jogador')
    expect(await read(path.join(library, 'roms/snes/Chrono Trigger.smc'))).toBe('rom nova')
  })

  it('atualiza o plataformas.json que o usuário não editou', async () => {
    await sync()
    await writeFile(path.join(bundle, 'plataformas.json'), 'config v2')

    await sync()

    expect(await read(path.join(library, 'plataformas.json'))).toBe('config v2')
    expect(await read(snapshot)).toBe('config v2')
  })

  it('mantém o plataformas.json editado pelo usuário', async () => {
    await sync()
    await writeFile(path.join(library, 'plataformas.json'), 'config do usuário')
    await writeFile(path.join(bundle, 'plataformas.json'), 'config v2')

    await sync()
    expect(await read(path.join(library, 'plataformas.json'))).toBe('config do usuário')

    // Numa próxima atualização, a edição continua valendo.
    await writeFile(path.join(bundle, 'plataformas.json'), 'config v3')
    await sync()
    expect(await read(path.join(library, 'plataformas.json'))).toBe('config do usuário')
  })

  describe('mapeamento do teclado dos emuladores', () => {
    const conf = (start: string, left: string) =>
      `[Controls\\Win]\r\n     Joypad1:Start = ${start}\r\n     Window:Left   = ${left}\r\n`
    const bundleConf = () => path.join(bundle, 'emulador/snes9x/snes9x.conf')
    const libraryConf = () => path.join(library, 'emulador/snes9x/snes9x.conf')

    it('troca só as linhas de controle quando o instalador traz outro mapeamento', async () => {
      await write(bundleConf(), conf('LCtrl', '0'))
      await sync()
      await writeFile(libraryConf(), conf('LCtrl', '935')) // o emulador gravou a posição da janela
      await writeFile(bundleConf(), conf('Enter', '0'))

      await sync()

      expect(await read(libraryConf())).toBe(conf('Enter', '935'))
    })

    it('mantém o mapeamento que o usuário mudou enquanto o instalador não traz outro', async () => {
      await write(bundleConf(), conf('Enter', '0'))
      await sync()
      await writeFile(libraryConf(), conf('Space', '0'))

      await sync()

      expect(await read(libraryConf())).toBe(conf('Space', '0'))
    })

    it('atualiza uma instalação anterior a este controle', async () => {
      await write(libraryConf(), conf('LCtrl', '935'))
      await write(bundleConf(), conf('Enter', '0'))

      await sync()

      expect(await read(libraryConf())).toBe(conf('Enter', '935'))
    })

    it('no mGBA, muda o teclado e preserva o gamepad, que usa as mesmas chaves', async () => {
      const ini = (pad: string, keyboard: string) =>
        `[gba.input.SDLB]\nkeyA=${pad}\n\n[gba.input.QT_K]\nkeyA=${keyboard}\n`
      const file = 'emulador/mgba/config.ini'
      await write(path.join(library, file), ini('3', '88'))
      await write(path.join(bundle, file), ini('-1', '75'))

      await sync()

      expect(await read(path.join(library, file))).toBe(ini('3', '75'))
    })
  })
})
