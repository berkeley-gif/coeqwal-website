import { useMemo } from "react"
import { useMultipleScenarioTiers } from "../../../hooks/useTierData"
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

  // Map strategy values to their corresponding scenario data (memoized)
  // Todo later: make scenario lists dynamic
  const getChartDataForStrategy = useMemo(
    () => (strategyValue: string) => {
      switch (strategyValue) {
        case "current-ops":
          return allChartData["s0020"] || {}
        case "current-ops-wo-tucp":
          return allChartData["s0021"] || {}
        case "current-ops-historical-ag":
          return allChartData["s0011"] || {}
        default:
          return allChartData["s0020"] || {} // fallback
      }
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
