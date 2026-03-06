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

  const { showAlternativeBaselines, showOnlyChosen, selectedScenarios } =
    useScenarioExplorerStore()

  const isLoading = tiersLoading
  const error = tiersError

  // Apply baseline filter and ensure s0020 is always listed first.
  // When showAlternativeBaselines is false, only s0020 is shown from the baseline theme.
  const scenarioIds = useMemo(() => {
    let filtered = showAlternativeBaselines
      ? allScenarioIds
      : allScenarioIds.filter(
          (id) =>
            getScenarioTheme(id) !== "baseline" || id === PRIMARY_BASELINE_ID,
        )
    if (showOnlyChosen && selectedScenarios.length > 0) {
      const chosen = new Set(selectedScenarios)
      filtered = filtered.filter((id) => chosen.has(id))
    }
    return [...filtered].sort((a, b) => {
      if (a === PRIMARY_BASELINE_ID) return -1
      if (b === PRIMARY_BASELINE_ID) return 1
      return 0
    })
  }, [allScenarioIds, showAlternativeBaselines, showOnlyChosen, selectedScenarios])

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

  // Always compute baseline from full score data so relative-to-baseline
  // works even when the baseline is filtered out of the visible set.
  const baselineScenario = useMemo<VerticalParallelLineData | null>(() => {
    const inPlot = parallelPlotData.find((d) => d.id === PRIMARY_BASELINE_ID)
    if (inPlot) return inPlot

    if (!allScoreData?.[PRIMARY_BASELINE_ID]) return null
    const scores = allScoreData[PRIMARY_BASELINE_ID]
    const values: Record<string, number | null> = {}
    OUTCOME_CODE_ORDER.forEach((code) => {
      const s = scores[code]
      const name = getOutcomeName(code)
      values[name] = s?.normalized_score !== undefined ? s.normalized_score * 2 - 1 : null
    })
    return {
      id: PRIMARY_BASELINE_ID,
      name: getDisplayName(PRIMARY_BASELINE_ID),
      values,
      highlighted: false,
    }
  }, [parallelPlotData, allScoreData, getDisplayName])

  return {
    data: parallelPlotData,
    axes,
    outcomeCodes: OUTCOME_CODE_ORDER,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
  }
}
