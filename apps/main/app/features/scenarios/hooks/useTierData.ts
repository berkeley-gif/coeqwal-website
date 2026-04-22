import { useMemo, useEffect, useRef } from "react"
import { useTheme } from "@repo/ui/mui"
import useSWR, { useSWRConfig } from "swr"
import { useTiers, useScenarios } from "@repo/data/coeqwal/hooks"
import { fetchAllScenarioTiers, fetchScenarioTiers } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import type { ScenarioTiersResponse, TierScores } from "@repo/data/coeqwal"
import {
  convertMultiValueToChartData,
  convertSingleValueToChartData,
} from "../../../lib/api/tierApi"
import { getThemeColorsForApi, type TierColors } from "../../../content/tiers"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_DEFINITIONS,
  getOutcomeName,
} from "../../../content/outcomes"
import type { ChartDataPoint } from "../components/shared/types"

interface OutcomeInfo {
  shortCode: string
  displayName: string
}

/**
 * Score data for an outcome, used for sorting and visualization
 * Keyed by short code (e.g., "CWS_DEL")
 */
export interface OutcomeScoreData extends TierScores {
  shortCode: string
  type: "single_value" | "multi_value"
}

/**
 * Process scenario tier data into chart format.
 * Data is keyed by short code (e.g., "CWS_DEL").
 */
const processScenarioData = (
  scenarioData: ScenarioTiersResponse,
  themeColors: TierColors,
): Record<string, Array<ChartDataPoint>> => {
  const converted: Record<string, Array<ChartDataPoint>> = {}

  Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
    // Key directly by short code from API
    if (tierInfo.type === "multi_value" && tierInfo.data) {
      converted[shortCode] = convertMultiValueToChartData(
        {
          name: tierInfo.name,
          type: "multi_value",
          data: tierInfo.data,
          total: tierInfo.total || 0,
        },
        themeColors,
      )
    } else if (tierInfo.type === "single_value" && tierInfo.level) {
      converted[shortCode] = convertSingleValueToChartData(
        tierInfo.level,
        themeColors,
      )
    }
  })

  return converted
}

/**
 * Build outcome info list in display order.
 * Uses OUTCOME_CODE_ORDER as the canonical list, checking against API tiers for availability.
 */
const buildOutcomeNames = (
  allTiers: { short_code: string; name: string }[] | undefined,
): OutcomeInfo[] => {
  if (!allTiers) return []

  // Build lookup by short code
  const tiersByCode = new Set(allTiers.map((tier) => tier.short_code))

  // Return outcomes in display order, with placeholders for missing
  return OUTCOME_CODE_ORDER.map((code): OutcomeInfo => {
    const displayName = getOutcomeName(code)
    const exists = tiersByCode.has(code)
    return {
      shortCode: exists ? code : "MISSING",
      displayName,
    }
  })
}

/**
 * Extract score data from scenario API response.
 * Data is keyed by short code (e.g., "CWS_DEL").
 * Used for sorting, parallel plots, and equity analysis.
 */
const extractScoreData = (
  scenarioData: ScenarioTiersResponse,
): Record<string, OutcomeScoreData> => {
  const scores: Record<string, OutcomeScoreData> = {}

  Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
    // Key directly by short code from API
    scores[shortCode] = {
      shortCode,
      type: tierInfo.type,
      weighted_score: tierInfo.weighted_score ?? 0,
      normalized_score: tierInfo.normalized_score ?? 0,
      gini: tierInfo.gini ?? 0,
      band_upper: tierInfo.band_upper ?? 0,
      band_lower: tierInfo.band_lower ?? 0,
    }
  })

  return scores
}

export function useOutcomeDefinitions() {
  // Static content from outcomes.ts - no API call needed
  return {
    definitions: OUTCOME_DEFINITIONS,
    isLoading: false,
    error: null,
  }
}

export function useScenarioTiers(scenarioId: string | null) {
  const theme = useTheme()

  // Fetch scenario-specific tier data. `keepPreviousData` avoids a flash
  // of empty tiers (the "no data available" fallback in glyphs/charts) when
  // the scenarioId changes - e.g. when the user switches hydroclimate and
  // the sibling group resolves to a different variant short_code.
  const {
    data: scenarioData,
    error: scenarioError,
    isLoading: scenarioLoading,
  } = useSWR(
    scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null,
    () => (scenarioId ? fetchScenarioTiers(scenarioId) : null),
    { keepPreviousData: true },
  )

  // Use shared hooks for tier list (cached, deduplicated)
  const {
    tiers: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useTiers()

  // Convert API data to chart format with theme colors
  // Data is keyed by short code (e.g., "CWS_DEL")
  const chartData = useMemo(() => {
    if (!scenarioData) return {}
    return processScenarioData(scenarioData, getThemeColorsForApi(theme))
  }, [scenarioData, theme])

  // Extract score data for sorting and parallel plots
  // Data is keyed by short code (e.g., "CWS_DEL")
  const scoreData = useMemo(() => {
    if (!scenarioData) return {}
    return extractScoreData(scenarioData)
  }, [scenarioData])

  // Show outcomes in the specific order, some are inactive
  const outcomeNames = useMemo(() => buildOutcomeNames(allTiers), [allTiers])

  // Normalize error to string (SWR returns Error, shared hooks return string)
  const error = scenarioError
    ? scenarioError instanceof Error
      ? scenarioError.message
      : String(scenarioError)
    : tiersError || null

  return {
    chartData, // Keyed by short code (e.g., chartData["CWS_DEL"])
    scoreData, // Keyed by short code, contains weighted_score, normalized_score, gini, band_upper, band_lower
    rawData: scenarioData,
    outcomeNames,
    isLoading: scenarioLoading || tiersLoading,
    error,
  }
}

/**
 * Fetch tier data for multiple scenarios.
 *
 * @param idMapping - Optional mapping of display IDs to fetch IDs.
 *   When provided, fetches tier data for `Object.values(idMapping)` (the
 *   resolved short_codes for the active hydroclimate) and re-keys all output
 *   data structures using `Object.keys(idMapping)` (the sibling group IDs).
 *   When omitted, falls back to fetching all active scenario IDs directly.
 */
export function useMultipleScenarioTiers(idMapping?: Record<string, string>) {
  const theme = useTheme()
  const { mutate } = useSWRConfig()

  const {
    activeScenarioIds: fallbackIds,
    error: scenariosError,
    isLoading: scenariosLoading,
  } = useScenarios()

  const {
    tiers: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useTiers()

  // When a mapping is provided, fetch only the resolved IDs (typically 24).
  // Otherwise fall back to all active IDs (legacy behavior).
  const fetchIds = useMemo(
    () => (idMapping ? Object.values(idMapping) : fallbackIds),
    [idMapping, fallbackIds],
  )

  // Reverse map for re-keying: resolved short_code -> sibling group ID
  const reverseMap = useMemo(() => {
    if (!idMapping) return null
    const m = new Map<string, string>()
    Object.entries(idMapping).forEach(([groupId, resolvedId]) => {
      m.set(resolvedId, groupId)
    })
    return m
  }, [idMapping])

  const {
    data: rawScenariosData,
    error: scenarioTiersError,
    isLoading: scenarioTiersLoading,
    isValidating: scenarioTiersValidating,
  } = useSWR(
    fetchIds.length > 0 ? CACHE_KEYS.allScenarioTiers(fetchIds) : null,
    () => fetchAllScenarioTiers(fetchIds),
    { keepPreviousData: true },
  )

  // Re-key from resolved IDs to sibling group IDs when mapping is active.
  // While SWR is validating with kept stale data, the raw data keys won't
  // match the new reverseMap, producing garbage. Hold the previous good
  // result until fresh data arrives.
  const rekeyedData = useMemo(() => {
    if (!rawScenariosData) return undefined
    if (!reverseMap) return rawScenariosData
    const result: Record<string, ScenarioTiersResponse> = {}
    Object.entries(rawScenariosData).forEach(([resolvedId, data]) => {
      const groupId = reverseMap.get(resolvedId) ?? resolvedId
      result[groupId] = data
    })
    return result
  }, [rawScenariosData, reverseMap])

  const prevGoodDataRef = useRef(rekeyedData)
  if (!scenarioTiersValidating && rekeyedData !== undefined) {
    prevGoodDataRef.current = rekeyedData
  }
  const allScenariosData = scenarioTiersValidating
    ? prevGoodDataRef.current
    : rekeyedData

  // Scenario IDs to expose: sibling group IDs (mapping keys) or raw IDs
  const scenarioIds = useMemo(
    () => (idMapping ? Object.keys(idMapping) : fallbackIds),
    [idMapping, fallbackIds],
  )

  // Pre-populate per-scenario cache entries after bulk fetch
  useEffect(() => {
    if (rawScenariosData) {
      Object.entries(rawScenariosData).forEach(([scenarioId, tierData]) => {
        mutate(CACHE_KEYS.scenarioTiers(scenarioId), tierData, false)
      })
    }
  }, [rawScenariosData, mutate])

  const themeColors = useMemo(() => getThemeColorsForApi(theme), [theme])

  const allChartData = useMemo(() => {
    if (!allScenariosData) return {}
    const result: Record<string, Record<string, Array<ChartDataPoint>>> = {}
    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = processScenarioData(scenarioData, themeColors)
    })
    return result
  }, [allScenariosData, themeColors])

  const allScoreData = useMemo(() => {
    if (!allScenariosData) return {}
    const result: Record<string, Record<string, OutcomeScoreData>> = {}
    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = extractScoreData(scenarioData)
    })
    return result
  }, [allScenariosData])

  const outcomeNames = useMemo(() => buildOutcomeNames(allTiers), [allTiers])

  const isLoading = scenariosLoading || scenarioTiersLoading || tiersLoading

  const error = useMemo(() => {
    if (scenariosError) return `Failed to load scenarios: ${scenariosError}`
    if (scenarioTiersError) {
      const msg =
        scenarioTiersError instanceof Error
          ? scenarioTiersError.message
          : String(scenarioTiersError)
      return `Failed to load scenario tier data: ${msg}`
    }
    if (tiersError) return `Failed to load tier list: ${tiersError}`
    return null
  }, [scenariosError, scenarioTiersError, tiersError])

  return {
    allChartData,
    allScoreData,
    allScenariosData,
    scenarioIds,
    outcomeNames,
    isLoading,
    error,
  }
}

/**
 * Hook for getting tier data for a specific outcome by code.
 * @param scenarioId - The scenario ID
 * @param outcomeCode - The outcome short code (e.g., "CWS_DEL")
 */
export function useOutcomeTierData(
  scenarioId: string | null,
  outcomeCode: string,
) {
  const { chartData, isLoading, error } = useScenarioTiers(scenarioId)

  const tierData = useMemo(() => {
    return chartData[outcomeCode] || []
  }, [chartData, outcomeCode])

  return {
    tierData,
    isLoading,
    error,
    hasData: tierData.length > 0,
  }
}
