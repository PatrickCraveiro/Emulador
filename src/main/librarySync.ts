import { cp, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { CONFIG_FILE } from './library'

/**
 * Prepara a biblioteca do app instalado a partir da cópia que vem no instalador.
 *
 * Nada que já exista é sobrescrito, para preservar saves, configurações dos emuladores e
 * ROMs/capas adicionadas pelo usuário; arquivos novos de uma versão mais nova do app (jogos,
 * capas) são acrescentados. A exceção é o plataformas.json: ele é atualizado quando o usuário
 * não o editou, ou seja, quando ainda é igual à versão instalada antes (guardada em `snapshotFile`).
 */
export async function syncBundledLibrary(source: string, target: string, snapshotFile: string): Promise<void> {
  await cp(source, target, { recursive: true, force: false, errorOnExist: false })

  const bundled = await readFile(path.join(source, CONFIG_FILE), 'utf8')
  const configFile = path.join(target, CONFIG_FILE)
  const [current, previous] = await Promise.all([readOptional(configFile), readOptional(snapshotFile)])

  if (previous !== null && bundled !== previous && current === previous) {
    await writeFile(configFile, bundled)
  }
  if (bundled !== previous) await writeFile(snapshotFile, bundled)
}

async function readOptional(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf8')
  } catch {
    return null
  }
}
