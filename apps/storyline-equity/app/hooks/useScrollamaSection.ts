"use client"

/**
 * useScrollamaSection - scroll callbacks for react-scrollama section detection
 */

import { useCallback } from "react"
import type { StepEvent, StepProgressEvent } from "react-scrollama"
import { appActions, isAtOrAfterSection, SectionId } from "../store"

/**
 * Hook that returns scroll callbacks for react-scrollama.
 * Integrates with the Learn map Zustand store.
 */
export function useScrollamaSection() {
  /**
   * Called when a step enters the viewport.
   * Updates the active section in the store.
   */
  const onStepEnter = useCallback(
    ({ data, direction }: StepEvent<SectionId>) => {
      if (data === "Background") {
        appActions.setRiverProgress(0)
        appActions.setBackgroundProgress(0)
      } else if (data === "HistoricalContext") {
        appActions.setRiverProgress(1)
        appActions.setBackgroundProgress(0)
        // When returning from Gold Rush, enter Historical Context at its lower
        // boundary so the camera travels directly from Yuba back to McCloud.
        // Resetting this to zero first creates an unwanted statewide waypoint.
        appActions.setHistoricalContextProgress(direction === "up" ? 1 : 0)
      } else if (data === "GoldRush") {
        appActions.setRiverProgress(1)
        appActions.setGoldRushProgress(0)
        appActions.setYubaRiverProgress(0)
        appActions.setBackgroundProgress(0)
      } else if (data === "Infrastructure") {
        appActions.setRiverProgress(1)
        appActions.setYubaRiverProgress(1)
        appActions.setInfrastructureProgress(0)
        appActions.setBackgroundProgress(0)
        appActions.setGoldRushProgress(0)
      } else {
        appActions.setRiverProgress(
          isAtOrAfterSection(data, "HistoricalContext") ? 1 : 0,
        )
        appActions.setYubaRiverProgress(
          isAtOrAfterSection(data, "Infrastructure") ? 1 : 0,
        )
        appActions.setBackgroundProgress(0)
        appActions.setGoldRushProgress(0)
        appActions.setInfrastructureProgress(0)
      }

      appActions.setMcCloudRiverProgress(0)
      appActions.setClimateResilienceProgress(0)
      appActions.setTransparencyProgress(0)
      appActions.setConclusionProgress(0)
      appActions.setActiveSection(data)
      if (data !== "HistoricalContext") {
        appActions.setHistoricalContextProgress(0)
      }
    },
    [],
  )

  /**
   * Called when a step exits the viewport.
   * Used for cleanup like resetting geocoding when leaving find-basin,
   * and clearing outcome visualization when leaving scenario-intro.
   */
  const onStepExit = useCallback(() => {}, [])

  /**
   * Called during scroll within a step that has progress tracking enabled.
   * Used for animations like rivers that need 0-1 progress values.
   */
  const onStepProgress = useCallback(
    ({ data, progress }: StepProgressEvent<SectionId>) => {
      if (data === "HistoricalContext") {
        appActions.setHistoricalContextProgress(progress)
        return
      }

      if (data === "Infrastructure") {
        appActions.setInfrastructureProgress(progress)
        return
      }

      if (data === "ClimateResilience") {
        appActions.setClimateResilienceProgress(progress)
        return
      }

      if (data === "Transparency") {
        appActions.setTransparencyProgress(progress)
        return
      }

      if (data === "Conclusion") {
        appActions.setConclusionProgress(progress)
        return
      }

      if (data === "GoldRush") {
        appActions.setGoldRushProgress(progress)

        const startScroll = 0.16
        const endScroll = 0.58
        const clampedScroll = Math.max(
          startScroll,
          Math.min(endScroll, progress),
        )
        const animationProgress =
          (clampedScroll - startScroll) / (endScroll - startScroll)

        appActions.setYubaRiverProgress(animationProgress)
        return
      }

      if (data !== "Background") return

      appActions.setBackgroundProgress(progress)

      const startScroll = 0.03
      const endScroll = 0.14

      const clampedScroll = Math.max(startScroll, Math.min(endScroll, progress))
      const animationProgress =
        (clampedScroll - startScroll) / (endScroll - startScroll)

      appActions.setRiverProgress(animationProgress)
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
