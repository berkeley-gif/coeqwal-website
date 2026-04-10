"use client"

import { useMapStore } from "../store"
import type { OutcomeVisualization } from "../store"

/**
 * Convenience selector for the currently active map outcome visualization.
 *
 * Returns the { outcomeCode, scenarioId } pair when an outcome is displayed
 * on the map, or null when nothing is active.
 *
 * Useful for highlighting the active glyph in tool views:
 *   const active = useActiveMapOutcome()
 *   <OutcomeGlyphItem isSelected={active?.outcomeCode === code && active?.scenarioId === id} />
 */
export function useActiveMapOutcome(): OutcomeVisualization | null {
  return useMapStore((s) => s.activeOutcomeVisualization)
}
