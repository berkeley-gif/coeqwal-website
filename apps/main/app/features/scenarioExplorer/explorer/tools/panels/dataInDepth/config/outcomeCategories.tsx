/**
 * Outcome category icons (JSX) for the Data Explorer accordion.
 *
 * Pairs the icon-free `outcomeCategoryMeta` (the single source of truth for
 * category ids and names, in `outcomeDefinitions.ts`) with the MUI / custom
 * icon for each category. Kept in a `.tsx` so the pure config stays free of
 * React and the icon set.
 */

import React from "react"
import {
  HomeIcon,
  AgricultureIcon,
  ScienceIcon,
  WaterDropIcon,
  WavesIcon,
} from "@repo/ui/mui"
import { Salmon, EnvironmentalRefuge } from "@repo/ui"
import {
  outcomeCategoryMeta,
  type OutcomeCategoryMeta,
} from "./outcomeDefinitions"

/** Icon for each category id. */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "community-water": <HomeIcon fontSize="small" />,
  "agricultural-water": <AgricultureIcon fontSize="small" />,
  "env-flow-statistics": <WavesIcon fontSize="small" />,
  "environmental-water": <EnvironmentalRefuge />,
  "delta-salinity": <ScienceIcon fontSize="small" />,
  "reservoir-storage": <WaterDropIcon fontSize="small" />,
  "groundwater-storage": <WaterDropIcon fontSize="small" />,
  "salmon-abundance": <Salmon />,
}

export interface OutcomeCategory extends OutcomeCategoryMeta {
  icon: React.ReactNode
}

/** Category metadata with icons, in display order. */
export const outcomeCategories: OutcomeCategory[] = outcomeCategoryMeta.map(
  (meta) => ({ ...meta, icon: CATEGORY_ICONS[meta.id] }),
)
