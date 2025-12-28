/**
 * Scenario icons - Shared utilities for rendering scenario operation icons
 *
 * Used by OperationsIconGroup and StrategyGrid.
 * Uses scenario_id (e.g., "s0020") for all identifiers.
 */

import React from "react"
import { Box } from "@repo/ui/mui"
import {
  CURRENT_OPERATIONS_ICONS,
  type ScenarioTheme,
} from "../../../../content/scenarios"

// ============================================================================
// Types
// ============================================================================

export interface ScenarioIcon {
  path: string
  alt: string
  description: string
  label: string
}

interface ThemeIconProps {
  size?: number | string
}

// ============================================================================
// Theme Icons (for non-baseline scenarios)
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
 * Get the theme icon component for a scenario theme
 */
export function getThemeIcon(theme: ScenarioTheme): React.ReactNode {
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
  theme: ScenarioTheme,
  scenarioId: string,
): string {
  switch (theme) {
    case "groundwater":
      if (scenarioId === "s0025") {
        return "SGMA groundwater pumping limits applied to San Joaquin Valley region"
      }
      if (scenarioId === "s0027") {
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
// Scenario Icon Configuration
// ============================================================================

/**
 * Get the operation icons for a given scenario
 * Returns icon metadata for rendering with tooltips
 *
 * @param scenarioId - The scenario ID (e.g., "s0020", "s0011")
 */
export function getScenarioIcons(scenarioId: string): ScenarioIcon[] {
  const icons: ScenarioIcon[] = []

  // Icon 1: Current operations (always shown)
  icons.push({
    path: CURRENT_OPERATIONS_ICONS[0]?.path || "/images/icons/current_ops.svg",
    alt: CURRENT_OPERATIONS_ICONS[0]?.alt || "Current operations",
    description:
      CURRENT_OPERATIONS_ICONS[0]?.description || "Current operations",
    label: "Current operations",
  })

  // Icon 2: Land use (different for historical-ag scenario s0011)
  if (scenarioId === "s0011") {
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

  // Icon 3: TUCP status (without TUCPs for s0021 and s0023)
  if (scenarioId === "s0021" || scenarioId === "s0023") {
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
 * Configuration for scenario icons based on theme and ID
 */
export interface ScenarioIconConfig {
  /** Scenario theme determines which icons to show */
  theme: ScenarioTheme
  /** Scenario ID for special cases */
  scenarioId: string
  /** Whether this is a baseline scenario */
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
