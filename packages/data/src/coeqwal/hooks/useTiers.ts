"use client"

/**
 * Hook for fetching tier definitions
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchTierList } from "../fetchers"
import type { TierListItem } from "../types"

/**
 * Fetch and cache tier definitions
 *
 * Returns metadata for all outcomes (tiers) in the system.
 * This data is static and cached indefinitely.
 *
 * @returns Tier data with loading and error states
 *
 * @example
 * ```typescript
 * function OutcomeSelector() {
 *   const { tiers, isLoading, error } = useTiers()
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error} />
 *
 *   return (
 *     <ul>
 *       {tiers?.filter(t => t.is_active).map(tier => (
 *         <li key={tier.short_code}>{tier.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTiers() {
  const {
    data: tiers,
    error: swrError,
    isLoading,
  } = useSWR<TierListItem[]>(CACHE_KEYS.TIER_LIST, fetchTierList, {
    // Static data - don't revalidate
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
  })

  const error = swrError ? String(swrError.message || swrError) : null

  return {
    tiers,
    isLoading,
    error,
  }
}
