import { useMemo, useEffect } from "react"
import { useTheme } from "@repo/ui/mui"
import useSWR, { useSWRConfig } from "swr"
import {
  useTiers,
  useTierMapping,
  useScenarios,
  mapShortCodeToDisplayName,
} from "@repo/data/coeqwal/hooks"
import { fetchAllScenarioTiers, fetchScenarioTiers } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import type { ScenarioTiersResponse, TierScores } from "@repo/data/coeqwal"
import {
  convertMultiValueToChartData,
  convertSingleValueToChartData,
} from "../../../lib/api/tierApi"
import { applyUIDisplayOverride } from "../../../lib/constants/outcomeMappings"
import { getThemeColorsForApi, type TierColors } from "../../../content/tiers"
import {
  OUTCOME_DISPLAY_ORDER,
  OUTCOME_DEFINITIONS,
} from "../../../content/outcomes"
import type { ChartDataPoint } from "../components/shared/types"

// Re-export for backwards compatibility
export { OUTCOME_DISPLAY_ORDER }

interface OutcomeInfo {
  shortCode: string
  name: string
  displayName: string
}

/**
 * Score data for an outcome, used for sorting and visualization
 */
export interface OutcomeScoreData extends TierScores {
  displayName: string
  shortCode: string
  type: "single_value" | "multi_value"
}

const processScenarioData = (
  scenarioData: ScenarioTiersResponse,
  tierMapping: Record<string, string>,
  themeColors: TierColors,
): Record<string, Array<ChartDataPoint>> => {
  const converted: Record<string, Array<ChartDataPoint>> = {}

  Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
    // Get API display name first, then apply UI override when necessary TODO: fix this
    const apiDisplayName = mapShortCodeToDisplayName(shortCode, tierMapping)
    const uiDisplayName = applyUIDisplayOverride(apiDisplayName)

    if (tierInfo.type === "multi_value" && tierInfo.data) {
      converted[uiDisplayName] = convertMultiValueToChartData(
        {
          name: tierInfo.name,
          type: "multi_value",
          data: tierInfo.data,
          total: tierInfo.total || 0,
        },
        themeColors,
      )
    } else if (tierInfo.type === "single_value" && tierInfo.level) {
      converted[uiDisplayName] = convertSingleValueToChartData(
        tierInfo.level,
        themeColors,
      )
    }
  })

  return converted
}

/**
 * Build outcome names list from tier data in display order
 * Returns OutcomeInfo for each outcome, with placeholder for missing API tiers
 */
const buildOutcomeNames = (
  allTiers: { short_code: string; name: string }[] | undefined,
  tierMapping: Record<string, string> | undefined,
): OutcomeInfo[] => {
  if (!allTiers || !tierMapping) return []

  // Build lookup by UI display name
  const tiersByDisplayName = new Map<
    string,
    { short_code: string; name: string }
  >()
  allTiers.forEach((tier) => {
    const apiDisplayName = mapShortCodeToDisplayName(
      tier.short_code,
      tierMapping,
    )
    const uiDisplayName = applyUIDisplayOverride(apiDisplayName)
    tiersByDisplayName.set(uiDisplayName, tier)
  })

  // Return outcomes in display order, with placeholders for missing
  return OUTCOME_DISPLAY_ORDER.map((displayName): OutcomeInfo => {
    const tier = tiersByDisplayName.get(displayName)
    if (!tier) {
      return {
        shortCode: "MISSING",
        name: displayName,
        displayName,
      }
    }
    return {
      shortCode: tier.short_code,
      name: tier.name,
      displayName,
    }
  })
}

/**
 * Extract score data from scenario API response
 * Used for sorting, parallel plots, and equity analysis
 */
const extractScoreData = (
  scenarioData: ScenarioTiersResponse,
  tierMapping: Record<string, string>,
): Record<string, OutcomeScoreData> => {
  const scores: Record<string, OutcomeScoreData> = {}

  Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
    const apiDisplayName = mapShortCodeToDisplayName(shortCode, tierMapping)
    const uiDisplayName = applyUIDisplayOverride(apiDisplayName)

    scores[uiDisplayName] = {
      displayName: uiDisplayName,
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

  // Use shared hooks for tier list and mapping (cached, deduplicated)
  const {
    tiers: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useTiers()

  const {
    tierMapping,
    error: mappingError,
    isLoading: mappingLoading,
  } = useTierMapping()

  // Convert API data to chart format with theme colors
  const chartData = useMemo(() => {
    if (!scenarioData || !tierMapping) return {}
    return processScenarioData(
      scenarioData,
      tierMapping,
      getThemeColorsForApi(theme),
    )
  }, [scenarioData, tierMapping, theme])

  // Extract score data for sorting and parallel plots
  const scoreData = useMemo(() => {
    if (!scenarioData || !tierMapping) return {}
    return extractScoreData(scenarioData, tierMapping)
  }, [scenarioData, tierMapping])

  // Show outcomes in the specific order, some are inactive
  const outcomeNames = useMemo(
    () => buildOutcomeNames(allTiers, tierMapping),
    [allTiers, tierMapping],
  )

  // Normalize error to string (SWR returns Error, shared hooks return string)
  const error = scenarioError
    ? scenarioError instanceof Error
      ? scenarioError.message
      : String(scenarioError)
    : tiersError || mappingError || null

  return {
    chartData,
    scoreData, // New: contains weighted_score, normalized_score, gini, band_upper, band_lower
    rawData: scenarioData,
    outcomeNames,
    isLoading: scenarioLoading || tiersLoading || mappingLoading,
    error,
  }
}

export function useMultipleScenarioTiers() {
  const theme = useTheme()
  const { mutate } = useSWRConfig()

  // Use shared hooks for scenarios, tier list, and mapping (cached, deduplicated)
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

  const {
    tierMapping,
    error: mappingError,
    isLoading: mappingLoading,
  } = useTierMapping()

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
  const allChartData = useMemo(() => {
    if (!allScenariosData || !tierMapping) return {}

    const result: Record<string, Record<string, Array<ChartDataPoint>>> = {}

    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = processScenarioData(
        scenarioData,
        tierMapping,
        themeColors,
      )
    })

    return result
  }, [allScenariosData, tierMapping, themeColors])

  // Extract score data for all scenarios (for sorting and parallel plots)
  const allScoreData = useMemo(() => {
    if (!allScenariosData || !tierMapping) return {}

    const result: Record<string, Record<string, OutcomeScoreData>> = {}

    Object.entries(allScenariosData).forEach(([scenarioId, scenarioData]) => {
      result[scenarioId] = extractScoreData(scenarioData, tierMapping)
    })

    return result
  }, [allScenariosData, tierMapping])

  // Get outcome names from tier list
  const outcomeNames = useMemo(
    () => buildOutcomeNames(allTiers, tierMapping),
    [allTiers, tierMapping],
  )

  const isLoading =
    scenariosLoading || scenarioTiersLoading || tiersLoading || mappingLoading

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
    if (mappingError) return `Failed to load tier mapping: ${mappingError}`
    return null
  }, [scenariosError, scenarioTiersError, tiersError, mappingError])

  return {
    allChartData,
    allScoreData,
    scenarioIds, // Export the dynamic list of scenario IDs
    outcomeNames,
    isLoading,
    error,
  }
}

// Hook for getting tier data for a specific outcome
export function useOutcomeTierData(scenarioId: string | null, outcome: string) {
  const { chartData, isLoading, error } = useScenarioTiers(scenarioId)

  const tierData = useMemo(() => {
    return chartData[outcome] || []
  }, [chartData, outcome])

  return {
    tierData,
    isLoading,
    error,
    hasData: tierData.length > 0,
  }
}
