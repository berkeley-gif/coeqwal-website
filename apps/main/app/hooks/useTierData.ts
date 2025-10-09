/**
 * Custom hook for fetching and formatting tier data with theme colors
 */

import { useMemo } from 'react'
import { useTheme } from '@repo/ui/mui'
import useSWR from 'swr'
import { 
  fetchScenarioTiers, 
  fetchTierDefinitions,
  fetchTierList,
  getTierMapping,
  convertMultiValueToChartData,
  convertSingleValueToChartData,
  mapShortCodeToDisplayName,
} from '../lib/tierApi'

// Hook for fetching outcome definitions with display names
export function useOutcomeDefinitions() {
  const { data: definitions, error: definitionsError, isLoading: definitionsLoading } = useSWR(
    '/api/tiers/definitions',
    fetchTierDefinitions
  )

  const { data: tierMapping, error: mappingError, isLoading: mappingLoading } = useSWR(
    '/api/tiers/mapping',
    getTierMapping
  )

  const convertedDefinitions = useMemo(() => {
    if (!definitions || !tierMapping) return {}
    
    const converted: Record<string, string> = {}
    Object.entries(definitions).forEach(([shortCode, description]) => {
      const displayName = mapShortCodeToDisplayName(shortCode, tierMapping)
      converted[displayName] = description
    })
    
    return converted
  }, [definitions, tierMapping])

  return {
    definitions: convertedDefinitions,
    isLoading: definitionsLoading || mappingLoading,
    error: definitionsError || mappingError
  }
}

// Hook for fetching scenario tier data with theme colors
export function useScenarioTiers(scenarioId: string | null) {
  const theme = useTheme()
  
  const { data: scenarioData, error: scenarioError, isLoading: scenarioLoading } = useSWR(
    scenarioId ? `/api/tiers/scenarios/${scenarioId}/tiers` : null,
    () => scenarioId ? fetchScenarioTiers(scenarioId) : null
  )

  const { data: allTiers, error: tiersError, isLoading: tiersLoading } = useSWR(
    '/api/tiers/list',
    fetchTierList
  )

  const { data: tierMapping, error: mappingError, isLoading: mappingLoading } = useSWR(
    '/api/tiers/mapping',
    getTierMapping
  )

  // Convert API data to chart format with theme colors
  const chartData = useMemo(() => {
    if (!scenarioData || !tierMapping) return {}

    const themeColors = {
      tier1: theme.palette.tiers.tier1,
      tier2: theme.palette.tiers.tier2,
      tier3: theme.palette.tiers.tier3,
      tier4: theme.palette.tiers.tier4,
    }

    const converted: Record<string, Array<{
      label: string
      color: string
      value: number
    }>> = {}

    Object.entries(scenarioData.tiers).forEach(([shortCode, tierInfo]) => {
      const displayName = mapShortCodeToDisplayName(shortCode, tierMapping)
      
      if (tierInfo.type === "multi_value" && tierInfo.data) {
        converted[displayName] = convertMultiValueToChartData(
          { name: tierInfo.name, type: "multi_value", data: tierInfo.data, total: tierInfo.total || 0 },
          themeColors
        )
      } else if (tierInfo.type === "single_value" && tierInfo.level) {
        converted[displayName] = convertSingleValueToChartData(
          tierInfo.level,
          themeColors
        )
      }
    })

    return converted
  }, [scenarioData, tierMapping, theme.palette.tiers])

  // Show outcomes in the specific order, some are inactive
  const outcomeNames = useMemo(() => {
    if (!allTiers || !tierMapping) return []
    
    // Define the order using API names (TODO: make dynamic)
    const desiredOrder = [
      "Community deliveries",
      "Agricultural revenue", 
      "Environmental flows",
      "Delta ecology",
      "Freshwater for Delta exports",
      "Freshwater for in-Delta uses",
      "Reservoir storage",
      "Groundwater storage",
      "Salmon abundance",
    ]
    
    // Create a map for quick lookup
    const tiersByDisplayName = new Map()
    allTiers.forEach((tier) => {
      const displayName = mapShortCodeToDisplayName(tier.short_code, tierMapping)
      tiersByDisplayName.set(displayName, tier)
    })
    
    // Return outcomes in order, including missing ones as inactive
    return desiredOrder.map((displayName) => {
      const tier = tiersByDisplayName.get(displayName)
      if (!tier) {
        console.warn(`Tier not found in API for display name: ${displayName} - showing as inactive`)
        // Return inactive placeholder for missing API tiers
        return {
          shortCode: 'MISSING',
          name: displayName, // Use display name as fallback
          displayName,
          isActive: false // Always inactive if not in API
        }
      }
      
      return {
        shortCode: tier.short_code,
        name: tier.name,
        displayName,
        isActive: scenarioData?.tiers[tier.short_code] !== undefined
      }
    }) // Don't filter ...show all outcomes
  }, [allTiers, tierMapping, scenarioData])

  return {
    chartData,
    rawData: scenarioData,
    outcomeNames,
    isLoading: scenarioLoading || tiersLoading || mappingLoading,
    error: scenarioError || tiersError || mappingError
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
    hasData: tierData.length > 0
  }
}
