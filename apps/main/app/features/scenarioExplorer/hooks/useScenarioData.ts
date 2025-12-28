import { useMemo } from "react"
import { useMultipleScenarioTiers } from "../../scenarios/hooks"
import type { ChartDataPoint } from "../../scenarios/components/shared/types"
import type { OutcomeInfo } from "../types"

/**
 * Hook that manages scenario data fetching and mapping
 */
export function useScenarioData(): {
  allChartData: Record<string, Record<string, ChartDataPoint[]>>
  outcomeNames: OutcomeInfo[]
  getChartDataForScenario: (
    scenarioId: string,
  ) => Record<string, ChartDataPoint[]>
  isLoading: boolean
  error: string | null
} {
  const { allChartData, outcomeNames, isLoading, error } =
    useMultipleScenarioTiers()

  const getChartDataForScenario = useMemo(
    () => (scenarioId: string) => {
      if (allChartData[scenarioId]) {
        return allChartData[scenarioId]
      }
      return {}
    },
    [allChartData],
  )

  return {
    allChartData,
    outcomeNames: outcomeNames as OutcomeInfo[],
    getChartDataForScenario,
    isLoading,
    error,
  }
}
