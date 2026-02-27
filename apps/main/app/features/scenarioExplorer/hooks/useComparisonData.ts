import { useMemo } from "react"
import {
  useMultipleScenarioTiers,
  useScenarioList,
  OUTCOME_CODE_ORDER,
  getOutcomeName,
} from "../../scenarios/hooks"
import { type VerticalParallelLineData, getThemeLineColor } from "@repo/viz"
import { getScenarioTheme } from "../../../content/scenarios"
import type { ThemeKey } from "@repo/viz"
import { useScenarioExplorerStore } from "../store"

const PRIMARY_BASELINE_ID = "s0020"

/**
 * Hook to transform tier data for VerticalParallelLinePlot
 */
export function useComparisonData() {
  // scenarioIds comes from the API - no hardcoding needed
  const {
    allScoreData,
    scenarioIds: allScenarioIds,
    isLoading: tiersLoading,
    error: tiersError,
  } = useMultipleScenarioTiers()
  const { getDisplayName } = useScenarioList()

  const { showDefinitions } = useScenarioExplorerStore()

  const isLoading = tiersLoading
  const error = tiersError

  // Apply baseline filter and ensure s0020 is always listed first.
  // When showDefinitions is false, only s0020 is shown from the baseline theme —
  // matching the filter logic in StrategyGridContent and ScenarioSelectionSidebar.
  const scenarioIds = useMemo(() => {
    const filtered = showDefinitions
      ? allScenarioIds
      : allScenarioIds.filter(
          (id) => getScenarioTheme(id) !== "baseline" || id === PRIMARY_BASELINE_ID,
        )
    return [...filtered].sort((a, b) => {
      if (a === PRIMARY_BASELINE_ID) return -1
      if (b === PRIMARY_BASELINE_ID) return 1
      return 0
    })
  }, [allScenarioIds, showDefinitions])

  // Build scenarios array with dynamic names and theme-aligned colors.
  // Per-theme counters ensure each scenario gets the next step in its theme's
  // ColorBrewer multi-hue ramp (baseline = YlOrBr, ag_gw = YlGn, etc.).
  const scenarios = useMemo(() => {
    const themeCounters: Partial<Record<ThemeKey, number>> = {}
    return scenarioIds.map((id) => {
      const theme = getScenarioTheme(id) as ThemeKey
      const idx = themeCounters[theme] ?? 0
      themeCounters[theme] = idx + 1
      return {
        id,
        name: getDisplayName(id),
        color: getThemeLineColor(theme, idx, id),
      }
    })
  }, [scenarioIds, getDisplayName])

  const parallelPlotData: VerticalParallelLineData[] = useMemo(() => {
    if (!allScoreData || Object.keys(allScoreData).length === 0) {
      return []
    }

    return scenarios
      .map(({ id: scenarioId, name }) => {
        const scenarioScores = allScoreData[scenarioId] || {}

        // Use display names as keys for the parallel plot axes
        // Use null for missing data (creates gaps in the chart)
        const values: Record<string, number | null> = {}
        OUTCOME_CODE_ORDER.forEach((code) => {
          const outcomeScore = scenarioScores[code]
          const displayName = getOutcomeName(code)
          if (outcomeScore?.normalized_score !== undefined) {
            values[displayName] = outcomeScore.normalized_score * 2 - 1
          } else {
            values[displayName] = null
          }
        })

        return {
          id: scenarioId,
          name,
          values,
          highlighted: false,
        }
      })
      .filter((scenario) => {
        return Object.keys(scenario.values).length > 0
      })
  }, [allScoreData, scenarios])

  // Axes use display names for user-facing labels
  const axes = useMemo(() => {
    return OUTCOME_CODE_ORDER.map(getOutcomeName)
  }, [])

  const lineColors = useMemo(() => {
    // Create a lookup from the scenarios array
    const colorMap = new Map<string, string>(
      scenarios.map((s) => [s.id, s.color]),
    )
    return parallelPlotData.map((data) => colorMap.get(data.id) || "#666666")
  }, [parallelPlotData, scenarios])

  const baselineScenario = useMemo(
    () => parallelPlotData.find((d) => d.id === "s0020") || null,
    [parallelPlotData],
  )

  return {
    data: parallelPlotData,
    axes,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
  }
}
