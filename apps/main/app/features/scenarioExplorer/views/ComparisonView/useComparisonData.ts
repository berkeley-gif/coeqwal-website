import { useMemo } from "react"
import {
  useMultipleScenarioTiers,
  OUTCOME_DISPLAY_ORDER,
} from "../../../../hooks/useTierData"
import type { VerticalParallelLineData } from "@repo/viz"

const SCENARIO_IDS = ["s0020", "s0021", "s0011"] as const
const SCENARIO_NAMES = {
  s0020: "Current operations",
  s0021: "Current ops without TUCPs",
  s0011: "Current ops with historical ag",
} as const

/**
 * Convert tier data to normalized value between -1 and 1
 * For single-value tiers: tier1=1, tier2=0.33, tier3=-0.33, tier4=-1
 * For multi-value tiers: weighted average based on distribution
 */
function normalizeTierValue(
  chartData: Array<{ label: string; value: number; tierType?: string }>,
): number {
  if (!chartData || chartData.length === 0) return 0

  // Check if this is a single-value tier (only one data point with 100%)
  const isSingleValue =
    chartData.length === 1 ||
    (chartData.length === 4 &&
      chartData.filter((d) => d.value === 0).length === 3)

  if (isSingleValue) {
    // Single-value tier - map tier level to normalized value
    const activeTier = chartData.find((d) => d.value > 0)
    const tierLabel = activeTier?.label || "Tier 4"
    // Normalize label format (handle both "Tier 1" and "Tier1")
    const normalizedLabel = tierLabel.replace(/Tier\s*(\d)/, "Tier $1")
    const tierMapping: Record<string, number> = {
      "Tier 1": 1.0,
      "Tier 2": 0.33,
      "Tier 3": -0.33,
      "Tier 4": -1.0,
    }
    return tierMapping[normalizedLabel] ?? 0
  } else {
    // Multi-value tier - calculate weighted average
    // tier1: best (1), tier2: good (0.33), tier3: poor (-0.33), tier4: worst (-1)
    const weights: Record<string, number> = {
      "Tier 1": 1.0,
      "Tier 2": 0.33,
      "Tier 3": -0.33,
      "Tier 4": -1.0,
    }

    let weightedSum = 0
    let totalValue = 0

    chartData.forEach((d) => {
      // Normalize label format (handle both "Tier 1" and "Tier1")
      const normalizedLabel = d.label.replace(/Tier\s*(\d)/, "Tier $1")
      const weight = weights[normalizedLabel] ?? 0
      // Values might be percentages (0-100) or decimals (0-1)
      const normalizedValue = d.value > 1 ? d.value / 100 : d.value
      weightedSum += weight * normalizedValue
      totalValue += normalizedValue
    })

    // Normalize to -1 to 1 range
    return totalValue > 0 ? weightedSum / totalValue : 0
  }
}

/**
 * Hook to transform tier data for VerticalParallelLinePlot
 */
export function useComparisonData() {
  const { allChartData, isLoading, error } = useMultipleScenarioTiers()

  const parallelPlotData: VerticalParallelLineData[] = useMemo(() => {
    if (!allChartData || Object.keys(allChartData).length === 0) {
      return []
    }

    return SCENARIO_IDS.map((scenarioId) => {
      const scenarioData = allChartData[scenarioId] || {}

      // Transform each outcome to normalized value
      const values: Record<string, number> = {}
      OUTCOME_DISPLAY_ORDER.forEach((outcome) => {
        const chartData = scenarioData[outcome]
        if (chartData) {
          values[outcome] = normalizeTierValue(chartData)
        } else {
          values[outcome] = 0 // Default if no data
        }
      })

      return {
        id: scenarioId,
        name: SCENARIO_NAMES[scenarioId],
        values,
        highlighted: false, // No highlighting since we removed baseline
      }
    })
  }, [allChartData])

  const axes = useMemo(() => {
    return [...OUTCOME_DISPLAY_ORDER] // Use outcome names as axes
  }, [])

  return {
    data: parallelPlotData,
    axes,
    isLoading,
    error,
    hasData: parallelPlotData.length > 0,
  }
}
