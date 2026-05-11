import { useMemo, useRef } from "react"
import {
  useMultipleScenarioTiers,
  useResolvedIdMapping,
  useScenarioList,
  OUTCOME_CODE_ORDER,
  getOutcomeName,
} from "../../scenarios/hooks"
import {
  type VerticalParallelLineData,
  type TierHeatmapCell,
  type SankeyScenarioFlow,
  type TierSankeyGroup,
  getThemeLineColor,
} from "@repo/viz"
import type { ThemeKey } from "@repo/viz"
import { useScenarioExplorerStore } from "../store"
import {
  NOD_SOD_OUTCOME_CODES,
  ALL_RADAR_AXES_ORDER,
} from "../../../content/outcomes"
import {
  getRegionalTierMean,
  type RegionalOutcomeCode,
} from "@repo/data/coeqwal"
import {
  PRIMARY_SCENARIO_BASELINE_ID,
  buildIndexWithinThemeMap,
} from "../utils/scenarioIdSort"

const PRIMARY_BASELINE_ID = PRIMARY_SCENARIO_BASELINE_ID
export const SANKEY_ALL_OUTCOMES = "__ALL__"

const HC_HISTORICAL = "historical"

/** Convert a tier mean (1-4 scale) to the radar chart's internal format,
 *  matching the API path: normalized_score = (4 - ws) / 3, then * 2 - 1. */
function tierMeanToRadarValue(tierMean: number): number {
  return ((4 - tierMean) / 3) * 2 - 1
}

/**
 * Hook to transform tier data for VerticalParallelLinePlot.
 *
 * Reads the active hydroclimatePeriod from the store, resolves each sibling
 * group to the correct variant's short_code, and passes the mapping into
 * useMultipleScenarioTiers so only 24 scenarios are fetched per hydroclimate.
 * All returned data is keyed by sibling group IDs, making downstream code
 * hydroclimate-agnostic.
 *
 * @param hydroclimateOverride When set (e.g. for share live radar), use this
 *   period for tier mapping and NOD/SOD handling instead of the store value.
 * @param includeAllScenariosInParallelPlot When true, do not filter by
 *   showOnlyChosen so every scenario row is available (share tray / URL).
 */
export function useComparisonData(
  hydroclimateOverride?: string,
  includeAllScenariosInParallelPlot = false,
) {
  const { getDisplayName, getThemeForScenario } = useScenarioList()

  const { showAlternativeBaselines, showOnlyChosen, selectedScenarios } =
    useScenarioExplorerStore()

  const { hydroclimate, idMapping } = useResolvedIdMapping(hydroclimateOverride)

  const {
    allScoreData,
    allScenariosData,
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

  const allScenarioIndexWithinTheme = useMemo(
    () => buildIndexWithinThemeMap(allScenarioIds, getThemeForScenario),
    [allScenarioIds, getThemeForScenario],
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

  const allScenarios = useMemo(() => {
    return allScenarioIds.map((id) => {
      const theme = getThemeForScenario(id) as ThemeKey
      const idx = allScenarioIndexWithinTheme.get(id) ?? 0
      return {
        id,
        name: getDisplayName(id),
        color: getThemeLineColor(theme, idx, id),
      }
    })
  }, [
    allScenarioIds,
    getDisplayName,
    getThemeForScenario,
    allScenarioIndexWithinTheme,
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
          if (outcomeScore?.normalized_score !== undefined) {
            let v = outcomeScore.normalized_score * 2 - 1
            // Winter-run salmon tier scores sometimes come through above 4
            // on the 1-4 tier scale, which maps to radar values below -1.
            // Clip anything over 4 back to 4 (radar value -1) so those
            // scenarios still render at the bottom of the axis instead of
            // clipping off-chart. Not clear why the upstream scores exceed
            // 4. Leaving that for someone else to figure out.
            if (code === "WRC_SALMON_AB" && v < -1) v = -1
            values[displayName] = v
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
        if (s?.normalized_score === undefined) continue
        let v = s.normalized_score * 2 - 1
        // Match the salmon clamp in parallelPlotData so axis min/max does
        // not get dragged off the bottom of the radar.
        if (code === "WRC_SALMON_AB" && v < -1) v = -1
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
      values[name] =
        s?.normalized_score !== undefined ? s.normalized_score * 2 - 1 : null
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

  // Tier heatmap data: scenario × outcome matrix
  const heatmapCells = useMemo<TierHeatmapCell[]>(() => {
    if (!allScoreData || !allScenariosData) return []
    const cells: TierHeatmapCell[] = []
    scenarios.forEach(({ id: scenarioId, name }) => {
      const scores = allScoreData[scenarioId]
      const raw = allScenariosData[scenarioId]
      if (!scores) return
      OUTCOME_CODE_ORDER.forEach((code) => {
        const score = scores[code]
        if (!score) return
        let tierLevel: number
        if (
          raw?.tiers[code]?.type === "single_value" &&
          raw.tiers[code].level
        ) {
          tierLevel = raw.tiers[code].level!
        } else {
          tierLevel = Math.min(4, Math.max(1, Math.round(score.weighted_score)))
        }
        cells.push({
          scenarioId,
          scenarioName: name,
          outcomeCode: code,
          outcomeName: getOutcomeName(code),
          tierLevel,
          normalizedScore: score.normalized_score,
        })
      })
    })
    return cells
  }, [allScoreData, allScenariosData, scenarios])

  // Sankey data builder: returns flows for a given multi-value outcome code
  const getSankeyData = useMemo(() => {
    return (outcomeCode: string): SankeyScenarioFlow[] => {
      if (!allScenariosData) return []
      return scenarios
        .map(({ id, name, color }) => {
          const tierInfo = allScenariosData[id]?.tiers[outcomeCode]
          if (!tierInfo || tierInfo.type !== "multi_value" || !tierInfo.data)
            return null
          return {
            scenarioId: id,
            scenarioName: name,
            color,
            flows: tierInfo.data.map((d) => ({
              tier: d.tier,
              value: d.value,
            })),
          }
        })
        .filter(Boolean) as SankeyScenarioFlow[]
    }
  }, [allScenariosData, scenarios])

  // Multi-value outcome codes (for Sankey selector and "All Outcomes" aggregation)
  const multiValueOutcomeCodes = useMemo(() => {
    if (!allScenariosData) return [] as string[]
    const firstScenario = Object.values(allScenariosData)[0]
    if (!firstScenario) return [] as string[]
    return OUTCOME_CODE_ORDER.filter(
      (code) => firstScenario.tiers[code]?.type === "multi_value",
    )
  }, [allScenariosData])

  // Sankey builder using ALL scenarios (unfiltered) for discovery/selection mode.
  // When SANKEY_ALL_OUTCOMES, uses compound keys like "CWS_DEL:tier1" for per-outcome layout.
  const getAllSankeyData = useMemo(() => {
    return (outcomeCode: string): SankeyScenarioFlow[] => {
      if (!allScenariosData) return []

      if (outcomeCode === SANKEY_ALL_OUTCOMES) {
        return allScenarios
          .map(({ id, name, color }) => {
            const scenarioTiers = allScenariosData[id]?.tiers
            if (!scenarioTiers) return null
            const flows: { tier: string; value: number }[] = []
            multiValueOutcomeCodes.forEach((code) => {
              const ti = scenarioTiers[code]
              if (ti?.type === "multi_value" && ti.data) {
                ti.data.forEach((d) => {
                  if (d.value > 0) {
                    flows.push({ tier: `${code}:${d.tier}`, value: d.value })
                  }
                })
              }
            })
            if (flows.length === 0) return null
            return { scenarioId: id, scenarioName: name, color, flows }
          })
          .filter(Boolean) as SankeyScenarioFlow[]
      }

      return allScenarios
        .map(({ id, name, color }) => {
          const tierInfo = allScenariosData[id]?.tiers[outcomeCode]
          if (!tierInfo || tierInfo.type !== "multi_value" || !tierInfo.data)
            return null
          return {
            scenarioId: id,
            scenarioName: name,
            color,
            flows: tierInfo.data.map((d) => ({
              tier: d.tier,
              value: d.value,
            })),
          }
        })
        .filter(Boolean) as SankeyScenarioFlow[]
    }
  }, [allScenariosData, allScenarios, multiValueOutcomeCodes])

  // Weighted-average Sankey: one flow per outcome to its rounded tier.
  // When SANKEY_ALL_OUTCOMES, uses compound keys for per-outcome layout.
  const getWeightedSankeyData = useMemo(() => {
    return (outcomeCode: string): SankeyScenarioFlow[] => {
      if (!allScoreData) return []

      if (outcomeCode === SANKEY_ALL_OUTCOMES) {
        return allScenarios
          .map(({ id, name, color }) => {
            const scores = allScoreData[id]
            if (!scores) return null
            const flows: { tier: string; value: number }[] = []
            OUTCOME_CODE_ORDER.forEach((code) => {
              const s = scores[code]
              if (!s) return
              const t = Math.min(4, Math.max(1, Math.round(s.weighted_score)))
              flows.push({ tier: `${code}:tier${t}`, value: 1 })
            })
            if (flows.length === 0) return null
            return { scenarioId: id, scenarioName: name, color, flows }
          })
          .filter(Boolean) as SankeyScenarioFlow[]
      }

      return allScenarios
        .map(({ id, name, color }) => {
          const score = allScoreData[id]?.[outcomeCode]
          if (!score) return null
          const tier = Math.min(
            4,
            Math.max(1, Math.round(score.weighted_score)),
          )
          const tierKey = `tier${tier}`
          return {
            scenarioId: id,
            scenarioName: name,
            color,
            flows: [{ tier: tierKey, value: 1 }],
          }
        })
        .filter(Boolean) as SankeyScenarioFlow[]
    }
  }, [allScoreData, allScenarios])

  // Groups for the grouped Sankey layout (one group per outcome)
  const sankeyGroups = useMemo<TierSankeyGroup[]>(
    () =>
      OUTCOME_CODE_ORDER.map((code) => ({
        key: code,
        label: getOutcomeName(code),
      })),
    [],
  )

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
    heatmapCells,
    getSankeyData,
    getAllSankeyData,
    getWeightedSankeyData,
    sankeyGroups,
    multiValueOutcomeCodes,
    morphGeneration,
  }
}
