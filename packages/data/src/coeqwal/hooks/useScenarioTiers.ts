"use client"

/**
 * Hook for fetching tier scores for a specific scenario
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchScenarioTiers } from "../fetchers"
import type { ScenarioTiersResponse } from "../types"

/**
 * Fetch and cache tier scores for a specific scenario
 *
 * Returns the full tier data including weighted_score, normalized_score,
 * gini, and distribution data for multi-value tiers.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to skip fetching
 * @returns Scenario tier data with loading and error states
 *
 * @example
 * ```typescript
 * function ScenarioDetails({ scenarioId }: { scenarioId: string }) {
 *   const { data, isLoading, error } = useScenarioTiers(scenarioId)
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error} />
 *
 *   return (
 *     <ul>
 *       {Object.entries(data?.tiers ?? {}).map(([code, tier]) => (
 *         <li key={code}>{code}: {tier.weighted_score}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useScenarioTiers(scenarioId: string | null) {
  const {
    data,
    error: swrError,
    isLoading,
  } = useSWR<ScenarioTiersResponse>(
    scenarioId ? CACHE_KEYS.scenarioTiers(scenarioId) : null,
    () => fetchScenarioTiers(scenarioId!),
    {
      // Scenario tier data is relatively static
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    isLoading,
    error,
  }
}
