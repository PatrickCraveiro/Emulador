import { createHash } from 'node:crypto'
import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Game, Library, Platform } from '@shared/types'

export const CONFIG_FILE = 'plataformas.json'
export const COVERS_DIR = 'capas'
export const COVER_PROTOCOL = 'cover'

const COVER_EXTENSIONS = ['.gif', '.webp', '.png', '.jpg', '.jpeg', '.avif']
// roms/<plataforma>/<arquivo> ou roms/<plataforma>/<pasta do jogo>/<arquivo>
const ROM_SEARCH_DEPTH = 1
const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

export interface PlatformConfig {
  id: string
  name: string
  romsDir: string
  extensions: string[]
  emulator?: string
  args?: string[]
  /** Capa a usar para uma ROM específica (nome da ROM em minúsculas → nome da capa). */
  covers?: Record<string, string>
}

/** Jogo com os dados que só o processo principal conhece (caminhos no disco). */
export interface GameEntry {
  game: Game
  romPath: string
  coverPath: string | null
  /** Executável já resolvido; `undefined` abre a ROM com o programa padrão do sistema. */
  emulator?: string
  args: string[]
}

export interface ScanResult {
  library: Library
  entries: Map<string, GameEntry>
}

export async function scanLibrary(root: string): Promise<ScanResult> {
  const entries = new Map<string, GameEntry>()

  let configs: PlatformConfig[]
  try {
    configs = await loadConfig(root)
  } catch (error) {
    return { library: { platforms: [], error: (error as Error).message }, entries }
  }

  const covers = await indexCovers(path.join(root, COVERS_DIR))
  const platforms = await Promise.all(
    configs.map((config) => scanPlatform(root, config, covers, entries))
  )
  return { library: { platforms }, entries }
}

export async function loadConfig(root: string): Promise<PlatformConfig[]> {
  const file = path.join(root, CONFIG_FILE)

  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    throw new Error(`Arquivo de configuração não encontrado: ${file}`)
  }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch (error) {
    throw new Error(`${CONFIG_FILE} não é um JSON válido: ${(error as Error).message}`)
  }

  const list = (data as { platforms?: unknown } | null)?.platforms
  if (!Array.isArray(list)) {
    throw new Error(`${CONFIG_FILE} precisa ter uma lista "platforms".`)
  }

  const configs = list.map(parsePlatform)
  const ids = new Set<string>()
  for (const { id } of configs) {
    if (ids.has(id)) throw new Error(`${CONFIG_FILE}: id de plataforma repetido "${id}".`)
    ids.add(id)
  }
  return configs
}

function parsePlatform(item: unknown, index: number): PlatformConfig {
  const fail = (message: string): never => {
    throw new Error(`${CONFIG_FILE}, plataforma ${index + 1}: ${message}`)
  }
  const isStringList = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string')
  const isStringMap = (value: unknown): value is Record<string, string> =>
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'string')

  const p = (item ?? {}) as Record<string, unknown>
  if (typeof p.id !== 'string' || !p.id) fail('"id" é obrigatório.')
  if (typeof p.romsDir !== 'string' || !p.romsDir) fail('"romsDir" é obrigatório.')
  if (!isStringList(p.extensions) || p.extensions.length === 0) {
    fail('"extensions" deve ser uma lista com ao menos uma extensão.')
  }
  if (p.name !== undefined && typeof p.name !== 'string') fail('"name" deve ser texto.')
  if (p.emulator !== undefined && typeof p.emulator !== 'string') fail('"emulator" deve ser texto.')
  if (p.args !== undefined && !isStringList(p.args)) fail('"args" deve ser uma lista de textos.')
  if (p.covers !== undefined && !isStringMap(p.covers)) {
    fail('"covers" deve associar nomes de ROM a nomes de capa (texto → texto).')
  }

  const id = p.id as string
  return {
    id,
    name: (p.name as string | undefined) ?? id,
    romsDir: p.romsDir as string,
    extensions: (p.extensions as string[]).map(normalizeExtension),
    emulator: (p.emulator as string | undefined) || undefined,
    args: p.args as string[] | undefined,
    covers: p.covers
      ? Object.fromEntries(
          Object.entries(p.covers as Record<string, string>).map(([rom, cover]) => [
            rom.toLowerCase(),
            stripCoverExtension(cover)
          ])
        )
      : undefined
  }
}

async function scanPlatform(
  root: string,
  config: PlatformConfig,
  covers: Map<string, string>,
  entries: Map<string, GameEntry>
): Promise<Platform> {
  const romsDir = path.resolve(root, config.romsDir)
  const emulator = resolveCommand(root, config.emulator)
  const warnings: string[] = []

  if (!(await exists(romsDir))) {
    warnings.push(`Pasta de ROMs não encontrada: ${config.romsDir}`)
  }
  if (emulator && path.isAbsolute(emulator) && !(await exists(emulator))) {
    warnings.push(`Emulador não encontrado: ${config.emulator}`)
  }

  const roms = (await listFiles(romsDir, ROM_SEARCH_DEPTH)).filter((file) =>
    config.extensions.includes(path.extname(file).toLowerCase())
  )

  const games = roms.map((romPath) => {
    const fileName = path.basename(romPath, path.extname(romPath))
    const title = cleanTitle(fileName)
    const id = gameId(config.id, path.relative(romsDir, romPath))
    const alias = config.covers?.[fileName.toLowerCase()] ?? config.covers?.[title.toLowerCase()]
    const coverPath = findCover(covers, config.id, alias ? [alias, fileName, title] : [fileName, title])
    const game: Game = {
      id,
      title,
      platformId: config.id,
      coverUrl: coverPath ? `${COVER_PROTOCOL}://game/${id}` : null
    }
    entries.set(id, { game, romPath, coverPath, emulator, args: config.args ?? ['{rom}'] })
    return game
  })
  games.sort((a, b) => collator.compare(a.title, b.title))

  return {
    id: config.id,
    name: config.name,
    romsDir: config.romsDir,
    games,
    warning: warnings.length ? warnings.join(' · ') : undefined
  }
}

/**
 * Remove marcações comuns em nomes de ROMs, como "(U)", "[!]" e "(PD)".
 * Ex.: "Superstar Soccer 2 (U) [p1][!]" → "Superstar Soccer 2"
 */
export function cleanTitle(fileName: string): string {
  const title = fileName
    .replace(/_/g, ' ')
    .replace(/\s*(\([^)]*\)|\[[^\]]*\])/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return title || fileName
}

/**
 * Caminhos com barra são relativos à pasta `plataforma/`; nomes simples
 * (ex.: "retroarch") são procurados no PATH do sistema.
 */
export function resolveCommand(root: string, command?: string): string | undefined {
  if (!command) return undefined
  return /[\\/]/.test(command) ? path.resolve(root, command) : command
}

function gameId(platformId: string, relativeRomPath: string): string {
  const key = `${platformId}/${relativeRomPath.split(path.sep).join('/')}`
  return createHash('sha1').update(key).digest('hex').slice(0, 16)
}

/** Indexa as capas por nome (minúsculo, sem extensão); aceita subpastas por plataforma. */
async function indexCovers(dir: string): Promise<Map<string, string>> {
  const index = new Map<string, string>()
  for (const file of await listFiles(dir, 1)) {
    const ext = path.extname(file).toLowerCase()
    if (!COVER_EXTENSIONS.includes(ext)) continue
    const key = path.relative(dir, file).slice(0, -ext.length).split(path.sep).join('/')
    if (!index.has(key.toLowerCase())) index.set(key.toLowerCase(), file)
  }
  return index
}

function findCover(covers: Map<string, string>, platformId: string, names: string[]) {
  const keys = [...names.map((name) => `${platformId}/${name}`), ...names]
  for (const key of keys) {
    const cover = covers.get(key.toLowerCase())
    if (cover) return cover
  }
  return null
}

async function listFiles(dir: string, depth: number): Promise<string[]> {
  let dirents
  try {
    dirents = await readdir(dir, { withFileTypes: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }

  const files: string[] = []
  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name)
    if (dirent.isFile()) files.push(fullPath)
    else if (dirent.isDirectory() && depth > 0) files.push(...(await listFiles(fullPath, depth - 1)))
  }
  return files
}

function stripCoverExtension(name: string): string {
  const ext = path.extname(name).toLowerCase()
  return COVER_EXTENSIONS.includes(ext) ? name.slice(0, -ext.length) : name
}

function normalizeExtension(ext: string): string {
  const lower = ext.trim().toLowerCase()
  return lower.startsWith('.') ? lower : `.${lower}`
}

async function exists(file: string): Promise<boolean> {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}
