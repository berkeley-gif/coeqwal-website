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

  const outcome = activeVisualization?.outcome ?? null
  const scenarioId = activeVisualization?.scenarioId ?? "s0020"

  // Only fetch tier data for Salmon abundance
  const isSalmonAbundance = outcome === "Salmon abundance"
  const isMapVisible = mapMode === "learn" || mapMode === "explore"

  // Fetch tier data only when Salmon abundance is active
  const { tierColorMap } = useTierData(
    isSalmonAbundance && isMapVisible ? outcome : null,
    scenarioId,
  )

  // Extract the color from the tier map
  return useMemo(() => {
    if (!isSalmonAbundance || !isMapVisible) return undefined
    const colors = Object.values(tierColorMap)
    return colors.length > 0 ? colors[0] : undefined
  }, [isSalmonAbundance, isMapVisible, tierColorMap])
}
