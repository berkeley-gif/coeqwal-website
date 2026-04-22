"use client"

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchScenarioTierByCode } from "../fetchers"
import type { ScenarioTiersResponse } from "../types"

type ScenarioTierByCode = ScenarioTiersResponse["tiers"][string] & {
  scenario: string
  tier_code: string
}

/**
 * Fetch and cache tier scores for a single outcome within a specific scenario.
 *
 * Parallel to `useScenarioTiers` (which returns every outcome for one
 * scenario) but scoped to a single outcome. Use when a component only cares
 * about one outcome and fetching the full scenario payload would be wasteful.
 *
 * Pass `null` for either argument to skip fetching (conditional SWR key).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to skip
 * @param tierCode   - Tier short code (e.g., "ENV_FLOWS"), or null to skip
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useScenarioTierByCode("s0020", "ENV_FLOWS")
 * const weightedScore = data?.weighted_score
 * ```
 */
export function useScenarioTierByCode(
  scenarioId: string | null,
  tierCode: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
    isValidating,
  } = useSWR<ScenarioTierByCode>(
    scenarioId && tierCode
      ? CACHE_KEYS.scenarioTierByCode(scenarioId, tierCode)
      : null,
    () => fetchScenarioTierByCode(scenarioId!, tierCode!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    },
  )

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    isLoading,
    isValidating,
    error,
  }
}
