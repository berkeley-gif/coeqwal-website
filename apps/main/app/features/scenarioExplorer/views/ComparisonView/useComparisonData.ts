import { useMemo } from "react"
import {
  useMultipleScenarioTiers,
  OUTCOME_DISPLAY_ORDER,
} from "../../../../hooks/useTierData"
import type { VerticalParallelLineData } from "@repo/viz"

// All available scenarios with their display names and colors
const SCENARIOS = [
  // Baseline scenarios
  { id: "s0020", name: "Current operations", color: "#ff7f0e" },
  { id: "s0021", name: "Current ops w/o TUCPs", color: "#2196f3" },
  { id: "s0011", name: "Current ops w/ historical ag", color: "#4caf50" },
  { id: "s0023", name: "2024 USBR BiOps w/o TUCPs", color: "#9c27b0" },
  { id: "s0024", name: "2024 USBR BiOps", color: "#e91e63" },
  // Groundwater scenarios
  { id: "s0025", name: "SGMA: San Joaquin Valley", color: "#00bcd4" },
  { id: "s0027", name: "SGMA: Central Valley", color: "#009688" },
  // Environmental scenarios
  { id: "s0029", name: "Functional flows", color: "#8bc34a" },
] as const

/**
 * Hook to transform tier data for VerticalParallelLinePlot
 * Now uses normalized_score directly from API instead of calculating manually
 */
export function useComparisonData() {
  const { allScoreData, isLoading, error } = useMultipleScenarioTiers()

  const parallelPlotData: VerticalParallelLineData[] = useMemo(() => {
    if (!allScoreData || Object.keys(allScoreData).length === 0) {
      return []
    }

    return SCENARIOS.map(({ id: scenarioId, name }) => {
      const scenarioScores = allScoreData[scenarioId] || {}

      // Use normalized_score from API (0-1 scale, higher = better)
      // Convert to -1 to 1 scale for the chart: (normalized_score * 2) - 1
      const values: Record<string, number> = {}
      OUTCOME_DISPLAY_ORDER.forEach((outcome) => {
        const outcomeScore = scenarioScores[outcome]
        if (outcomeScore?.normalized_score !== undefined) {
          // Convert 0-1 to -1 to 1 range
          values[outcome] = outcomeScore.normalized_score * 2 - 1
        } else {
          values[outcome] = 0 // Default if no data
        }
      })

      return {
        id: scenarioId,
        name,
        values,
        highlighted: false,
      }
    }).filter((scenario) => {
      // Only include scenarios that have data
      return Object.values(scenario.values).some((v) => v !== 0)
    })
  }, [allScoreData])

  const axes = useMemo(() => {
    return [...OUTCOME_DISPLAY_ORDER] // Use outcome names as axes
  }, [])

  // Extract colors for scenarios that have data
  const lineColors = useMemo(() => {
    return parallelPlotData.map((data) => {
      const scenario = SCENARIOS.find((s) => s.id === data.id)
      return scenario?.color || "#666666"
    })
  }, [parallelPlotData])

  return {
    data: parallelPlotData,
    axes,
    lineColors,
    scenarios: SCENARIOS,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
  }
}
