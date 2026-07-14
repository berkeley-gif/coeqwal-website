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
    if (!isPerfEnabled()) return
    if (!ready) {
      // Selection cleared or data reloading: re-arm so a repeat selection
      // of the same signature (the warm-cache lane) marks again.
      markedForRef.current = null
      return
    }
    if (markedForRef.current === signature) return
    markedForRef.current = signature
    // StrictMode-safe: if cleanup cancels the frames before the mark fired
    // (dev double-invoked effects), un-claim the signature so the re-run
    // schedules again instead of skipping forever.
    let fired = false
    let innerId = 0
    const outerId = requestAnimationFrame(() => {
      innerId = requestAnimationFrame(() => {
        fired = true
        perfMark(name, { signature })
      })
    })
    return () => {
      cancelAnimationFrame(outerId)
      if (innerId) cancelAnimationFrame(innerId)
      if (!fired) markedForRef.current = null
    }
  }, [name, ready, signature])
}
