"use client"

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchTierLocationAssignments } from "../fetchers"
import type { TierLocationAssignmentsResponse } from "../types"

/**
 * Fetch and cache per-location tier assignments for a single scenario+outcome.
 *
 * Returns location-level tier data (no geometry) — suitable for treemaps,
 * tables, or any visualization that needs to know which locations fall into
 * which tier.
 *
 * Pass `null` for either argument to skip fetching (conditional SWR key).
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to skip
 * @param tierCode   - Tier short code (e.g., "CWS_DEL"), or null to skip
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useTierLocationAssignments("s0020", "CWS_DEL")
 * const tier4 = data?.locations.filter(l => l.tier_level === 4)
 * ```
 */
export function useTierLocationAssignments(
  scenarioId: string | null,
  tierCode: string | null,
) {
  const {
    data,
    error: swrError,
    isLoading,
    isValidating,
  } = useSWR<TierLocationAssignmentsResponse>(
    scenarioId && tierCode
      ? CACHE_KEYS.tierLocations(scenarioId, tierCode)
      : null,
    () => fetchTierLocationAssignments(scenarioId!, tierCode!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
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
