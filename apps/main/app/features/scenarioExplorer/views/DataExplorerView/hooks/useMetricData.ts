import { useMemo } from "react"
import { useScenarioTiers } from "../../../../../hooks/useTierData"
import type { OutcomeMetric } from "../outcomeDefinitions"

/**
 * Hook to fetch metric data for multiple scenarios
 * Uses the tier API infrastructure
 */
export function useMetricData(scenarioIds: string[], metric: OutcomeMetric) {
  const tierMetricData = useTierMetricData(scenarioIds, metric)

  // For tier metrics, use the tier API result
  if (metric.isTier) {
    return tierMetricData
  }

  // For now, for non-tier metrics, return placeholder data
  // TODO: Implement when detailed metrics API is available
  return {
    data: null,
    isLoading: false,
    error: "Detailed metric data not yet available",
  }
}

/**
 * Hook to fetch tier metric data for multiple scenarios
 *
 * Developer's note: To comply with Rules of Hooks, always call the same hooks
 * in the same order, regardless of how many scenarios are selected.
 * We fetch data for all 3 possible scenarios and then filter based on selection.
 */
function useTierMetricData(scenarioIds: string[], metric: OutcomeMetric) {
  // Always fetch data for all possible scenarios (fixed number of hooks)
  const s0020 = useScenarioTiers("s0020")
  const s0021 = useScenarioTiers("s0021")
  const s0011 = useScenarioTiers("s0011")

  // Combine all scenario results
  const allScenarios = {
    s0020,
    s0021,
    s0011,
  }

  // Check loading and error states
  const isLoading = Object.values(allScenarios).some((r) => r.isLoading)
  const errorResult = Object.values(allScenarios).find((r) => r.error)
  const error = errorResult?.error

  // Transform tier data into comparison format
  const comparisonData = useMemo(() => {
    // Return null if still loading or error
    if (isLoading || error) return null

    // Return null if no scenarios selected
    if (scenarioIds.length === 0) return null

    // Map the metric name to the outcome name used in chartData
    const outcomeKey = mapMetricToOutcome(metric.id)

    // Filter to only selected scenarios and transform data
    return scenarioIds
      .map((scenarioId) => {
        const result = allScenarios[scenarioId as keyof typeof allScenarios]
        if (!result) return null

        const tierData = result.chartData[outcomeKey] || []

        return {
          scenarioId,
          scenarioName: getScenarioDisplayName(scenarioId),
          tierData,
          // Calculate summary statistics
          totalCount: tierData.reduce((sum, t) => sum + t.value, 0),
          tierDistribution: tierData.map((t) => ({
            tier: t.label,
            value: t.value,
            percentage: 0, // Will be calculated after we have total
          })),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scenarioIds,
    s0020.chartData,
    s0021.chartData,
    s0011.chartData,
    isLoading,
    error,
    metric.id,
  ])

  return {
    data: comparisonData,
    isLoading,
    error: error ? String(error) : null,
  }
}

/**
 * Map Data Explorer metric IDs to tier outcome names
 */
function mapMetricToOutcome(metricId: string): string {
  const mapping: Record<string, string> = {
    "cws-delivery-tier": "Community deliveries",
    "ag-revenue-tier": "Agricultural revenue",
    "env-flow-tier": "Environmental flows",
    "env-delta-ecology-tier": "Delta estuary ecology",
    "salinity-in-delta-tier": "Freshwater for in-Delta uses",
    "salinity-exports-tier": "Freshwater for Delta exports",
    "reservoir-storage-tier": "Reservoir storage",
    "gw-storage-tier": "Groundwater storage",
    "salmon-tier": "Salmon abundance",
  }

  return mapping[metricId] || metricId
}

/**
 * Get display name for scenario
 */
function getScenarioDisplayName(scenarioId: string): string {
  const names: Record<string, string> = {
    s0020: "Current operations",
    s0021: "Current ops without TUCPs",
    s0011: "Current ops with historical ag",
  }

  return names[scenarioId] || scenarioId
}

/**
 * Hook to fetch tier location data for map visualization
 */
export function useMetricMapData(
  scenarioId: string | null,
  metric: OutcomeMetric,
) {
  // Only fetch for metrics that can be shown on map
  const shouldFetch = scenarioId && metric.showOnMap && metric.isTier

  // Uses the existing tier location API
  // The actual implementation is in useTierMapData
  return {
    shouldFetch,
    scenarioId,
    metricId: metric.id,
    outcomeDisplayName: mapMetricToOutcome(metric.id),
  }
}
