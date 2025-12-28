import { useMemo } from "react"
import { useMultipleScenarioTiers, useScenarioList } from "../../../scenarios/hooks"
import type { OutcomeMetric } from "../../config/outcomeDefinitions"
import { getDisplayNameFromMetricId } from "../../../../lib/constants/outcomeMappings"

/**
 * Hook to fetch metric data for multiple scenarios
 * Uses the tier API infrastructure and dynamic scenario list
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
 * Uses useMultipleScenarioTiers which fetches all scenario tier data in parallel,
 * then filters to the selected scenarios. This approach respects React hooks rules
 * by always calling the same hooks in the same order.
 */
function useTierMetricData(scenarioIds: string[], metric: OutcomeMetric) {
  // Fetch all scenario tier data (handles hooks rules internally)
  const { allChartData, isLoading: tiersLoading, error: tiersError } = useMultipleScenarioTiers()

  // Get scenario metadata for display names
  const { getDisplayName, isLoading: scenariosLoading } = useScenarioList()

  const isLoading = tiersLoading || scenariosLoading
  const error = tiersError

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
        const scenarioChartData = allChartData[scenarioId]
        if (!scenarioChartData) return null

        const tierData = scenarioChartData[outcomeKey] || []

        return {
          scenarioId,
          scenarioName: getDisplayName(scenarioId),
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
  }, [scenarioIds, allChartData, isLoading, error, metric.id, getDisplayName])

  return {
    data: comparisonData,
    isLoading,
    error: error ? String(error) : null,
  }
}

/**
 * Map Data Explorer metric IDs to tier outcome names
 * Applies UI display name overrides to match chartData keys
 */
function mapMetricToOutcome(metricId: string): string {
  return getDisplayNameFromMetricId(metricId)
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
  // Note: Uses UI display name which will be converted to API name in tierLocationApi
  return {
    shouldFetch,
    scenarioId,
    metricId: metric.id,
    outcomeDisplayName: mapMetricToOutcome(metric.id),
  }
}
