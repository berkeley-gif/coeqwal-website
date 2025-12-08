/**
 * Centralized Tier Definitions
 * 
 * Tier colors should come from theme.palette.tiers
 * This file provides tier labels and helper functions.
 */

// Tier level type
export type TierLevel = 1 | 2 | 3 | 4

// Tier labels - the canonical source for tier category names
export const TIER_LABELS: Record<TierLevel, string> = {
  1: "Optimal",
  2: "Sub-optimal",
  3: "At-risk",
  4: "Critical",
} as const

// Get tier label from tier level
export function getTierLabel(tierLevel: number): string {
  if (tierLevel >= 1 && tierLevel <= 4) {
    return TIER_LABELS[tierLevel as TierLevel]
  }
  return "Unknown"
}

// Get tier level from label (reverse lookup)
export function getTierLevel(label: string): TierLevel | null {
  const entry = Object.entries(TIER_LABELS).find(([, value]) => value === label)
  return entry ? (parseInt(entry[0]) as TierLevel) : null
}

/**
 * Get tier color from theme
 * Usage: getTierColor(theme, 1) returns theme.palette.tiers.tier1
 * 
 * @param theme - MUI theme object
 * @param tierLevel - Tier level (1-4)
 * @returns Color string from theme
 */
export function getTierColor(
  theme: { palette: { tiers: { tier1: string; tier2: string; tier3: string; tier4: string } } },
  tierLevel: number
): string {
  switch (tierLevel) {
    case 1:
      return theme.palette.tiers.tier1
    case 2:
      return theme.palette.tiers.tier2
    case 3:
      return theme.palette.tiers.tier3
    case 4:
      return theme.palette.tiers.tier4
    default:
      return "#888888" // Fallback grey
  }
}

/**
 * Create a tier colors object from theme for use in components
 * Usage: const tierColors = getTierColorsFromTheme(theme)
 */
export function getTierColorsFromTheme(
  theme: { palette: { tiers: { tier1: string; tier2: string; tier3: string; tier4: string } } }
): Record<TierLevel, string> {
  return {
    1: theme.palette.tiers.tier1,
    2: theme.palette.tiers.tier2,
    3: theme.palette.tiers.tier3,
    4: theme.palette.tiers.tier4,
  }
}

