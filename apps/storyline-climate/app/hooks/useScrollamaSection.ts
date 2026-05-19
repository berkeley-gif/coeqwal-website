"use client"

/**
 * useScrollamaSection - scroll callbacks for react-scrollama section detection
 */

import { useCallback } from "react"
import type { StepEvent } from "react-scrollama"
import { appActions, SectionId } from "../store"

/**
 * Hook that returns scroll callbacks for react-scrollama.
 * Integrates with the Learn map Zustand store.
 */
export function useScrollamaSection() {
  /**
   * Called when a step enters the viewport.
   * Updates the active section in the store.
   */
  const onStepEnter = useCallback(({ data }: StepEvent<SectionId>) => {
    // The california step has no visible content; entering it immediately triggers
    // the central-valley map state so the zoom animation starts right away.
    appActions.setActiveSection(data)
  }, [])

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
  const onStepProgress = useCallback(() => {
    // Rivers animation uses progress to draw rivers progressively
  }, [])

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
