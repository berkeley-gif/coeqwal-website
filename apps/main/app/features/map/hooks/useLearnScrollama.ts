/**
 * useLearnScrollama Hook
 *
 * Provides scroll callbacks for react-scrollama integration.
 * Handles section detection and progress tracking for the Learn map.
 */

import { useCallback } from "react"
import type { StepEvent, StepProgressEvent } from "react-scrollama"
import { learnMapActions, type SectionId } from "../store"

/**
 * Hook that returns scroll callbacks for react-scrollama.
 * Integrates with the Learn map Zustand store.
 */
export function useLearnScrollama() {
  /**
   * Called when a step enters the viewport.
   * Updates the active section in the store.
   */
  const onStepEnter = useCallback(({ data }: StepEvent<SectionId>) => {
    learnMapActions.setActiveSection(data)

    // Clear outcome visualization when entering any section other than scenario-intro
    // This handles cases where user scrolls quickly past the exit trigger
    if (data !== "scenario-intro") {
      learnMapActions.setSelectedOutcome(null)
    }
  }, [])

  /**
   * Called when a step exits the viewport.
   * Used for cleanup like resetting geocoding when leaving find-basin,
   * and clearing outcome visualization when leaving scenario-intro.
   */
  const onStepExit = useCallback(({ data }: StepEvent<SectionId>) => {
    // Reset geocoding when leaving find-basin section
    if (data === "find-basin") {
      learnMapActions.resetGeocoding()
    }

    // Clear outcome visualization when leaving scenario-intro section
    if (data === "scenario-intro") {
      learnMapActions.setSelectedOutcome(null)
    }
  }, [])

  /**
   * Called during scroll within a step that has progress tracking enabled.
   * Used for animations like rivers that need 0-1 progress values.
   */
  const onStepProgress = useCallback(
    ({ data, progress }: StepProgressEvent<SectionId>) => {
      // Rivers animation uses progress to draw rivers progressively
      if (data === "rivers") {
        // Scale progress: rivers animate during first ~67% of section scroll
        const riverProgress = Math.min(1, progress * 1.5)
        learnMapActions.setRiversProgress(riverProgress)
      }
    },
    [],
  )

  return {
    onStepEnter,
    onStepExit,
    onStepProgress,
  }
}

/**
 * Scrollama configuration constants
 */
export const SCROLLAMA_CONFIG = {
  /** Offset from top of viewport where step triggers (0-1) */
  offset: 0.5,
  /** Enable debug mode (set to true to see trigger line) */
  debug: false,
} as const
