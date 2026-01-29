"use client"

/**
 * Hook for getting tier short_code to display name mapping
 *
 * This hook derives the mapping from cached useTiers data
 */

import { useMemo } from "react"
import { useTiers } from "./useTiers"
import type { TierMapping } from "../types"

/**
 * Get a mapping from tier short_code to display name
 *
 * @returns Tier mapping with loading and error states
 *
 * @example
 * ```typescript
 * function TierDisplay({ shortCode }: { shortCode: string }) {
 *   const { tierMapping, isLoading } = useTierMapping()
 *
 *   if (isLoading) return <Spinner />
 *
 *   const displayName = tierMapping?.[shortCode] ?? shortCode
 *   return <span>{displayName}</span>
 * }
 * ```
 */
export function useTierMapping() {
  const { tiers, isLoading, error } = useTiers()

  // Derive mapping from tier list - only recalculates when tiers changes
  const tierMapping = useMemo<TierMapping | undefined>(() => {
    if (!tiers) return undefined

    return tiers.reduce<TierMapping>((acc, tier) => {
      acc[tier.short_code] = tier.name
      return acc
    }, {})
  }, [tiers])

  return {
    tierMapping,
    isLoading,
    error,
  }
}

/**
 * Utility function to convert API short codes to display names
 *
 * @param shortCode - Tier short code (e.g., "AG_REV")
 * @param mapping - Tier mapping from useTierMapping
 * @returns Display name or original short code if not found
 */
export function mapShortCodeToDisplayName(
  shortCode: string,
  mapping: TierMapping,
): string {
  return mapping[shortCode] ?? shortCode
}
