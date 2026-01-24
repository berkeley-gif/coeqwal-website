"use client"

/**
 * Hook for fetching the scenario list
 *
 * This is an atomic hook - it does one thing well.
 * The scenario list is relatively static data.
 */

import { useMemo } from "react"
import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchScenarioList } from "../fetchers"
import type { ScenarioListItem } from "../types"

/**
 * Fetch and cache the scenario list
 *
 * Returns all scenarios from the API with their metadata.
 * Also provides a filtered list of active scenario IDs for convenience.
 *
 * @returns Scenario data with loading and error states
 *
 * @example
 * ```typescript
 * function ScenarioList() {
 *   const { scenarios, activeScenarioIds, isLoading, error } = useScenarios()
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error} />
 *
 *   return (
 *     <ul>
 *       {scenarios?.filter(s => s.is_active).map(scenario => (
 *         <li key={scenario.scenario_id}>{scenario.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useScenarios() {
  const {
    data: scenarios,
    error: swrError,
    isLoading,
  } = useSWR<ScenarioListItem[]>(CACHE_KEYS.SCENARIOS, fetchScenarioList, {
    // Scenario list is relatively static - don't revalidate on focus
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })

  // Derive active scenario IDs - commonly needed for fetching tier data
  const activeScenarioIds = useMemo(
    () => scenarios?.filter((s) => s.is_active).map((s) => s.scenario_id) ?? [],
    [scenarios],
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    scenarios,
    activeScenarioIds,
    isLoading,
    error,
  }
}
