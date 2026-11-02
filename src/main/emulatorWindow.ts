import koffi from 'koffi'

const SW_MAXIMIZE = 3
const GW_OWNER = 4
/** Quanto esperar pela janela do emulador; depois disso, desiste sem erro. */
const TIMEOUT_MS = 15_000
const POLL_MS = 50

type User32 = ReturnType<typeof loadUser32>
let user32: User32 | undefined

function loadUser32() {
  const lib = koffi.load('user32.dll')
  koffi.pointer('HWND', koffi.opaque())
  koffi.proto('bool __stdcall EnumWindowsProc(HWND hwnd, intptr_t lParam)')
  return {
    EnumWindows: lib.func('bool __stdcall EnumWindows(EnumWindowsProc *proc, intptr_t lParam)'),
    GetWindowThreadProcessId: lib.func('uint32_t __stdcall GetWindowThreadProcessId(HWND hwnd, _Out_ uint32_t *pid)'),
    GetWindow: lib.func('HWND __stdcall GetWindow(HWND hwnd, uint32_t cmd)'),
    IsWindowVisible: lib.func('bool __stdcall IsWindowVisible(HWND hwnd)'),
    ShowWindow: lib.func('bool __stdcall ShowWindow(HWND hwnd, int cmd)')
  }
}

/**
 * Maximiza a janela principal do processo assim que ela aparece (janela cheia, não tela
 * cheia). Serve para emuladores que não guardam essa opção, como o Kega Fusion, que nem tem
 * botão de maximizar. Fora do Windows não faz nada.
 */
export function maximizeWhenShown(pid: number): void {
  if (process.platform !== 'win32') return
  const api = (user32 ??= loadUser32())
  const deadline = Date.now() + TIMEOUT_MS
  const timer = setInterval(() => {
    const window = findMainWindow(api, pid)
    if (window) api.ShowWindow(window, SW_MAXIMIZE)
    if (window || Date.now() > deadline) clearInterval(timer)
  }, POLL_MS)
}

/** Janela visível e sem dono (não é um diálogo) do processo. */
function findMainWindow(api: User32, pid: number): unknown {
  let found: unknown = null
  api.EnumWindows((window: unknown) => {
    const owner = [0]
    api.GetWindowThreadProcessId(window, owner)
    if (owner[0] !== pid || !api.IsWindowVisible(window) || api.GetWindow(window, GW_OWNER)) return true
    found = window
    return false
  }, 0)
  return found
}
