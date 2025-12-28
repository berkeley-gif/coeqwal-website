/**
 * Centralized tier definitions
 *
 * Tier colors come from theme.palette.tiers
 * This file provides tier labels and helper functions.
 */

export type TierLevel = 1 | 2 | 3 | 4

export const TIER_LABELS: Record<TierLevel, string> = {
  1: "Optimal",
  2: "Sub-optimal",
  3: "At-risk",
  4: "Critical",
} as const

export function getTierLabel(tierLevel: number): string {
  if (tierLevel >= 1 && tierLevel <= 4) {
    return TIER_LABELS[tierLevel as TierLevel]
  }
  return "Unknown"
}

// Minimal theme type for tier colors
type TierTheme = { palette: { tiers: TierColors } }

/** TierColors type matching theme.palette.tiers */
export type TierColors = {
  tier1: string
  tier2: string
  tier3: string
  tier4: string
}

/** Get tier colors as Record<TierLevel, string> for UI components */
export function getTierColorsFromTheme(
  theme: TierTheme,
): Record<TierLevel, string> {
  const { tiers } = theme.palette
  return { 1: tiers.tier1, 2: tiers.tier2, 3: tiers.tier3, 4: tiers.tier4 }
}

/** Get tier colors in TierColors format for API functions */
export function getThemeColorsForApi(theme: TierTheme): TierColors {
  return theme.palette.tiers
}
