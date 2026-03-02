"use client"

/**
 * useScrollSideEffect - Fire callbacks when scroll progress crosses thresholds
 *
 * Declarative replacement for the common pattern of using useMotionValueEvent
 * with manual threshold checks. Tracks which thresholds have been crossed
 * to prevent duplicate calls, and fires exit callbacks when scrolling back.
 *
 * @example
 * const progress = useScrollProgress()
 *
 * useScrollSideEffect(progress, [
 *   { at: 0.1, enter: () => addMarker("salmon"), exit: () => removeMarker("salmon") },
 *   { at: 0.5, enter: () => setLayer("rivers", true), exit: () => setLayer("rivers", false) },
 * ])
 */

import { useEffect, useRef } from "react"
import type { MotionValue } from "@repo/motion"

interface ScrollThreshold {
  /** Progress value (0-1) at which to fire the callback */
  at: number
  /** Called when progress crosses above `at` */
  enter?: () => void
  /** Called when progress crosses back below `at` */
  exit?: () => void
}

export function useScrollSideEffect(
  progress: MotionValue<number>,
  thresholds: ScrollThreshold[],
) {
  const crossedRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const sorted = [...thresholds].sort((a, b) => a.at - b.at)
    const crossed = crossedRef.current

    // Initialize based on current progress so we don't fire stale
    // enter/exit callbacks on mount
    const current = progress.get()
    crossed.clear()
    for (const t of sorted) {
      if (current >= t.at) {
        crossed.add(t.at)
      }
    }

    const unsubscribe = progress.on("change", (value: number) => {
      for (const t of sorted) {
        const wasCrossed = crossed.has(t.at)

        if (value >= t.at && !wasCrossed) {
          crossed.add(t.at)
          t.enter?.()
        } else if (value < t.at && wasCrossed) {
          crossed.delete(t.at)
          t.exit?.()
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [progress, thresholds])
}
