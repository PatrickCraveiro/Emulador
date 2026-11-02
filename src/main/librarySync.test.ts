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

  const write = async (file: string, content: string) => {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }
  const read = (file: string) => readFile(file, 'utf8')
  const sync = () => syncBundledLibrary(bundle, library, snapshot)

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'emulador-sync-'))
    bundle = path.join(dir, 'instalador')
    library = path.join(dir, 'biblioteca')
    snapshot = path.join(dir, 'plataformas.instalado.json')
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
})
