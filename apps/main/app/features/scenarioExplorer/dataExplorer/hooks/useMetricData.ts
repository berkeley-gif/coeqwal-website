import { useMemo } from "react"
import {
  useMultipleScenarioTiers,
  useScenarioList,
} from "../../../scenarios/hooks"
import { useScenarioExplorerStore } from "../../store"
import type { OutcomeMetric } from "../../config/outcomeDefinitions"
import {
  getOutcomeCodeFromMetricId,
  getOutcomeNameFromMetricId,
} from "../../../../content/outcomes"

/**
 * Hook to fetch metric data for multiple scenarios
 * Uses the tier API infrastructure and dynamic scenario list
 */
export function useMetricData(scenarioIds: string[], metric: OutcomeMetric) {
  const tierMetricData = useTierMetricData(scenarioIds, metric)

  if (metric.isTier) {
    return tierMetricData
  }

  return {
    data: null,
    isLoading: false,
    error: "Detailed metric data not yet available",
  }
}

/**
 * Hook to fetch tier metric data for multiple scenarios.
 * Uses hydroclimate-aware ID mapping so only 24 scenarios are fetched.
 */
function useTierMetricData(scenarioIds: string[], metric: OutcomeMetric) {
  const { hydroclimatePeriod } = useScenarioExplorerStore()
  const {
    buildIdMapping,
    getDisplayName,
    isLoading: scenariosLoading,
  } = useScenarioList()

  const idMapping = useMemo(
    () => buildIdMapping(hydroclimatePeriod),
    [buildIdMapping, hydroclimatePeriod],
  )

  const {
    allChartData,
    isLoading: tiersLoading,
    error: tiersError,
  } = useMultipleScenarioTiers(idMapping)

  const isLoading = tiersLoading || scenariosLoading
  const error = tiersError

  // Transform tier data into comparison format
  const comparisonData = useMemo(() => {
    // Return null if still loading or error
    if (isLoading || error) return null

    // Return null if no scenarios selected
    if (scenarioIds.length === 0) return null

    // Map the metric ID to the outcome code used in chartData
    const outcomeKey = mapMetricToOutcomeCode(metric.id)

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
 * Map Data Explorer metric IDs to tier outcome codes
 * Returns the outcome code to match chartData keys (e.g., "CWS_DEL")
 */
function mapMetricToOutcomeCode(metricId: string): string {
  return getOutcomeCodeFromMetricId(metricId)
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

  // Returns metadata for map visualization
  return {
    shouldFetch,
    scenarioId,
    metricId: metric.id,
    outcomeCode: mapMetricToOutcomeCode(metric.id),
    outcomeDisplayName: getOutcomeNameFromMetricId(metric.id),
  }
}
