import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { shell } from 'electron'
import type { LaunchResult } from '@shared/types'
import { maximizeWhenShown } from './emulatorWindow'
import type { GameEntry } from './library'

/**
 * Abre o jogo. `onRunningChange` avisa quando o emulador abre (true) e quando fecha (false);
 * uma ROM aberta pelo programa padrão do sistema não é acompanhada.
 */
export async function launchGame(
  { romPath, emulator, args, maximize }: GameEntry,
  onRunningChange?: (running: boolean) => void
): Promise<LaunchResult> {
  if (!emulator) {
    // Sem emulador configurado: abre a ROM com o programa associado à extensão no sistema.
    const error = await shell.openPath(romPath)
    return error ? { ok: false, error } : { ok: true }
  }

  let child: ChildProcess
  try {
    child = await spawnDetached(
      emulator,
      args.map((arg) => arg.replaceAll('{rom}', romPath))
    )
  } catch (error) {
    return { ok: false, error: describeError(error, emulator) }
  }
  if (onRunningChange) {
    onRunningChange(true)
    child.once('exit', () => onRunningChange(false))
  }

  const pid = child.pid
  if (maximize && pid) {
    try {
      maximizeWhenShown(pid)
    } catch (error) {
      // O jogo já abriu; só a janela fica do tamanho que o emulador escolheu.
      console.error('Não foi possível maximizar a janela do emulador:', error)
    }
  }
  return { ok: true }
}

/** Abre o emulador como processo independente: fechar o launcher não fecha o jogo. */
function spawnDetached(command: string, args: string[]): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      // Emuladores costumam ler configuração e saves da própria pasta.
      cwd: path.isAbsolute(command) ? path.dirname(command) : undefined,
      detached: true,
      stdio: 'ignore'
    })
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolve(child)
    })
  })
}

function describeError(error: unknown, emulator: string): string {
  const name = path.basename(emulator)
  switch ((error as NodeJS.ErrnoException).code) {
    case 'ENOENT':
      return `Emulador não encontrado: ${name}`
    case 'EACCES':
      return `Sem permissão para executar: ${name}`
    default:
      return `Não foi possível abrir ${name}: ${(error as Error).message}`
  }
}
