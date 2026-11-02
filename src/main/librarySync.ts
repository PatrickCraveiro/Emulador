import { cp, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CONFIG_FILE } from './library'

/** Pasta dos emuladores dentro da biblioteca. */
const EMULATORS_DIR = 'emulador'

/**
 * Linhas que guardam o mapeamento do teclado em cada arquivo de configuração de emulador,
 * identificadas pela seção ("" antes da primeira) e pela chave de "chave = valor".
 */
const CONTROL_LINES: Record<string, (section: string, key: string) => boolean> = {
  'snes9x.conf': (_, key) => key.startsWith('Joypad1:'),
  'fusion.ini': (_, key) => key === 'Player1Keys',
  // mGBA: as mesmas chaves se repetem na seção do controle (gamepad), que fica de fora
  'config.ini': (section) => section === 'gba.input.QT_K'
}

/**
 * Prepara a biblioteca do app instalado a partir da cópia que vem no instalador.
 *
 * Nada que já exista é sobrescrito, para preservar saves, configurações dos emuladores e
 * ROMs/capas adicionadas pelo usuário; arquivos novos de uma versão mais nova do app (jogos,
 * capas) são acrescentados. As exceções:
 * - o plataformas.json é atualizado quando o usuário não o editou, ou seja, quando ainda é
 *   igual à versão instalada antes (guardada em `snapshotFile`);
 * - o mapeamento do teclado dos emuladores (só essas linhas da configuração) é atualizado
 *   quando o instalador traz um mapeamento diferente do anterior (guardado em `controlsFile`).
 */
export async function syncBundledLibrary(
  source: string,
  target: string,
  snapshotFile: string,
  controlsFile: string
): Promise<void> {
  await cp(source, target, { recursive: true, force: false, errorOnExist: false })

  const bundled = await readFile(path.join(source, CONFIG_FILE), 'utf8')
  const configFile = path.join(target, CONFIG_FILE)
  const [current, previous] = await Promise.all([readOptional(configFile), readOptional(snapshotFile)])

  if (previous !== null && bundled !== previous && current === previous) {
    await writeFile(configFile, bundled)
  }
  if (bundled !== previous) await writeFile(snapshotFile, bundled)

  await syncControls(source, target, controlsFile)
}

async function syncControls(source: string, target: string, controlsFile: string): Promise<void> {
  const previous: Record<string, string[]> = JSON.parse((await readOptional(controlsFile)) ?? '{}')
  const installed: Record<string, string[]> = {}

  for (const file of await listFiles(path.join(source, EMULATORS_DIR))) {
    const isControl = CONTROL_LINES[path.basename(file).toLowerCase()]
    if (!isControl) continue
    const relative = path.relative(source, file).split(path.sep).join('/')
    const bundled = controlLines(await readFile(file, 'latin1'), isControl)
    installed[relative] = [...bundled.values()]

    if (JSON.stringify(installed[relative]) === JSON.stringify(previous[relative])) continue
    const targetFile = path.join(target, relative)
    const current = await readOptional(targetFile, 'latin1')
    if (current === null) continue
    const updated = replaceLines(current, bundled)
    if (updated !== current) await writeFile(targetFile, updated, 'latin1')
  }

  if (JSON.stringify(installed) !== JSON.stringify(previous)) {
    await writeFile(controlsFile, JSON.stringify(installed, null, 2))
  }
}

type LineFilter = (section: string, key: string) => boolean

/** Percorre as linhas "chave = valor" de um arquivo INI, com a seção de cada uma. */
function* entries(text: string): Generator<{ index: number; line: string; id: string; section: string; key: string }> {
  let section = ''
  for (const [index, raw] of text.split('\n').entries()) {
    const line = raw.replace(/\r$/, '')
    const header = /^\s*\[(.*)\]\s*$/.exec(line)
    if (header) {
      section = header[1]
      continue
    }
    const equals = line.indexOf('=')
    if (equals < 0 || /^\s*[;#]/.test(line)) continue
    const key = line.slice(0, equals).trim()
    yield { index, line, id: `${section}\n${key}`, section, key }
  }
}

function controlLines(text: string, isControl: LineFilter): Map<string, string> {
  const lines = new Map<string, string>()
  for (const { line, id, section, key } of entries(text)) {
    if (isControl(section, key)) lines.set(id, line)
  }
  return lines
}

/** Troca as linhas de controle pelas do instalador, mantendo o resto e as quebras de linha. */
function replaceLines(text: string, bundled: Map<string, string>): string {
  const lines = text.split('\n')
  for (const { index, id } of entries(text)) {
    const replacement = bundled.get(id)
    if (replacement !== undefined) lines[index] = replacement + (lines[index].endsWith('\r') ? '\r' : '')
  }
  return lines.join('\n')
}

async function listFiles(dir: string): Promise<string[]> {
  const found = await readdir(dir, { recursive: true, withFileTypes: true }).catch(() => [])
  return found.filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name))
}

async function readOptional(file: string, encoding: BufferEncoding = 'utf8'): Promise<string | null> {
  try {
    return await readFile(file, encoding)
  } catch {
    return null
  }
}
