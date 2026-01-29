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
}

const formatTierLabel = (tier: string) =>
  tier.charAt(0).toUpperCase() + tier.slice(1)

/**
 * Convert multi-value tier data to chart format
 * @param tierData - Tier data from API
 * @param tierColors - Colors from theme (use getTierColorsFromTheme from content/tiers.ts)
 */
export function convertMultiValueToChartData(
  tierData: MultiValueTier,
  tierColors: TierColors,
): ChartDataPoint[] {
  return tierData.data.map((item) => ({
    label: formatTierLabel(item.tier),
    color: tierColors[item.tier],
    value: item.normalized,
    tierType: "multi_value" as const,
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
