"use client"

/**
 * Visual config (MUI icon + accent color) for each hydroclimate
 *
 * Imported by the chooser, badges, and icon strips. Edit here to retheme
 * a hydroclimate everywhere it appears.
 */

import type { ElementType } from "react"
import { HistoryIcon, WbSunnyIcon, LocalFireDepartmentIcon } from "@repo/ui/mui"

export interface HydroclimateVisualConfig {
  /** MUI icon component rendered inside the colored circle */
  icon: ElementType
  /** Accent / background color for the circle and derived shells */
  bgColor: string
}

export const HYDROCLIMATE_CONFIG: Record<string, HydroclimateVisualConfig> = {
  historical: {
    icon: HistoryIcon,
    bgColor: "#2d89b7",
  },
  cc50: {
    icon: WbSunnyIcon,
    bgColor: "#e89830",
  },
  cc95: {
    icon: LocalFireDepartmentIcon,
    bgColor: "#c62828",
  },
}
