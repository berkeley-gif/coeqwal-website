"use client"

/**
 * usePerfPaintMark - dev-only paint approximation (flag-gated)
 *
 * Emits a perf mark two animation frames after `ready` first becomes true
 * for a given `signature`, approximating when the freshly loaded charts hit
 * the screen. A signature change (new selection) re-arms the mark.
 * No-op unless NEXT_PUBLIC_PERF_LOG=1.
 */

import { useEffect, useRef } from "react"
import { isPerfEnabled, perfMark } from "@repo/data/perf"

export function usePerfPaintMark(
  name: string,
  ready: boolean,
  signature: string,
): void {
  const markedForRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isPerfEnabled() || !ready) return
    if (markedForRef.current === signature) return
    markedForRef.current = signature
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => perfMark(name, { signature }))
    })
    return () => cancelAnimationFrame(id)
  }, [name, ready, signature])
}
