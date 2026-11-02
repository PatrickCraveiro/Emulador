import { useCallback, useEffect, useState } from 'react'
import type { Library } from '@shared/types'

export function useLibrary() {
  const [library, setLibrary] = useState<Library | null>(null)

  const reload = useCallback(async () => {
    try {
      setLibrary(await window.emulador.getLibrary())
    } catch (error) {
      setLibrary({ platforms: [], error: `Erro ao ler a biblioteca: ${(error as Error).message}` })
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { library, reload }
}
