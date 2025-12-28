import { useMemo } from "react"
import {
  useMultipleScenarioTiers,
  useScenarioList,
  OUTCOME_DISPLAY_ORDER,
} from "../../scenarios/hooks"
import { createCategoricalColorScale, type VerticalParallelLineData } from "@repo/viz"

/**
 * Hook to transform tier data for VerticalParallelLinePlot
 */
export function useComparisonData() {
  // scenarioIds comes from the API - no hardcoding needed
  const { allScoreData, scenarioIds, isLoading: tiersLoading, error: tiersError } = useMultipleScenarioTiers()
  const { getDisplayName } = useScenarioList()

  const isLoading = tiersLoading
  const error = tiersError

  // Build scenarios array with dynamic names and colors
  const scenarios = useMemo(() => {
    const getColor = createCategoricalColorScale(scenarioIds.length)
    return scenarioIds.map((id, index) => ({
      id,
      name: getDisplayName(id),
      color: getColor(index),
    }))
  }, [scenarioIds, getDisplayName])

  const parallelPlotData: VerticalParallelLineData[] = useMemo(() => {
    if (!allScoreData || Object.keys(allScoreData).length === 0) {
      return []
    }

    return scenarios.map(({ id: scenarioId, name }) => {
      const scenarioScores = allScoreData[scenarioId] || {}

      const values: Record<string, number> = {}
      OUTCOME_DISPLAY_ORDER.forEach((outcome) => {
        const outcomeScore = scenarioScores[outcome]
        if (outcomeScore?.normalized_score !== undefined) {
          values[outcome] = outcomeScore.normalized_score * 2 - 1
        } else {
          values[outcome] = 0
        }
      })

      return {
        id: scenarioId,
        name,
        values,
        highlighted: false,
      }
    }).filter((scenario) => {
      return Object.keys(scenario.values).length > 0
    })
  }, [allScoreData, scenarios])

  const axes = useMemo(() => {
    return [...OUTCOME_DISPLAY_ORDER]
  }, [])

  const lineColors = useMemo(() => {
    // Create a lookup from the scenarios array
    const colorMap = new Map<string, string>(scenarios.map((s) => [s.id, s.color]))
    return parallelPlotData.map((data) => colorMap.get(data.id) || "#666666")
  }, [parallelPlotData, scenarios])

  return {
    data: parallelPlotData,
    axes,
    lineColors,
    scenarios,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
  }
}
