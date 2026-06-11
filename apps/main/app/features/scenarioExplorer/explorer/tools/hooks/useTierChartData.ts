import { useMemo, useRef } from "react"
import {
  useMultipleScenarioTiers,
  useResolvedIdMapping,
  useScenarioList,
  OUTCOME_CODE_ORDER,
  getOutcomeName,
} from "../../../../scenarios/hooks"
import {
  type VerticalParallelLineData,
  getThemeLineColor,
  normalizedToRadar,
} from "@repo/viz"
import type { ThemeKey } from "@repo/viz"
import { useWorkspaceSlice, useListSlice } from "../../store"
import {
  NOD_SOD_OUTCOME_CODES,
  ALL_RADAR_AXES_ORDER,
} from "../../../../../content/outcomes"
import {
  getRegionalTierMean,
  type RegionalOutcomeCode,
} from "@repo/data/coeqwal"
import {
  PRIMARY_SCENARIO_BASELINE_ID,
  buildIndexWithinThemeMap,
} from "../../../utils/scenarioIdSort"

const PRIMARY_BASELINE_ID = PRIMARY_SCENARIO_BASELINE_ID
const HC_HISTORICAL = "historical"

// These helpers do NOT recompute tier scores. The API already produces
// `normalized_score` (0 = worst, 1 = best) and the frontend trusts it. The
// radar chart draws on an axis from -1 (center) to +1 (edge), so we only
// reproject the API value into that drawing coordinate. Presentation, not data.

// EXCEPTION: NOD/SOD regional outcomes are NOT served by the tier API. They come
// from a bundled static dataset (@repo/data/coeqwal regionalTierMeans.json) as
// raw tier means on the 1-4 scale, so here we redo the API's (4 - mean) / 3
// normalization locally. This duplicates API logic and is a candidate to fold
// back into the API.

/** Convert a regional tier mean (1-4 scale) to the radar's [-1, 1] axis,
 *  matching the API path: normalized_score = (4 - mean) / 3, then to the axis */
function tierMeanToRadarValue(tierMean: number): number {
  return normalizedToRadar((4 - tierMean) / 3)
}

/**
 * Tier data shaped for the radar chart
 *
 * Reads the active hydroclimate from the store, resolves each sibling
 * group to its variant's `short_code`, and fetches a single batch of
 * tier results. All returned data is keyed by sibling-group ids so
 * downstream chart code stays hydroclimate-agnostic.
 *
 * Used by RadarPanel, the Share tab, ShareDrawer, and the share-live
 * radar chart.
 *
 * @param hydroclimateOverride Pin the hook to a specific hydroclimate
 *   instead of reading the store (used by share captures rendered
 *   out of band)
 * @param includeAllScenariosInParallelPlot Skip the `showOnlyChosen`
 *   filter so every scenario row appears in the plot (used by the
 *   share tray and share URL hydration)
 */
export function useTierChartData(
  hydroclimateOverride?: string,
  includeAllScenariosInParallelPlot = false,
) {
  const { getDisplayName, getThemeForScenario } = useScenarioList()

  const { showAlternativeBaselines, selectedScenarios } = useWorkspaceSlice()
  const { showOnlyChosen } = useListSlice()

  const { hydroclimate, idMapping } = useResolvedIdMapping(hydroclimateOverride)

  const {
    allScoreData,
    scenarioIds: allScenarioIds,
    isLoading: tiersLoading,
    error: tiersError,
  } = useMultipleScenarioTiers(idMapping)

  const isLoading = tiersLoading
  const error = tiersError

  // Track hydroclimate changes to drive morph transitions.
  // Increment morphGeneration each time hydroclimate actually changes
  // so chart components can detect when to animate vs. when to hard-redraw.
  const prevHCRef = useRef(hydroclimate)
  const morphGenRef = useRef(0)
  if (prevHCRef.current !== hydroclimate) {
    prevHCRef.current = hydroclimate
    morphGenRef.current += 1
  }
  const morphGeneration = morphGenRef.current

  const scenarioIds = useMemo(() => {
    let filtered = showAlternativeBaselines
      ? allScenarioIds
      : allScenarioIds.filter(
          (id) =>
            getThemeForScenario(id) !== "baseline" ||
            id === PRIMARY_BASELINE_ID,
        )
    if (
      !includeAllScenariosInParallelPlot &&
      showOnlyChosen &&
      selectedScenarios.length > 0
    ) {
      const chosen = new Set(selectedScenarios)
      filtered = filtered.filter((id) => chosen.has(id))
    }
    return [...filtered].sort((a, b) => {
      if (a === PRIMARY_BASELINE_ID) return -1
      if (b === PRIMARY_BASELINE_ID) return 1
      return 0
    })
  }, [
    allScenarioIds,
    showAlternativeBaselines,
    includeAllScenariosInParallelPlot,
    showOnlyChosen,
    selectedScenarios,
    getThemeForScenario,
  ])

  const scenarioIndexWithinTheme = useMemo(
    () => buildIndexWithinThemeMap(scenarioIds, getThemeForScenario),
    [scenarioIds, getThemeForScenario],
  )

  // Build scenarios array with dynamic names and theme-aligned colors.
  // Within each theme, palette index follows the same order as the scenario sidebar
  // (primary baseline first, then ascending short code).
  const scenarios = useMemo(() => {
    return scenarioIds.map((id) => {
      const theme = getThemeForScenario(id) as ThemeKey
      const idx = scenarioIndexWithinTheme.get(id) ?? 0
      return {
        id,
        name: getDisplayName(id),
        color: getThemeLineColor(theme, idx, id),
      }
    })
  }, [
    scenarioIds,
    getDisplayName,
    getThemeForScenario,
    scenarioIndexWithinTheme,
  ])

  const parallelPlotData: VerticalParallelLineData[] = useMemo(() => {
    if (!allScoreData || Object.keys(allScoreData).length === 0) {
      return []
    }

    return scenarios
      .map(({ id: scenarioId, name }) => {
        const scenarioScores = allScoreData[scenarioId] || {}

        const values: Record<string, number | null> = {}
        OUTCOME_CODE_ORDER.forEach((code) => {
          const outcomeScore = scenarioScores[code]
          const displayName = getOutcomeName(code)
          // `normalized_score` is nullable (null when no tier row
          // exists or the distribution is degenerate). Use a null guard
          // rather than `!== undefined`, otherwise a real null would slip
          // through and produce `null * 2 - 1 = -1`, anchoring the axis
          // wrong.
          if (outcomeScore?.normalized_score != null) {
            values[displayName] = normalizedToRadar(
              outcomeScore.normalized_score,
            )
          } else {
            values[displayName] = null
          }
        })

        // Radar pulls NOD/SOD means only under the historical hydroclimate
        // today so it stays comparable to the current axis reference. The
        // underlying data package now carries cc50 and cc95 too, so opening
        // this up later is a matter of removing the guard.
        NOD_SOD_OUTCOME_CODES.forEach((code) => {
          const displayName = getOutcomeName(code)
          const raw =
            hydroclimate === HC_HISTORICAL
              ? getRegionalTierMean(
                  scenarioId,
                  code as RegionalOutcomeCode,
                  "historical",
                )
              : null
          values[displayName] = raw != null ? tierMeanToRadarValue(raw) : null
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
  }, [allScoreData, scenarios, hydroclimate])

  // Axes use display names for user-facing labels (standard + NOD/SOD)
  const axes = useMemo(() => {
    return ALL_RADAR_AXES_ORDER.map(getOutcomeName)
  }, [])

  // Per-axis min/max across ALL scenarios in the current hydroclimate.
  const axisRange = useMemo<
    Record<string, { min: number; max: number }>
  >(() => {
    if (!allScoreData) return {}
    const range: Record<string, { min: number; max: number }> = {}
    for (const scenarioId of allScenarioIds) {
      const scores = allScoreData[scenarioId]
      if (!scores) continue
      for (const code of OUTCOME_CODE_ORDER) {
        const s = scores[code]
        if (s?.normalized_score == null) continue
        const v = normalizedToRadar(s.normalized_score)
        const name = getOutcomeName(code)
        const cur = range[name]
        if (cur) {
          if (v < cur.min) cur.min = v
          if (v > cur.max) cur.max = v
        } else {
          range[name] = { min: v, max: v }
        }
      }

      if (hydroclimate !== HC_HISTORICAL) continue
      for (const code of NOD_SOD_OUTCOME_CODES) {
        const raw = getRegionalTierMean(
          scenarioId,
          code as RegionalOutcomeCode,
          "historical",
        )
        if (raw == null) continue
        const v = tierMeanToRadarValue(raw)
        const name = getOutcomeName(code)
        const cur = range[name]
        if (cur) {
          if (v < cur.min) cur.min = v
          if (v > cur.max) cur.max = v
        } else {
          range[name] = { min: v, max: v }
        }
      }
    }
    return range
  }, [allScoreData, allScenarioIds, hydroclimate])

  const lineColors = useMemo(() => {
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
      values[name] =
        s?.normalized_score != null
          ? normalizedToRadar(s.normalized_score)
          : null
    })
    NOD_SOD_OUTCOME_CODES.forEach((code) => {
      const name = getOutcomeName(code)
      const raw =
        hydroclimate === HC_HISTORICAL
          ? getRegionalTierMean(
              PRIMARY_BASELINE_ID,
              code as RegionalOutcomeCode,
              "historical",
            )
          : null
      values[name] = raw != null ? tierMeanToRadarValue(raw) : null
    })
    return {
      id: PRIMARY_BASELINE_ID,
      name: getDisplayName(PRIMARY_BASELINE_ID),
      values,
      highlighted: false,
    }
  }, [parallelPlotData, allScoreData, getDisplayName, hydroclimate])

  return {
    data: parallelPlotData,
    axes,
    axisRange,
    outcomeCodes: OUTCOME_CODE_ORDER,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
    morphGeneration,
  }
}
