/**
 * useScenarioSummary - Unified hook for scenario summary data
 *
 * Combines scenario metadata, operations icons, and tier outcome data
 * into a single hook for use by ScenarioCard and ScenarioRow components.
 *
 * Uses SWR for caching - multiple components using the same scenario
 * will share cached data.
 *
 * Experimental: still working on this feature.
 */

import { useMemo } from "react"
import {
  useScenarioList,
  type Scenario,
  type ScenarioTheme,
} from "./useScenarioList"
import {
  getScenarioIconDefs,
  type IconDef,
} from "../components/shared/opsIcons"
import { useScenarioTiers } from "./useTierData"
import { OUTCOME_CODE_ORDER, getOutcomeName } from "../../../content/outcomes"

// Generate display names from codes
const OUTCOME_NAMES_ORDERED = OUTCOME_CODE_ORDER.map(getOutcomeName)
import type { ChartDataPoint } from "../components/shared/types"

// =============================================================================
// Types
// =============================================================================

export interface ScenarioSummaryData {
  // Scenario info
  scenarioId: string
  label: string
  shortLabel: string
  description: string
  theme: ScenarioTheme
  iconPath: string

  // Operations icons
  operations: IconDef[]

  // Outcomes (from tier API)
  outcomes: Record<string, ChartDataPoint[]>

  // Outcome names in display order
  outcomeNames: string[]
}

export interface UseScenarioSummaryReturn {
  /** Scenario summary data, null if scenario not found */
  data: ScenarioSummaryData | null
  /** Whether data is still loading */
  isLoading: boolean
  /** Error message if data fetch failed */
  error: string | null
  /** Raw scenario object */
  scenario: Scenario | null
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * Get complete scenario summary data
 *
 * @param scenarioId - Scenario ID (e.g., "s0020")
 * @returns Unified scenario summary data with loading/error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useScenarioSummary("s0020")
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
  scenarioId: string | null,
): UseScenarioSummaryReturn {
  // Get scenario metadata from API + local enrichment
  const { getScenario, isLoading: scenarioListLoading } = useScenarioList()

  const scenario = useMemo(
    () => (scenarioId ? getScenario(scenarioId) : null),
    [scenarioId, getScenario],
  )

  // Fetch tier data using existing hook (leverages SWR caching)
  const {
    chartData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    outcomeNames: _outcomeInfos, // Available for future use
    isLoading: tiersLoading,
    error: tiersError,
  } = useScenarioTiers(scenarioId)

  // Get operations icons for this scenario
  const operations = useMemo(
    () => (scenarioId ? getScenarioIconDefs(scenarioId) : []),
    [scenarioId],
  )

  // Build unified data object
  const data = useMemo<ScenarioSummaryData | null>(() => {
    if (!scenario) return null

    return {
      // Scenario info
      scenarioId: scenario.scenarioId,
      label: scenario.label,
      shortLabel: scenario.shortLabel || scenario.label,
      description: scenario.description,
      theme: scenario.theme,
      iconPath: scenario.iconPath,

      // Operations
      operations,

      // Outcomes
      outcomes: chartData,
      outcomeNames: OUTCOME_NAMES_ORDERED,
    }
  }, [scenario, operations, chartData])

  // Compute error message
  const error = useMemo(() => {
    if (!scenarioId) return null
    if (!scenario && !scenarioListLoading)
      return `Scenario "${scenarioId}" not found`
    if (tiersError) return `Failed to load outcome data: ${tiersError}`
    return null
  }, [scenarioId, scenario, scenarioListLoading, tiersError])

  return {
    data,
    isLoading: scenarioListLoading || tiersLoading,
    error,
    scenario: scenario ?? null,
  }
}

/**
 * Get scenario summary data for multiple scenarios
 *
 * Useful for comparison views or grids displaying multiple scenarios.
 * Leverages SWR's deduplication for efficient data fetching.
 *
 * @param scenarioIds - Array of scenario IDs
 * @returns Map of scenario ID to summary data
 */
export function useMultipleScenarioSummaries(scenarioIds: string[]): {
  data: Map<string, ScenarioSummaryData>
  isLoading: boolean
  errors: Map<string, string>
} {
  // Get all scenarios from API + local enrichment
  const { getScenario, isLoading } = useScenarioList()

  // Get all scenarios
  const scenarios = useMemo(
    () =>
      scenarioIds
        .map((id) => ({ scenarioId: id, scenario: getScenario(id) }))
        .filter((s) => s.scenario !== undefined),
    [scenarioIds, getScenario],
  )

  // Build operations for each scenario
  const operationsMap = useMemo(() => {
    const map = new Map<string, IconDef[]>()
    scenarios.forEach(({ scenarioId }) => {
      map.set(scenarioId, getScenarioIconDefs(scenarioId))
    })
    return map
  }, [scenarios])

  // Note: This hook doesn't fetch tier data for all scenarios by default
  // to avoid excessive API calls. Use useMultipleScenarioTiers for that.
  // This returns static data only.

  const data = useMemo(() => {
    const map = new Map<string, ScenarioSummaryData>()

    scenarios.forEach(({ scenarioId, scenario }) => {
      if (!scenario) return

      map.set(scenarioId, {
        scenarioId: scenario.scenarioId,
        label: scenario.label,
        shortLabel: scenario.shortLabel || scenario.label,
        description: scenario.description,
        theme: scenario.theme,
        iconPath: scenario.iconPath,
        operations: operationsMap.get(scenarioId) || [],
        outcomes: {}, // Empty - use useMultipleScenarioTiers for outcome data
        outcomeNames: OUTCOME_NAMES_ORDERED,
      })
    })

    return map
  }, [scenarios, operationsMap])

  return {
    data,
    isLoading,
    errors: new Map(),
  }
}

export default useScenarioSummary
