import { useMemo, useRef } from "react"
import useSWR from "swr"
import {
  useMultipleScenarioTiers,
  useScenarioList,
  OUTCOME_CODE_ORDER,
  getOutcomeName,
} from "../../scenarios/hooks"
import {
  fetchScenarioTiers,
  fetchAllScenarioTiers,
} from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import type { ScenarioTiersResponse } from "@repo/data/coeqwal"
import {
  type VerticalParallelLineData,
  type TierHeatmapCell,
  type SankeyScenarioFlow,
  type TierSankeyGroup,
  getThemeLineColor,
} from "@repo/viz"
import type { ThemeKey } from "@repo/viz"
import { useScenarioExplorerStore } from "../store"
import { HYDROCLIMATE_ID_MAP } from "../../../content/scenarios"

const PRIMARY_BASELINE_ID = "s0020"
export const SANKEY_ALL_OUTCOMES = "__ALL__"

/**
 * Hook to transform tier data for VerticalParallelLinePlot.
 *
 * Reads the active hydroclimatePeriod from the store, resolves each sibling
 * group to the correct variant's short_code, and passes the mapping into
 * useMultipleScenarioTiers so only 24 scenarios are fetched per hydroclimate.
 * All returned data is keyed by sibling group IDs, making downstream code
 * hydroclimate-agnostic.
 */
export function useComparisonData() {
  const { buildIdMapping, getDisplayName, getThemeForScenario } =
    useScenarioList()

  const {
    hydroclimatePeriod,
    showAlternativeBaselines,
    showOnlyChosen,
    selectedScenarios,
  } = useScenarioExplorerStore()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

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
  // Increment morphGeneration each time hydroclimatePeriod actually changes
  // so chart components can detect when to animate vs. when to hard-redraw.
  const prevHCRef = useRef(hydroclimatePeriod)
  const morphGenRef = useRef(0)
  if (prevHCRef.current !== hydroclimatePeriod) {
    prevHCRef.current = hydroclimatePeriod
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
    if (showOnlyChosen && selectedScenarios.length > 0) {
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
    showOnlyChosen,
    selectedScenarios,
    getThemeForScenario,
  ])

  // Build scenarios array with dynamic names and theme-aligned colors.
  // Per-theme counters ensure each scenario gets the next step in its theme's
  // ColorBrewer multi-hue ramp (baseline = YlOrBr, ag_gw = YlGn, etc.).
  const scenarios = useMemo(() => {
    const themeCounters: Partial<Record<ThemeKey, number>> = {}
    return scenarioIds.map((id) => {
      const theme = getThemeForScenario(id) as ThemeKey
      const idx = themeCounters[theme] ?? 0
      themeCounters[theme] = idx + 1
      return {
        id,
        name: getDisplayName(id),
        color: getThemeLineColor(theme, idx, id),
      }
    })
  }, [scenarioIds, getDisplayName, getThemeForScenario])

  const allScenarios = useMemo(() => {
    const themeCounters: Partial<Record<ThemeKey, number>> = {}
    return allScenarioIds.map((id) => {
      const theme = getThemeForScenario(id) as ThemeKey
      const idx = themeCounters[theme] ?? 0
      themeCounters[theme] = idx + 1
      return {
        id,
        name: getDisplayName(id),
        color: getThemeLineColor(theme, idx, id),
      }
    })
  }, [allScenarioIds, getDisplayName, getThemeForScenario])

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
      values[name] =
        s?.normalized_score !== undefined ? s.normalized_score * 2 - 1 : null
    })
    return {
      id: PRIMARY_BASELINE_ID,
      name: getDisplayName(PRIMARY_BASELINE_ID),
      values,
      highlighted: false,
    }
  }, [parallelPlotData, allScoreData, getDisplayName])

  // Stable column ordering: always use the historical hydroclimate's baseline
  // scores so deviation chart columns don't rearrange on HC switch.
  const historicalIdMapping = useMemo(
    () => buildIdMapping("historical"),
    [buildIdMapping],
  )
  const historicalBaselineId = historicalIdMapping[PRIMARY_BASELINE_ID]

  const { data: historicalBaselineTiers } = useSWR(
    historicalBaselineId
      ? CACHE_KEYS.scenarioTiers(historicalBaselineId)
      : null,
    () =>
      historicalBaselineId
        ? fetchScenarioTiers(historicalBaselineId)
        : null,
  )

  const historicalBaselineScores = useMemo<Record<
    string,
    number | null
  > | null>(() => {
    if (!historicalBaselineTiers) return null
    const values: Record<string, number | null> = {}
    OUTCOME_CODE_ORDER.forEach((code) => {
      const tier = historicalBaselineTiers.tiers[code]
      values[getOutcomeName(code)] =
        tier?.normalized_score !== undefined
          ? tier.normalized_score * 2 - 1
          : null
    })
    return values
  }, [historicalBaselineTiers])

  // Fetch tier data for all three hydroclimates to compute cross-HC ranges.
  const allHCPeriods = useMemo(
    () => Object.keys(HYDROCLIMATE_ID_MAP),
    [],
  )
  const otherHCPeriods = useMemo(
    () => allHCPeriods.filter((p) => p !== hydroclimatePeriod),
    [allHCPeriods, hydroclimatePeriod],
  )

  const otherHCMappings = useMemo(
    () => otherHCPeriods.map((p) => ({ period: p, mapping: buildIdMapping(p) })),
    [otherHCPeriods, buildIdMapping],
  )

  const otherHC0Ids = useMemo(
    () => (otherHCMappings[0] ? Object.values(otherHCMappings[0].mapping) : []),
    [otherHCMappings],
  )
  const otherHC1Ids = useMemo(
    () => (otherHCMappings[1] ? Object.values(otherHCMappings[1].mapping) : []),
    [otherHCMappings],
  )

  const { data: rawOtherHC0 } = useSWR(
    otherHC0Ids.length > 0
      ? CACHE_KEYS.allScenarioTiers(otherHC0Ids)
      : null,
    () => fetchAllScenarioTiers(otherHC0Ids),
    { keepPreviousData: true },
  )
  const { data: rawOtherHC1 } = useSWR(
    otherHC1Ids.length > 0
      ? CACHE_KEYS.allScenarioTiers(otherHC1Ids)
      : null,
    () => fetchAllScenarioTiers(otherHC1Ids),
    { keepPreviousData: true },
  )

  const reKeyHC = (
    raw: Record<string, ScenarioTiersResponse> | undefined,
    mapping: Record<string, string>,
  ): Record<string, Record<string, number | null>> | null => {
    if (!raw) return null
    const reverse = new Map<string, string>()
    Object.entries(mapping).forEach(([gid, rid]) => reverse.set(rid, gid))
    const result: Record<string, Record<string, number | null>> = {}
    Object.entries(raw).forEach(([resolvedId, tierResp]) => {
      const groupId = reverse.get(resolvedId) ?? resolvedId
      const values: Record<string, number | null> = {}
      OUTCOME_CODE_ORDER.forEach((code) => {
        const tier = tierResp.tiers[code]
        values[getOutcomeName(code)] =
          tier?.normalized_score !== undefined
            ? tier.normalized_score * 2 - 1
            : null
      })
      result[groupId] = values
    })
    return result
  }

  const otherHCScores0 = useMemo(
    () =>
      otherHCMappings[0]
        ? reKeyHC(rawOtherHC0, otherHCMappings[0].mapping)
        : null,
    [rawOtherHC0, otherHCMappings],
  )
  const otherHCScores1 = useMemo(
    () =>
      otherHCMappings[1]
        ? reKeyHC(rawOtherHC1, otherHCMappings[1].mapping)
        : null,
    [rawOtherHC1, otherHCMappings],
  )

  const hcRangeData = useMemo<
    Record<string, Record<string, { min: number; max: number }>> | undefined
  >(() => {
    if (!allScoreData) return undefined
    const activeScores: Record<string, Record<string, number | null>> = {}
    Object.entries(allScoreData).forEach(([sid, scores]) => {
      const vals: Record<string, number | null> = {}
      OUTCOME_CODE_ORDER.forEach((code) => {
        const s = scores[code]
        vals[getOutcomeName(code)] =
          s?.normalized_score !== undefined ? s.normalized_score * 2 - 1 : null
      })
      activeScores[sid] = vals
    })

    const allHCScoreSets = [activeScores, otherHCScores0, otherHCScores1].filter(
      Boolean,
    ) as Record<string, Record<string, number | null>>[]

    if (allHCScoreSets.length < 2) return undefined

    const result: Record<string, Record<string, { min: number; max: number }>> =
      {}
    const outcomeNames = OUTCOME_CODE_ORDER.map(getOutcomeName)

    for (const sid of Object.keys(activeScores)) {
      const outcomeRanges: Record<string, { min: number; max: number }> = {}
      for (const outcomeName of outcomeNames) {
        let min = Infinity
        let max = -Infinity
        for (const scoreSet of allHCScoreSets) {
          const v = scoreSet[sid]?.[outcomeName]
          if (v != null) {
            if (v < min) min = v
            if (v > max) max = v
          }
        }
        if (min !== Infinity && max !== -Infinity) {
          outcomeRanges[outcomeName] = { min, max }
        }
      }
      if (Object.keys(outcomeRanges).length > 0) {
        result[sid] = outcomeRanges
      }
    }
    return Object.keys(result).length > 0 ? result : undefined
  }, [allScoreData, otherHCScores0, otherHCScores1])

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
    outcomeCodes: OUTCOME_CODE_ORDER,
    lineColors,
    scenarios,
    baselineScenario,
    historicalBaselineScores,
    allScenariosData,
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
    hcRangeData,
  }
}
