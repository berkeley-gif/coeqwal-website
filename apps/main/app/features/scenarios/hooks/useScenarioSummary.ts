/**
 * useScenarioSummary - Unified hook for scenario summary data
 *
 * Combines strategy metadata, operations icons, and tier outcome data
 * into a single hook for use by ScenarioCard and ScenarioRow components.
 *
 * Uses SWR for caching - multiple components using the same strategy
 * will share cached data.
 * 
 * Experimental: still working on this feature.
 */

import { useMemo } from "react"
import {
  getStrategy,
  type Strategy,
  type StrategyTheme,
} from "../../../content/scenarios"
import { getStrategyIcons, type StrategyIcon } from "../components/shared/strategyIcons"
import { useScenarioTiers, type ChartDataPoint, OUTCOME_DISPLAY_ORDER } from "./useTierData"

// =============================================================================
// Types
// =============================================================================

export interface ScenarioSummaryData {
  // Strategy info
  id: string
  label: string
  shortLabel: string
  description: string
  theme: StrategyTheme
  scenarioId: string
  iconPath: string

  // Operations icons
  operations: StrategyIcon[]

  // Outcomes (from tier API)
  outcomes: Record<string, ChartDataPoint[]>

  // Outcome names in display order
  outcomeNames: string[]
}

export interface UseScenarioSummaryReturn {
  /** Scenario summary data, null if strategy not found */
  data: ScenarioSummaryData | null
  /** Whether data is still loading */
  isLoading: boolean
  /** Error message if data fetch failed */
  error: string | null
  /** Raw strategy object for backward compatibility */
  strategy: Strategy | null
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Get complete scenario summary data for a strategy
 *
 * @param strategyValue - Strategy identifier (e.g., "current-ops")
 * @returns Unified scenario summary data with loading/error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useScenarioSummary("current-ops")
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error} />
 * if (!data) return <NotFound />
 *
 * return (
 *   <div>
 *     <h2>{data.label}</h2>
 *     <p>{data.description}</p>
 *     <OperationsIcons icons={data.operations} />
 *     <OutcomeGlyphs outcomes={data.outcomes} />
 *   </div>
 * )
 * ```
 */
export function useScenarioSummary(
  strategyValue: string | null,
): UseScenarioSummaryReturn {
  // Get strategy metadata
  const strategy = useMemo(
    () => (strategyValue ? getStrategy(strategyValue) : null),
    [strategyValue],
  )

  // Get scenario ID from strategy
  const scenarioId = strategy?.scenarioId ?? null

  // Fetch tier data using existing hook (leverages SWR caching)
  const {
    chartData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    outcomeNames: _outcomeInfos, // Available for future use
    isLoading: tiersLoading,
    error: tiersError,
  } = useScenarioTiers(scenarioId)

  // Get operations icons for this strategy
  const operations = useMemo(
    () => (strategyValue ? getStrategyIcons(strategyValue) : []),
    [strategyValue],
  )

  // Build unified data object
  const data = useMemo<ScenarioSummaryData | null>(() => {
    if (!strategy) return null

    return {
      // Strategy info
      id: strategy.value,
      label: strategy.label,
      shortLabel: strategy.shortLabel || strategy.label,
      description: strategy.description,
      theme: strategy.theme,
      scenarioId: strategy.scenarioId,
      iconPath: strategy.iconPath,

      // Operations
      operations,

      // Outcomes
      outcomes: chartData,
      outcomeNames: OUTCOME_DISPLAY_ORDER as unknown as string[],
    }
  }, [strategy, operations, chartData])

  // Compute error message
  const error = useMemo(() => {
    if (!strategyValue) return null
    if (!strategy) return `Strategy "${strategyValue}" not found`
    if (tiersError) return `Failed to load outcome data: ${tiersError.message}`
    return null
  }, [strategyValue, strategy, tiersError])

  return {
    data,
    isLoading: tiersLoading,
    error,
    strategy: strategy ?? null,
  }
}

/**
 * Get scenario summary data for multiple strategies
 *
 * Useful for comparison views or grids displaying multiple scenarios.
 * Leverages SWR's deduplication for efficient data fetching.
 *
 * @param strategyValues - Array of strategy identifiers
 * @returns Map of strategy value to summary data
 */
export function useMultipleScenarioSummaries(
  strategyValues: string[],
): {
  data: Map<string, ScenarioSummaryData>
  isLoading: boolean
  errors: Map<string, string>
} {
  // Note: This is a simplified implementation that uses individual hooks.
  // For production, consider batching API calls or using a more sophisticated
  // data fetching strategy.

  // Get all strategies
  const strategies = useMemo(
    () =>
      strategyValues
        .map((v) => ({ value: v, strategy: getStrategy(v) }))
        .filter((s) => s.strategy !== undefined),
    [strategyValues],
  )

  // Build operations for each strategy
  const operationsMap = useMemo(() => {
    const map = new Map<string, StrategyIcon[]>()
    strategies.forEach(({ value }) => {
      map.set(value, getStrategyIcons(value))
    })
    return map
  }, [strategies])

  // Note: This hook doesn't fetch tier data for all strategies by default
  // to avoid excessive API calls. Use useMultipleScenarioTiers for that.
  // This returns static data only.

  const data = useMemo(() => {
    const map = new Map<string, ScenarioSummaryData>()

    strategies.forEach(({ value, strategy }) => {
      if (!strategy) return

      map.set(value, {
        id: strategy.value,
        label: strategy.label,
        shortLabel: strategy.shortLabel || strategy.label,
        description: strategy.description,
        theme: strategy.theme,
        scenarioId: strategy.scenarioId,
        iconPath: strategy.iconPath,
        operations: operationsMap.get(value) || [],
        outcomes: {}, // Empty - use useMultipleScenarioTiers for outcome data
        outcomeNames: OUTCOME_DISPLAY_ORDER as unknown as string[],
      })
    })

    return map
  }, [strategies, operationsMap])

  return {
    data,
    isLoading: false, // Static data only
    errors: new Map(),
  }
}

export default useScenarioSummary








