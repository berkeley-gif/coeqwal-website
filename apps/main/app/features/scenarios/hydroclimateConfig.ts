"use client"

/**
 * Visual config (MUI icon + accent color) for each hydroclimate
 *
 * Imported by the chooser, badges, and icon strips. Edit here to retheme
 * a hydroclimate everywhere it appears.
 */

import type { ElementType } from "react"
import { Icon } from "@repo/ui/mdi";
import { mdiWeatherSunnyAlert} from "@repo/ui/mdi"
import { HistoryIcon, WaterDropIcon, WbSunnyIcon, LocalFireDepartmentIcon } from "@repo/ui/mui"

export interface HydroclimateVisualConfig {
  /** MUI icon component rendered inside the colored circle */
  icon: typeof Icon
  /** Accent / background color for the circle and derived shells */
  bgColor: string
}

/**
 * Neutral accent used when a hydroclimate has no entry below. Lets badges
 * render with a plain grey accent instead of disappearing, so a climate
 * registered without a visual config still shows its label.
 */
export const HYDROCLIMATE_FALLBACK_ACCENT = "#9e9e9e"

// One entry per hydroclimate. A hydroclimate without an entry still works:
// the chooser renders a plain circle for it and badges fall back gracefully.
// Add an entry to give a new climate its own icon and accent color.
export const HYDROCLIMATE_CONFIG: Record<string, HydroclimateVisualConfig> = {
  historical: {
    icon: HistoryIcon,
    bgColor: "#2d89b7",
  },
  ecv: {
    icon: WaterDropIcon,
    bgColor: "#30e8ae",
  },
  cc50: {
    icon: WbSunnyIcon,
    bgColor: "#e8d930",
  },
  cc95: {
    icon: WbSunnyIcon,
    bgColor: "#e89830",
  },
  tai: {
    icon: mdiWeatherSunnyAlert,
    bgColor: "#c62828",
  },
}