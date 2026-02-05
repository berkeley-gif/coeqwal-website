/**
 * Scenario icons - Shared utilities for icon sizing
 *
 * Icon definitions and rendering are now in opsIcons.tsx.
 * This file retains only the icon sizing utility used by OperationsIconGroup.
 */

import type { ScenarioTheme } from "../../../../content/scenarios"

// ============================================================================
// Types
// ============================================================================

export interface ScenarioIcon {
  path: string
  alt: string
  description: string
  label: string
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

// ============================================================================
// Icon Sizing
// ============================================================================

/**
 * Get icon size in theme spacing units
 */
export function getIconSize(size: "sm" | "md" | "lg" = "md"): {
  xs: number
  lg: number
} {
  switch (size) {
    case "sm":
      return { xs: 3.5, lg: 4 } // 28px / 32px
    case "md":
      return { xs: 4.5, lg: 5 } // 36px / 40px
    case "lg":
      return { xs: 5.5, lg: 6 } // 44px / 48px
  }
}
