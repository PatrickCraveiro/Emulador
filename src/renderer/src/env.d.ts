import type { EmuladorApi } from '@shared/types'

declare global {
  interface Window {
    emulador: EmuladorApi
  }
}
