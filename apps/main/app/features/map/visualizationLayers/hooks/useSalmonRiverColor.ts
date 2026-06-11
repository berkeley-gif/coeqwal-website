"use client"

/**
 * useSalmonRiverColor - tier color for Sacramento river when Salmon abundance is active
 */

import { useMemo } from "react"
import { useActiveOutcomeVisualization, useMapMode } from "../../store"
import { useTierData } from "./useTierData"

/**
 * Returns the tier color for the Sacramento river when Salmon abundance is active.
 * Returns undefined otherwise.
 */
export function useSalmonRiverColor(): string | undefined {
  const mapMode = useMapMode()
  const activeVisualization = useActiveOutcomeVisualization()

  const outcomeCode = activeVisualization?.outcomeCode ?? null
  const scenarioId = activeVisualization?.scenarioId ?? "s0020"

  // Only fetch tier data for Salmon abundance (code: WRC_SALMON_AB)
  const isSalmonAbundance = outcomeCode === "WRC_SALMON_AB"
  const isMapVisible =
    mapMode === "learn" || mapMode === "explore" || mapMode === "get-started"

  // Fetch tier data only when Salmon abundance is active (using outcomeCode)
  const { tierColorMap } = useTierData(
    isSalmonAbundance && isMapVisible ? outcomeCode : null,
    scenarioId,
  )

  // Extract the color from the tier map
  return useMemo(() => {
    if (!isSalmonAbundance || !isMapVisible) return undefined
    const colors = Object.values(tierColorMap)
    return colors.length > 0 ? colors[0] : undefined
  }, [isSalmonAbundance, isMapVisible, tierColorMap])
}
