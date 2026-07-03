"use client"

/**
 * useLearnScrollama - scroll callbacks for react-scrollama section detection
 */

import { useCallback } from "react"
import type { StepEvent, StepProgressEvent } from "react-scrollama"
import { mapActions } from "../store"
import type { SectionId } from "../config/sectionLayers"
import { smoothScrollToCenter } from "../../../utils/smoothScrollToCenter"

/**
 * Hook that returns scroll callbacks for react-scrollama.
 * Integrates with the Learn map Zustand store.
 */
export function useLearnScrollama() {
  /**
   * Called when a step enters the viewport.
   * Updates the active section in the store.
   */
  const onStepEnter = useCallback(
    ({ data, direction }: StepEvent<SectionId>) => {
      // The california step has no visible content. Entering it immediately triggers
      // the central-valley map state so the zoom animation starts right away.
      const effectiveSection = data === "california" ? "central-valley" : data
      mapActions.setActiveSection(effectiveSection)

      // Clear outcome visualization when entering any section other than scenario-intro
      // This handles cases where user scrolls quickly past the exit trigger
      if (data !== "scenario-intro") {
        mapActions.clearOutcomeVisualization()
      }

      // When naturally scrolling into the central-valley step, ease the content
      // to the viewport center using the same animation as the "Scroll to Explore"
      // button. Only fires on downward entry.not when scrolling back up.
      if (data === "central-valley" && direction === "down") {
        smoothScrollToCenter("central-valley-content")
      }
    },
    [],
  )

  /**
   * Called when a step exits the viewport.
   * Used for cleanup like clearing outcome visualization when leaving scenario-intro.
   */
  const onStepExit = useCallback(({ data }: StepEvent<SectionId>) => {
    // Clear outcome visualization when leaving scenario-intro section
    if (data === "scenario-intro") {
      mapActions.clearOutcomeVisualization()
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
        mapActions.setRiversProgress(riverProgress)
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
