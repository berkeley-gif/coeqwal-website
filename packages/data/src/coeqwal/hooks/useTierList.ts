"use client"

/**
 * Hook for fetching the tier list
 *
 * The tier list is static data that rarely changes.
 */

import useSWR from "swr"
import { CACHE_KEYS } from "../../cache/keys"
import { fetchTierList } from "../fetchers"
import type { TierListItem } from "../types"

/**
 * Fetch and cache the tier list
 *
 * The tier list contains metadata for all outcomes (tiers) in the system.
 * This data is static and cached indefinitely.
 *
 * @returns Tier list data with loading and error states
 *
 * @example
 * ```typescript
 * function OutcomeSelector() {
 *   const { tierList, isLoading, error } = useTierList()
 *
 *   if (isLoading) return <Spinner />
 *   if (error) return <Error message={error} />
 *
 *   return (
 *     <ul>
 *       {tierList?.filter(t => t.is_active).map(tier => (
 *         <li key={tier.short_code}>{tier.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTierList() {
  const {
    data: tierList,
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
    tierList,
    isLoading,
    error,
  }
}
