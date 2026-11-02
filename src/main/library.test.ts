import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanTitle, resolveCommand, scanLibrary } from './library'

describe('cleanTitle', () => {
  it.each([
    ['Superstar Soccer 2 - Ronaldinho 97 (U) [p1][!]', 'Superstar Soccer 2 - Ronaldinho 97'],
    ['Slide Show 1 (AKA Graphic Show 2) (PD)', 'Slide Show 1'],
    ['Super_Mario_World', 'Super Mario World'],
    ['Chrono Trigger', 'Chrono Trigger'],
    ['(Sem título)', '(Sem título)']
  ])('%s → %s', (input, expected) => {
    expect(cleanTitle(input)).toBe(expected)
  })
})

describe('resolveCommand', () => {
  it('resolve caminhos relativos à pasta da biblioteca', () => {
    expect(resolveCommand('/lib', 'emulador/snes9x.exe')).toBe(path.resolve('/lib', 'emulador/snes9x.exe'))
  })

  it('mantém nomes simples para buscar no PATH', () => {
    expect(resolveCommand('/lib', 'retroarch')).toBe('retroarch')
  })

  it('aceita emulador ausente', () => {
    expect(resolveCommand('/lib', undefined)).toBeUndefined()
  })
})

describe('scanLibrary', () => {
  let root: string

  const write = async (relativePath: string, content = '') => {
    const file = path.join(root, relativePath)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }
  const writeConfig = (platforms: unknown) => write('plataformas.json', JSON.stringify({ platforms }))

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'emulador-test-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('lista ROMs soltas e em subpastas, filtrando por extensão e ordenando', async () => {
    await writeConfig([
      { id: 'snes', name: 'Super Nintendo', romsDir: 'roms/snes', extensions: ['smc', '.SFC'] }
    ])
    await write('roms/snes/Game 10/Game 10.smc')
    await write('roms/snes/Game 10/save.srm')
    await write('roms/snes/Game 2.SFC')
    await write('roms/snes/Aladdin (U) [!].smc')
    await write('roms/snes/leia-me.txt')
    await write('roms/snes/a/b/fundo-demais.smc')

    const { library, entries } = await scanLibrary(root)

    expect(library.error).toBeUndefined()
    const [snes] = library.platforms
    expect(snes.name).toBe('Super Nintendo')
    expect(snes.games.map((g) => g.title)).toEqual(['Aladdin', 'Game 2', 'Game 10'])
    expect(entries.size).toBe(3)

    const game10 = entries.get(snes.games[2].id)!
    expect(game10.romPath).toBe(path.join(root, 'roms/snes/Game 10/Game 10.smc'))
    expect(game10.args).toEqual(['{rom}'])
    expect(game10.emulator).toBeUndefined()
  })

  it('associa capas pelo nome do arquivo ou pelo título, priorizando a pasta da plataforma', async () => {
    await writeConfig([{ id: 'snes', romsDir: 'roms', extensions: ['.smc'] }])
    await write('roms/Aladdin (U).smc')
    await write('roms/Doom.smc')
    await write('roms/Sem Capa.smc')
    await write('capas/aladdin.gif')
    await write('capas/Doom.png')
    await write('capas/snes/Doom.webp')

    const { library, entries } = await scanLibrary(root)
    const byTitle = Object.fromEntries(library.platforms[0].games.map((g) => [g.title, g]))

    expect(entries.get(byTitle['Aladdin'].id)!.coverPath).toBe(path.join(root, 'capas/aladdin.gif'))
    expect(entries.get(byTitle['Doom'].id)!.coverPath).toBe(path.join(root, 'capas/snes/Doom.webp'))
    expect(byTitle['Doom'].coverUrl).toBe(`cover://game/${byTitle['Doom'].id}`)
    expect(byTitle['Sem Capa'].coverUrl).toBeNull()
  })

  it('gera ids estáveis entre leituras', async () => {
    await writeConfig([{ id: 'snes', romsDir: 'roms', extensions: ['.smc'] }])
    await write('roms/Doom.smc')

    const first = await scanLibrary(root)
    const second = await scanLibrary(root)
    expect(first.library.platforms[0].games[0].id).toBe(second.library.platforms[0].games[0].id)
  })

  it('avisa quando a pasta de ROMs ou o emulador não existem', async () => {
    await writeConfig([
      { id: 'md', romsDir: 'roms/md', extensions: ['.md'], emulator: 'emulador/Fusion.exe' }
    ])

    const { library } = await scanLibrary(root)
    const [md] = library.platforms

    expect(md.games).toEqual([])
    expect(md.warning).toContain('Pasta de ROMs não encontrada: roms/md')
    expect(md.warning).toContain('Emulador não encontrado: emulador/Fusion.exe')
  })

  it('resolve o emulador e repassa os argumentos configurados', async () => {
    await writeConfig([
      {
        id: 'md',
        romsDir: 'roms',
        extensions: ['.md'],
        emulator: 'emulador/Fusion.exe',
        args: ['-fullscreen', '{rom}']
      }
    ])
    await write('roms/Sonic.md')
    await write('emulador/Fusion.exe')

    const { library, entries } = await scanLibrary(root)
    const entry = entries.get(library.platforms[0].games[0].id)!

    expect(library.platforms[0].warning).toBeUndefined()
    expect(entry.emulator).toBe(path.join(root, 'emulador/Fusion.exe'))
    expect(entry.args).toEqual(['-fullscreen', '{rom}'])
  })

  describe('erros de configuração', () => {
    it('arquivo ausente', async () => {
      const { library } = await scanLibrary(root)
      expect(library.platforms).toEqual([])
      expect(library.error).toMatch(/não encontrado/)
    })

    it('JSON inválido', async () => {
      await write('plataformas.json', '{ "platforms": [ }')
      const { library } = await scanLibrary(root)
      expect(library.error).toMatch(/não é um JSON válido/)
    })

    it('campo obrigatório faltando', async () => {
      await writeConfig([{ id: 'snes', extensions: ['.smc'] }])
      const { library } = await scanLibrary(root)
      expect(library.error).toMatch(/plataforma 1: "romsDir" é obrigatório/)
    })

    it('ids repetidos', async () => {
      await writeConfig([
        { id: 'snes', romsDir: 'a', extensions: ['.smc'] },
        { id: 'snes', romsDir: 'b', extensions: ['.sfc'] }
      ])
      const { library } = await scanLibrary(root)
      expect(library.error).toMatch(/repetido "snes"/)
    })
  })
})
