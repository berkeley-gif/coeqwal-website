"use client"

/**
 * useScrollPhase - Determine the current scroll phase and sub-progress
 *
 * Given a scroll progress MotionValue and phase thresholds, returns
 * the current phase ("before" | "enter" | "hold" | "exit" | "after")
 * and a 0-1 sub-progress within that phase.
 *
 * @example
 * const progress = useScrollProgress(ref)
 * const { phase, phaseProgress } = useScrollPhase(progress, {
 *   enter: [0, 0.3],
 *   hold: [0.3, 0.7],
 *   exit: [0.7, 1],
 * })
 */

import { useState, useEffect } from "react"
import type { MotionValue } from "framer-motion"
import type { ScrollPhase, PhaseThresholds } from "../types"
import { getPhase, getSubProgress } from "../utils"

interface ScrollPhaseResult {
  /** Current phase name */
  phase: ScrollPhase
  /** Progress within the current phase (0-1) */
  phaseProgress: number
  /** Raw scroll progress (0-1) */
  progress: number
}

export function useScrollPhase(
  scrollProgress: MotionValue<number>,
  thresholds: PhaseThresholds,
): ScrollPhaseResult {
  const [result, setResult] = useState<ScrollPhaseResult>({
    phase: "before",
    phaseProgress: 0,
    progress: 0,
  })

  useEffect(() => {
    const unsubscribe = scrollProgress.on("change", (value) => {
      const phase = getPhase(value, thresholds)

      let phaseProgress = 0
      switch (phase) {
        case "enter":
          phaseProgress = getSubProgress(value, thresholds.enter)
          break
        case "hold":
          phaseProgress = thresholds.hold
            ? getSubProgress(value, thresholds.hold)
            : 1
          break
        case "exit":
          phaseProgress = thresholds.exit
            ? getSubProgress(value, thresholds.exit)
            : 1
          break
        case "after":
          phaseProgress = 1
          break
        default:
          phaseProgress = 0
      }

      setResult({ phase, phaseProgress, progress: value })
    })

    return unsubscribe
  }, [scrollProgress, thresholds])

  return result
}
