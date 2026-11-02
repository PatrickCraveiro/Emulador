import { useCallback, useEffect, useRef, useState } from 'react'
import type { Toast } from '../types'

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback((text: string, kind: Toast['kind'] = 'info', duration = 2500) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), text, kind })
    timer.current = window.setTimeout(() => setToast(null), duration)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return { toast, showToast }
}
