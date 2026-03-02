/**
 * Theme display configuration
 *
 * Maps each ScenarioTheme to a human-readable label.
 * Keys align with WATER_THEMES ids in packages/data/src/coeqwal/themes.ts.
 */

import type { ScenarioTheme } from "./scenarios"

export interface ThemeLabelConfig {
  /** Human-readable label for display */
  label: string
}

export const THEME_LABEL_CONFIG: Record<ScenarioTheme, ThemeLabelConfig> = {
  baseline: { label: "Baseline" },
  ag_gw: { label: "Farms, groundwater & food systems" },
  eco: { label: "Rivers, salmon & ecosystems" },
  delta: { label: "The Delta as a living place" },
  cws: { label: "Community water systems" },
}

/** Active themes available for filtering */
export const ACTIVE_THEMES: ScenarioTheme[] = [
  "baseline",
  "ag_gw",
  "eco",
  "delta",
  "cws",
]
