import { useMemo } from "react"
import { useMultipleScenarioTiers } from "../../../hooks/useTierData"
import { STRATEGY_TO_SCENARIO_ID } from "../../../constants/outcomeMappings"
import type {
  ChartDataPoint,
  OutcomeInfo,
} from "../../../types/scenarioExplorer"

/**
 * Hook that manages scenario data fetching and mapping
 * Encapsulates the logic for converting API data to chart format
 */
export function useScenarioData(): {
  allChartData: Record<string, Record<string, ChartDataPoint[]>>
  outcomeNames: OutcomeInfo[]
  getChartDataForStrategy: (
    strategyValue: string,
  ) => Record<string, ChartDataPoint[]>
  isLoading: boolean
  error: string | null
} {
  // Fetch tier data
  const { allChartData, outcomeNames, isLoading, error } =
    useMultipleScenarioTiers()

  // Map strategy values to their corresponding scenario data using centralized mapping
  const getChartDataForStrategy = useMemo(
    () => (strategyValue: string) => {
      const scenarioId = STRATEGY_TO_SCENARIO_ID[strategyValue]
      if (scenarioId && allChartData[scenarioId]) {
        return allChartData[scenarioId]
      }
      // Fallback to current-ops (s0020) if strategy not found
      console.warn(
        `No scenario data found for strategy "${strategyValue}", using s0020 fallback`,
      )
      return allChartData["s0020"] || {}
    },
    [allChartData],
  )

  return {
    allChartData,
    outcomeNames: outcomeNames as OutcomeInfo[],
    getChartDataForStrategy,
    isLoading,
    error,
  }
}
