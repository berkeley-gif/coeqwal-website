"use client"

import { useCallback, useRef } from "react"

/** Mutable slot a panel fills on mount. register is stable for panelProps */
export function useCaptureRef<T>() {
  const ref = useRef<T | null>(null)
  const register = useCallback((fn: T) => {
    ref.current = fn
  }, [])
  return { ref, register }
}
