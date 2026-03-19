import { useMemo, useEffect } from "react"
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

  // Fetch scenario-specific tier data
  const {
    data: scenarioData,
    error: scenarioError,
    isLoading: scenarioLoading,
  } = useSWR(scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null, () =>
    scenarioId ? fetchScenarioTiers(scenarioId) : null,
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

export function useMultipleScenarioTiers() {
  const theme = useTheme()
  const { mutate } = useSWRConfig()

  // Use shared hooks for scenarios and tier list (cached, deduplicated)
  const {
    activeScenarioIds: scenarioIds,
    error: scenariosError,
    isLoading: scenariosLoading,
  } = useScenarios()

  const {
    tiers: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useTiers()

  // Fetch all scenario tier data in a single batched request
  // SWR key includes scenario IDs so it refetches when list changes
  const {
    data: allScenariosData,
    error: scenarioTiersError,
    isLoading: scenarioTiersLoading,
  } = useSWR(
    scenarioIds.length > 0 ? CACHE_KEYS.allScenarioTiers(scenarioIds) : null,
    () => fetchAllScenarioTiers(scenarioIds),
  )

  // Pre-populate per-scenario cache entries after bulk fetch
  // This allows useScenarioTiers to find cached data when navigating to detail view
  useEffect(() => {
    if (allScenariosData) {
      Object.entries(allScenariosData).forEach(([scenarioId, tierData]) => {
        mutate(CACHE_KEYS.scenarioTiers(scenarioId), tierData, false)
      })
    }
  }, [allScenariosData, mutate])

  // Memoize theme colors to prevent recalculation
  const themeColors = useMemo(() => getThemeColorsForApi(theme), [theme])

  // Convert all scenario data to chart format
  // Data is keyed by short code (e.g., allChartData[scenarioId]["CWS_DEL"])
  const allChartData = useMemo(() => {
    if (!allScenariosData) return {}

    const result: Record<string, Record<string, Array<ChartDataPoint>>> = {}

    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = processScenarioData(scenarioData, themeColors)
    })

    return result
  }, [allScenariosData, themeColors])

  // Extract score data for all scenarios (for sorting and parallel plots)
  // Data is keyed by short code (e.g., allScoreData[scenarioId]["CWS_DEL"])
  const allScoreData = useMemo(() => {
    if (!allScenariosData) return {}

    const result: Record<string, Record<string, OutcomeScoreData>> = {}

    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = extractScoreData(scenarioData)
    })

    return result
  }, [allScenariosData])

  // Get outcome names from tier list
  const outcomeNames = useMemo(() => buildOutcomeNames(allTiers), [allTiers])

  const isLoading = scenariosLoading || scenarioTiersLoading || tiersLoading

  // Combine errors (shared hooks return string errors, SWR returns Error objects)
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
    allChartData, // Keyed by short code (e.g., allChartData[scenarioId]["CWS_DEL"])
    allScoreData, // Keyed by short code (e.g., allScoreData[scenarioId]["CWS_DEL"])
    allScenariosData, // Raw API responses for Sankey / tier distribution access
    scenarioIds, // Export the dynamic list of scenario IDs
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
