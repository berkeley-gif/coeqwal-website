import { useMemo } from "react"
import { useTheme, Theme } from "@repo/ui/mui"
import useSWR from "swr"
import {
  fetchScenarioTiers,
  fetchTierDefinitions,
  fetchTierList,
  getTierMapping,
  convertMultiValueToChartData,
  convertSingleValueToChartData,
  mapShortCodeToDisplayName,
  type ScenarioTiersResponse,
} from "../api/tierApi"

// Types
interface TierColors {
  tier1: string
  tier2: string
  tier3: string
  tier4: string
}

interface ChartDataPoint {
  label: string
  color: string
  value: number
}

interface OutcomeInfo {
  shortCode: string
  name: string
  displayName: string
}

// Constants
const OUTCOME_DISPLAY_ORDER = [
  "Community deliveries",
  "Agricultural revenue",
  "Environmental flows",
  "Delta ecology",
  "Freshwater for Delta exports",
  "Freshwater for in-Delta uses",
  "Reservoir storage",
  "Groundwater storage",
  "Salmon abundance",
] as const

// Helpers
const getThemeColors = (theme: Theme): TierColors => ({
  tier1: theme.palette.tiers.tier1,
  tier2: theme.palette.tiers.tier2,
  tier3: theme.palette.tiers.tier3,
  tier4: theme.palette.tiers.tier4,
})

const processScenarioData = (
  scenarioData: ScenarioTiersResponse,
  tierMapping: Record<string, string>,
  themeColors: TierColors,
): Record<string, Array<ChartDataPoint>> => {
  const converted: Record<string, Array<ChartDataPoint>> = {}

  Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
    const displayName = mapShortCodeToDisplayName(shortCode, tierMapping)

    if (tierInfo.type === "multi_value" && tierInfo.data) {
      converted[displayName] = convertMultiValueToChartData(
        {
          name: tierInfo.name,
          type: "multi_value",
          data: tierInfo.data,
          total: tierInfo.total || 0,
        },
        themeColors,
      )
    } else if (tierInfo.type === "single_value" && tierInfo.level) {
      converted[displayName] = convertSingleValueToChartData(
        tierInfo.level,
        themeColors,
      )
    }
  })

  return converted
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
    "Delta ecology":
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

  const {
    data: scenarioData,
    error: scenarioError,
    isLoading: scenarioLoading,
  } = useSWR(
    scenarioId ? `/api/tiers/scenarios/${scenarioId}/tiers` : null,
    () => (scenarioId ? fetchScenarioTiers(scenarioId) : null),
  )

  const {
    data: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useSWR("/api/tiers/list", fetchTierList)

  const {
    data: tierMapping,
    error: mappingError,
    isLoading: mappingLoading,
  } = useSWR("/api/tiers/mapping", getTierMapping)

  // Convert API data to chart format with theme colors
  const chartData = useMemo(() => {
    if (!scenarioData || !tierMapping) return {}
    return processScenarioData(scenarioData, tierMapping, getThemeColors(theme))
  }, [scenarioData, tierMapping, theme])

  // Show outcomes in the specific order, some are inactive
  const outcomeNames = useMemo(() => {
    if (!allTiers || !tierMapping) return []

    const desiredOrder = OUTCOME_DISPLAY_ORDER

    // Quick lookup
    const tiersByDisplayName = new Map()
    allTiers.forEach((tier) => {
      const displayName = mapShortCodeToDisplayName(
        tier.short_code,
        tierMapping,
      )
      tiersByDisplayName.set(displayName, tier)
    })

    // Return outcomes in order, including missing ones (as inactive)
    return desiredOrder.map((displayName) => {
      const tier = tiersByDisplayName.get(displayName)
      if (!tier) {
        console.warn(`Tier not found in API for display name: ${displayName}`)
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

  return {
    chartData,
    rawData: scenarioData,
    outcomeNames,
    isLoading: scenarioLoading || tiersLoading || mappingLoading,
    error: scenarioError || tiersError || mappingError,
  }
}

export function useMultipleScenarioTiers() {
  const theme = useTheme()

  // Fetch all scenarios in parallel with consistent keys
  const s0020Result = useSWR(`/api/tiers/scenarios/s0020/tiers`, () =>
    fetchScenarioTiers("s0020"),
  )
  const s0021Result = useSWR(`/api/tiers/scenarios/s0021/tiers`, () =>
    fetchScenarioTiers("s0021"),
  )
  const s0011Result = useSWR(`/api/tiers/scenarios/s0011/tiers`, () =>
    fetchScenarioTiers("s0011"),
  )

  const {
    data: allTiers,
    error: tiersError,
    isLoading: tiersLoading,
  } = useSWR("/api/tiers/list", fetchTierList)

  const {
    data: tierMapping,
    error: mappingError,
    isLoading: mappingLoading,
  } = useSWR("/api/tiers/mapping", getTierMapping)

  // Memoize theme colors to prevent recalculation
  const themeColors = useMemo(() => getThemeColors(theme), [theme])

  // Convert all scenario data to chart format
  const allChartData = useMemo(() => {
    if (!tierMapping) return {}

    const result: Record<string, Record<string, Array<ChartDataPoint>>> = {}

    // Process each scenario using helper function
    if (s0020Result.data)
      result["s0020"] = processScenarioData(
        s0020Result.data,
        tierMapping,
        themeColors,
      )
    if (s0021Result.data)
      result["s0021"] = processScenarioData(
        s0021Result.data,
        tierMapping,
        themeColors,
      )
    if (s0011Result.data)
      result["s0011"] = processScenarioData(
        s0011Result.data,
        tierMapping,
        themeColors,
      )

    return result
  }, [
    s0020Result.data,
    s0021Result.data,
    s0011Result.data,
    tierMapping,
    themeColors,
  ])

  // Get outcome names from first scenario (structure should be same)
  const outcomeNames = useMemo(() => {
    if (!allTiers || !tierMapping) return []

    const desiredOrder = OUTCOME_DISPLAY_ORDER

    const tiersByDisplayName = new Map()
    allTiers.forEach((tier) => {
      const displayName = mapShortCodeToDisplayName(
        tier.short_code,
        tierMapping,
      )
      tiersByDisplayName.set(displayName, tier)
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
    s0020Result.isLoading ||
    s0021Result.isLoading ||
    s0011Result.isLoading ||
    tiersLoading ||
    mappingLoading

  // Provide specific error messages
  const error = useMemo(() => {
    if (s0020Result.error)
      return `Failed to load s0020 data: ${s0020Result.error.message}`
    if (s0021Result.error)
      return `Failed to load s0021 data: ${s0021Result.error.message}`
    if (s0011Result.error)
      return `Failed to load s0011 data: ${s0011Result.error.message}`
    if (tiersError) return `Failed to load tier list: ${tiersError.message}`
    if (mappingError)
      return `Failed to load tier mapping: ${mappingError.message}`
    return null
  }, [
    s0020Result.error,
    s0021Result.error,
    s0011Result.error,
    tiersError,
    mappingError,
  ])

  return {
    allChartData,
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
