/**
 * Strategy icons - Shared utilities for rendering strategy operation icons
 *
 * Used by OperationsIconGroup and StrategyGrid.
 * Consolidates logic from StrategyRow/utils.ts and ThemeIcons.tsx.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import { CURRENT_OPERATIONS_ICONS } from "../../../../content/scenarios"

// ============================================================================
// Types
// ============================================================================

export interface StrategyIcon {
  path: string
  alt: string
  description: string
  label: string
}

interface ThemeIconProps {
  size?: number | string
}

// ============================================================================
// Theme Icons (for non-baseline strategies)
// ============================================================================

/**
 * SGMA (Sustainable Groundwater Management Act) icon
 */
export function SGMAIcon({ size = "100%" }: ThemeIconProps) {
  return (
    <Box component="svg" viewBox="0 0 40 40" sx={{ width: size, height: size }}>
      <circle cx="20" cy="20" r="20" fill="#4A90A4" />
      <text
        x="20"
        y="17"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontWeight="600"
        fontFamily="sans-serif"
      >
        SGMA
      </text>
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="white"
        fontSize="7"
        fontWeight="400"
        fontFamily="sans-serif"
      >
        limits
      </text>
    </Box>
  )
}

/**
 * Environmental/Functional Flows theme icon
 */
export function EnvironmentalIcon({ size = "100%" }: ThemeIconProps) {
  return (
    <Box component="svg" viewBox="0 0 40 40" sx={{ width: size, height: size }}>
      <circle cx="20" cy="20" r="20" fill="#5A8F5A" />
      <text
        x="20"
        y="24"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontWeight="600"
        fontFamily="sans-serif"
      >
        ENV
      </text>
    </Box>
  )
}

/**
 * Get the theme icon component for a strategy theme
 */
export function getThemeIcon(theme: string): React.ReactNode {
  switch (theme) {
    case "groundwater":
      return <SGMAIcon />
    case "environmental":
      return <EnvironmentalIcon />
    default:
      return null
  }
}

/**
 * Get the description for a theme icon
 */
export function getThemeIconDescription(
  theme: string,
  strategyValue: string,
): string {
  switch (theme) {
    case "groundwater":
      if (strategyValue === "sgma-sj-valley") {
        return "SGMA groundwater pumping limits applied to San Joaquin Valley region"
      }
      if (strategyValue === "sgma-central-valley") {
        return "SGMA groundwater pumping limits applied across entire Central Valley"
      }
      return "Groundwater management scenario with pumping limits"
    case "environmental":
      return "Functional flows: Environmental flow requirements on tributaries and Delta"
    default:
      return "Current operations baseline"
  }
}

// ============================================================================
// Strategy Icon Configuration
// ============================================================================

/**
 * Get the operation icons for a given strategy
 * Returns icon metadata for rendering with tooltips
 */
export function getStrategyIcons(strategyValue: string): StrategyIcon[] {
  const icons: StrategyIcon[] = []

  // Icon 1: Current operations (always shown)
  icons.push({
    path: CURRENT_OPERATIONS_ICONS[0]?.path || "/images/icons/current_ops.svg",
    alt: CURRENT_OPERATIONS_ICONS[0]?.alt || "Current operations",
    description:
      CURRENT_OPERATIONS_ICONS[0]?.description || "Current operations",
    label: "Current operations",
  })

  // Icon 2: Land use (different for historical-ag strategy)
  if (strategyValue === "current-ops-historical-ag") {
    icons.push({
      path: "/images/icons/land_use_prev.svg",
      alt: "Historical land use",
      description: "Historical land use (2004-2013)",
      label: "Historical land use\n(2004-2013)",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[1]?.path || "/images/icons/land_use.svg",
      alt: CURRENT_OPERATIONS_ICONS[1]?.alt || "Current land use",
      description:
        CURRENT_OPERATIONS_ICONS[1]?.description ||
        "Current land use considerations",
      label: "Updated agricultural\nland use (2020)",
    })
  }

  // Icon 3: TUCP status
  if (strategyValue === "current-ops-wo-tucp") {
    icons.push({
      path: "/images/icons/no_tucp.svg",
      alt: "Without TUCPs",
      description:
        "Operations without Temporary Urgent Change Petitions (TUCPs)",
      label: "TUCPs\nnot allowed",
    })
  } else {
    icons.push({
      path: CURRENT_OPERATIONS_ICONS[2]?.path || "/images/icons/tucp.svg",
      alt: CURRENT_OPERATIONS_ICONS[2]?.alt || "TUCP considerations",
      description:
        CURRENT_OPERATIONS_ICONS[2]?.description ||
        "Temporary Urgent Change Petitions permitted",
      label: "TUCPs\nallowed",
    })
  }

  return icons
}

/**
 * Configuration for strategy icons based on strategy theme and value
 */
export interface StrategyIconConfig {
  /** Strategy theme determines which icons to show */
  theme: string | undefined
  /** Strategy value for special cases */
  strategyValue: string
  /** Whether this is a baseline strategy */
  isBaseline: boolean
  /** Icon display size */
  size?: "sm" | "md" | "lg"
}

/**
 * Get icon size in theme spacing units
 */
export function getIconSize(size: "sm" | "md" | "lg" = "md"): {
  xs: number
  lg: number
} {
  switch (size) {
    case "sm":
      return { xs: 3.5, lg: 3.5 } // 28px
    case "md":
      return { xs: 4, lg: 5 } // 32px / 40px
    case "lg":
      return { xs: 5, lg: 6 } // 40px / 48px
  }
}




