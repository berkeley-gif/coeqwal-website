"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useEffect } from "react"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchTierLocationAssignmentsBatch } from "../fetchers"
import type { TierLocationAssignmentsBatchResponse } from "../types"

/**
 * Fetch per-location tier assignments for multiple outcomes in one request.
 *
 * Single batched call instead of N parallel `useTierLocationAssignments`
 * hooks. Ideal for panels that need several outcomes for one scenario
 * (equity heatmaps, tier animations, resilience distributions).
 *
 * On success, each per-code sub-response is written back into the single
 * hook cache key (`CACHE_KEYS.tierLocations(scenarioId, code)`) so that any
 * component using `useTierLocationAssignments(scenarioId, code)` elsewhere
 * in the tree renders instantly from cache without a second HTTP request.
 *
 * Codes are normalized (deduplicated and sorted) inside the fetcher, so
 * caller order does not fragment the cache.
 *
 * Pass `null` for `scenarioId` or an empty `tierCodes` array to skip fetching.
 *
 * @param scenarioId - Scenario ID (e.g., "s0020"), or null to skip
 * @param tierCodes  - Tier short codes to fetch together (e.g.
 *                     `["CWS_DEL", "AG_REV", "ENV_FLOWS"]`)
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useTierLocationAssignmentsBatch(
 *   "s0020",
 *   ["CWS_DEL", "AG_REV", "ENV_FLOWS"],
 * )
 * const cwsDel = data?.results["CWS_DEL"]
 * const absent = data?.missing // e.g. [] or ["WRC_SALMON_AB"] for s0065
 * ```
 */
export function useTierLocationAssignmentsBatch(
  scenarioId: string | null,
  tierCodes: string[],
) {
  const hasCodes = tierCodes.length > 0
  const enabled = Boolean(scenarioId) && hasCodes

  const {
    data,
    error: swrError,
    isLoading,
    isValidating,
  } = useSWR<TierLocationAssignmentsBatchResponse>(
    enabled
      ? CACHE_KEYS.tierLocationsBatch(scenarioId as string, tierCodes)
      : null,
    () => fetchTierLocationAssignmentsBatch(scenarioId as string, tierCodes),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  )

  // Warm the single-hook cache so any existing useTierLocationAssignments
  // consumers elsewhere in the tree render instantly from cache. We do this
  // in an effect (not synchronously in render) to avoid triggering React
  // render warnings about mutating external stores during commit.
  useEffect(() => {
    if (!data || !scenarioId) return
    for (const [code, perCode] of Object.entries(data.results)) {
      globalMutate(CACHE_KEYS.tierLocations(scenarioId, code), perCode, {
        revalidate: false,
      })
    }
  }, [data, scenarioId])

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    data,
    isLoading,
    isValidating,
    error,
  }
}
