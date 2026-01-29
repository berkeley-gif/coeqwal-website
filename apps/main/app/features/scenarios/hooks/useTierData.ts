import { useMemo, useEffect } from "react"
import { useTheme } from "@repo/ui/mui"
import useSWR, { useSWRConfig } from "swr"
import {
  useTiers,
  useTierMapping,
  useScenarios,
  mapShortCodeToDisplayName,
} from "@repo/data/coeqwal/hooks"
import { fetchAllScenarioTiers } from "@repo/data/coeqwal"
import { CACHE_KEYS } from "@repo/data/cache"
import type { ScenarioTiersResponse, TierScores } from "@repo/data/coeqwal"
import {
  fetchScenarioTiers,
  convertMultiValueToChartData,
  convertSingleValueToChartData,
} from "../../../lib/api/tierApi"
import { applyUIDisplayOverride } from "../../../lib/constants/outcomeMappings"
import { getThemeColorsForApi, type TierColors } from "../../../content/tiers"
import type { ChartDataPoint } from "../components/shared/types"

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

// Constants - UI display names
export const OUTCOME_DISPLAY_ORDER = [
  "Community deliveries",
  "Agricultural revenue",
  "Environmental flows",
  "Reservoir storage",
  "Groundwater storage",
  "Delta estuary ecology", // UI display name
  "Freshwater for Delta exports",
  "Freshwater for in-Delta uses",
  "Salmon abundance",
] as const

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
  // TODO: Re-enable database fetch when ready
  /*
  const {
    data: definitions,
    error: definitionsError,
    isLoading: definitionsLoading,
  } = useSWR("/api/tiers/definitions", fetchTierDefinitions)

  const {
    data: tierMapping,
    error: mappingError,
    isLoading: mappingLoading,
  } = useSWR("/api/tiers/mapping", getTierMapping)

  const convertedDefinitions = useMemo(() => {
    if (!definitions || !tierMapping) return {}

    const converted: Record<string, string> = {}
    Object.entries(definitions).forEach(([shortCode, description]) => {
      const displayName = mapShortCodeToDisplayName(shortCode, tierMapping)
      converted[displayName] = description
    })

    return converted
  }, [definitions, tierMapping])
  */

  // Using hardcoded definitions from outcomes.ts
  const hardcodedDefinitions = {
    "Community deliveries":
      "Extent to which water deliveries to cities, towns, and communities are sufficient to satisfy needs for drinking water, sanitation, and municipal uses. Water deliveries are evaluated for **140 community water systems**.",
    "Agricultural revenue":
      "How average agricultural revenue changes in response to water deliveries. Revenues are estimated at **134 agricultural water districts** and evaluated relative to historical values.",
    "Environmental flows":
      "Extent to which river flows are of sufficient magnitude across seasons and year-to-year to support healthy riverine ecosystems, evaluated at **17 locations** on the Sacramento and San Joaquin Rivers and their major tributaries.",
    // UI display name
    "Delta estuary ecology":
      "Extent to which seasonal outflows from the Sacramento-San Joaquin River Delta through the estuary support beneficial ecological responses. More high-flow years in a row generally support more suitable habitat for native species in the Delta.",
    "Freshwater for Delta exports":
      "How often salinity meets or exceeds water quality requirements for exporting water for drinking water or irrigation needs, assessed at the **Banks and Jones pumping plants**.",
    "Freshwater for in-Delta uses":
      "How often water in the Delta is fresh enough for in-Delta uses, assessed at **two compliance locations** in the western Delta.",
    "Reservoir storage":
      "How full reservoirs are on April 30, which is an important benchmark for the amount of water available for delivery in the dry season (April – October). Reservoir storage outcomes are assessed in **8 large reservoirs**.",
    "Groundwater storage":
      "Trends in groundwater storage, relative to 1960 – 2021 historical conditions. Groundwater storage outcomes are assessed in XX groundwater basins in the Central Valley.",
    "Salmon abundance":
      "Change in population trend for endangered Sacramento River winter-run Chinook salmon.",
  }

  return {
    definitions: hardcodedDefinitions,
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
  } = useSWR(
    scenarioId ? `/api/tiers/scenarios/${scenarioId}/tiers` : null,
    () => (scenarioId ? fetchScenarioTiers(scenarioId) : null),
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
  const outcomeNames = useMemo(() => {
    if (!allTiers || !tierMapping) return []

    const desiredOrder = OUTCOME_DISPLAY_ORDER

    // Quick lookup - apply UI display name overrides so lookup matches OUTCOME_DISPLAY_ORDER
    const tiersByDisplayName = new Map()
    allTiers.forEach((tier) => {
      const apiDisplayName = mapShortCodeToDisplayName(
        tier.short_code,
        tierMapping,
      )
      const uiDisplayName = applyUIDisplayOverride(apiDisplayName)
      tiersByDisplayName.set(uiDisplayName, tier)
    })

    // Return outcomes in order, including missing ones (as inactive)
    return desiredOrder.map((displayName) => {
      const tier = tiersByDisplayName.get(displayName)
      if (!tier) {
        // Return placeholder for missing API tiers
        return {
          shortCode: "MISSING",
          name: displayName, // Use display name as fallback
          displayName,
        }
      }

      return {
        shortCode: tier.short_code,
        name: tier.name,
        displayName,
      }
    }) // Don't filter ...show all outcomes
  }, [allTiers, tierMapping])

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
    scenarioIds.length > 0 ? ["all-scenario-tiers", ...scenarioIds] : null,
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
  const outcomeNames = useMemo(() => {
    if (!allTiers || !tierMapping) return []

    const desiredOrder = OUTCOME_DISPLAY_ORDER

    // Apply UI display name overrides so lookup matches OUTCOME_DISPLAY_ORDER
    const tiersByDisplayName = new Map()
    allTiers.forEach((tier) => {
      const apiDisplayName = mapShortCodeToDisplayName(
        tier.short_code,
        tierMapping,
      )
      const uiDisplayName = applyUIDisplayOverride(apiDisplayName)
      tiersByDisplayName.set(uiDisplayName, tier)
    })

    return desiredOrder.map((displayName): OutcomeInfo => {
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
  }, [allTiers, tierMapping])

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
