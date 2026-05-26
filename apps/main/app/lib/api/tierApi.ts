/**
 * Chart data conversion utilities for tier visualization
 *
 * These functions convert API tier data to chart-ready format.
 * For API fetching and types, use @repo/data/coeqwal
 */

import type { MultiValueTier } from "@repo/data/coeqwal"
import type { TierColors } from "../../content/tiers"

// Re-export for backwards compatibility
export type { TierColors }

type ChartDataPoint = {
  label: string
  color: string
  value: number
  tierType?: "single_value" | "multi_value"
  totalLocations?: number
  rawCount?: number
}

/**
 * Tier keys in 1-to-4 order. The API's multi-value `data` array
 * is fixed-length and positional, so the entry at index `i` is the
 * `TIER_KEYS[i]` level. This lookup gives us label and color without
 * shipping the redundant `"tier1"`/.../`"tier4"` string on every row
 */
const TIER_KEYS = ["tier1", "tier2", "tier3", "tier4"] as const
const TIER_LABELS = ["Tier 1", "Tier 2", "Tier 3", "Tier 4"] as const

/**
 * Convert multi-value tier data to chart format.
 *
 * A null `normalized` for one tier means the API returned no value for
 * that tier level. The bar renders at 0 height, which is the right visual
 * for "this tier had no locations" in a stacked distribution. The
 * fully-missing case (every tier null) is filtered upstream in
 * `useTierData.processScenarioData`, so this function never sees it.
 *
 * @param tierData - Tier data from API
 * @param tierColors - Colors from theme (use getTierColorsFromTheme from content/tiers.ts)
 */
export function convertMultiValueToChartData(
  tierData: MultiValueTier,
  tierColors: TierColors,
): ChartDataPoint[] {
  return tierData.data.map((item, i) => ({
    label: TIER_LABELS[i] ?? "",
    color: tierColors[TIER_KEYS[i] ?? "tier1"],
    value: item.normalized ?? 0,
    tierType: "multi_value" as const,
    totalLocations: tierData.total ?? undefined,
    rawCount: item.value ?? undefined,
  }))
}

/**
 * Convert single-value tier level to chart format
 * @param tierLevel - Tier level (1-4)
 * @param tierColors - Colors from theme (use getTierColorsFromTheme from content/tiers.ts)
 */
export function convertSingleValueToChartData(
  tierLevel: number,
  tierColors: TierColors,
): ChartDataPoint[] {
  return [
    {
      label: "Tier 1",
      color: tierColors.tier1,
      value: tierLevel === 1 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 2",
      color: tierColors.tier2,
      value: tierLevel === 2 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 3",
      color: tierColors.tier3,
      value: tierLevel === 3 ? 1 : 0,
      tierType: "single_value" as const,
    },
    {
      label: "Tier 4",
      color: tierColors.tier4,
      value: tierLevel === 4 ? 1 : 0,
      tierType: "single_value" as const,
    },
  ]
}
