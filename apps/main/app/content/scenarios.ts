/**
 * Scenario metadata and static content
 *
 * This file provides UI-specific metadata (themes, icons, user-friendly labels)
 * for scenarios. The API provides technical details (scenario IDs, short codes).
 *
 * Use useScenarioList() hook to get enriched scenario data that combines
 * API data with this local metadata.
 *
 * All identifiers use scenario_id (e.g., "s0020")
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Scenario theme for visual categorization.
 * Keys align with WATER_THEMES ids in packages/data/src/coeqwal/themes.ts.
 */
export type ScenarioTheme = "baseline" | "ag_gw" | "eco" | "cws" | "delta"

/** UI metadata for a scenario (not available from API) */
export interface ScenarioMetadata {
  /** Scenario theme/category for visual styling */
  theme: ScenarioTheme
  /** Icon path for scenario display */
  iconPath: string
  /** User-friendly display label (e.g., "Current operations") */
  label: string
  /** User-friendly full description for display */
  description: string
  /** Short label for compact displays (optional, falls back to label) */
  shortLabel?: string
}

/** Enriched scenario combining API data with local metadata */
export interface Scenario {
  // Identity
  scenarioId: string // e.g., "s0020"
  shortCode: string // e.g., "s0020_DCRadjBL_2020LU_wTUCP"
  isActive: boolean

  // User-friendly content (from local metadata)
  label: string
  description: string
  shortLabel: string
  theme: ScenarioTheme
  iconPath: string

  // Technical content (from API, for reference)
  apiName: string
  apiShortTitle: string
  apiDescription: string
}

export interface HydroclimateOption {
  value: string
  label: string
  description: string
}

export interface OperationIcon {
  path: string
  alt: string
  description: string
  label: string
}

// =============================================================================
// Scenario Metadata (keyed by scenario_id)
// =============================================================================

/**
 * Static UI metadata for each scenario, indexed by scenario_id
 *
 * This is the ONLY place to define user-friendly labels, descriptions,
 * themes, and icons. The API provides technical details only.
 */
export const scenarioMetadata: Record<string, ScenarioMetadata> = {
  // ---------------------------------------------------------------------------
  // BASELINE SCENARIOS - Current operations under different regulatory frameworks
  // ---------------------------------------------------------------------------
  s0011: {
    theme: "baseline",
    iconPath: "/images/icons/land_use_prev.svg",
    label: "Current operations with historical agricultural land use",
    description:
      "This strategy reflects current operations, includes TUCPs, but represents 2004-2013 agricultural land use. This operational strategy is useful for understanding how recent changes in land use affect agricultural water demands and statewide water allocations.",
    shortLabel: "Historical ag land use",
  },
  s0020: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    label: "Current operations",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, and allows for TUCPs.",
    shortLabel: "Current ops",
  },
  s0021: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    label: "Current operations without TUCPs",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, but does not allow TUCPs.",
    shortLabel: "Without TUCPs",
  },
  s0023: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    label: "2024 USBR BiOps without TUCPs",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use. TUCPs are not active. This scenario reflects the latest federal biological opinions and updated land use data.",
    shortLabel: "2024 BiOps (no TUCPs)",
  },
  s0024: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    label: "2024 USBR BiOps",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use and TUCPs active. Analogous to USBR's Alt2V1 with DWR's adjusted historical hydroclimate and updated land use.",
    shortLabel: "2024 BiOps",
  },

  // ---------------------------------------------------------------------------
  // FARMS SCENARIOS - SGMA and groundwater management scenarios
  // ---------------------------------------------------------------------------
  s0025: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: San Joaquin Valley pumping limits",
    description:
      "Groundwater pumping limits applied to the San Joaquin Valley region, reflecting potential SGMA sustainability requirements. Based on current operations with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "SGMA: SJ pumping",
  },
  s0026: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: San Joaquin Valley reduced acreage",
    description:
      "Reduced agricultural acreage to improve groundwater conditions in the San Joaquin Valley. Uses SGMA-adjusted land use to explore how land fallowing affects groundwater sustainability and water allocations.",
    shortLabel: "SGMA: SJ reduced ag",
  },
  s0027: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: Central Valley pumping limits",
    description:
      "Groundwater pumping limits applied across the entire Central Valley, reflecting comprehensive SGMA sustainability requirements. Based on current operations with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "SGMA: CV pumping",
  },
  s0028: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: Central Valley reduced acreage",
    description:
      "Reduced agricultural acreage to improve groundwater conditions across the entire Central Valley. Uses SGMA-adjusted land use with TUCPs active to explore how land fallowing affects groundwater sustainability.",
    shortLabel: "SGMA: CV reduced ag",
  },

  // ---------------------------------------------------------------------------
  // RIVERS SCENARIOS - Environmental and ecosystem-focused flow changes
  // ---------------------------------------------------------------------------
  s0029: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "Functional flows",
    description:
      "Functional flow requirements at 17 tributary and Delta outflow points. Uses 2020 LandIQ land use to explore how enhanced environmental flow protections affect water allocation and ecosystem outcomes.",
    shortLabel: "Functional flows",
  },
  s0030: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "No flow requirements",
    description:
      "Removes minimum flow requirements in the Central Valley to explore impacts on water supply and ecosystem outcomes. Uses 2020 LandIQ land use.",
    shortLabel: "No flow req.",
  },
  s0031: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "Salmon-friendly flows",
    description:
      "Salmon-friendly flow requirements and Shasta storage protection to support salmon lifecycle needs. Uses 2020 LandIQ land use.",
    shortLabel: "Salmon flows",
  },
  s0032: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "Functional flows with reduced ag acreage",
    description:
      "Combines functional flow requirements with reduced Central Valley agricultural acreage, exploring how both changes interact to affect water allocation and ecosystem outcomes.",
    shortLabel: "Func. flows + reduced ag",
  },
  s0033: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "Salmon-friendly flows with reduced ag acreage",
    description:
      "Combines salmon-friendly flow requirements on the Sacramento River with reduced Central Valley agricultural acreage (from s0028), exploring how both changes interact to support salmon and offset reservoir drawdown.",
    shortLabel: "Salmon flows + reduced ag",
  },
  s0046: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    label: "Functional flows (variant)",
    description:
      "Variation of functional flows that removes the downstream Sac, SJR, and Delta flow requirements.",
    shortLabel: "Func. flows (v2)",
  },

  // ---------------------------------------------------------------------------
  // CWS SCENARIOS - Prioritizing municipal and industrial water deliveries
  // ---------------------------------------------------------------------------
  s0035: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    label: "Priority deliveries to community water systems: health and human safety level",
    description:
      "CVP and SWP surface supplies are reallocated to prioritize M&I contractors at health and human safety (HHS) delivery levels. CVP agricultural contracts are assigned lower priority to accommodate M&I deliveries. Based on current operations with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "CWS priority: HHS level",
  },
  s0036: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    label: "Priority deliveries to community water systems: functional level",
    description:
      "CVP and SWP surface supplies are reallocated to prioritize M&I contractors at a functional delivery level (70% of maximum contract entitlement). CVP agricultural contracts are assigned lower priority. Based on current operations with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "CWS priority: functional level",
  },
  s0037: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    label: "Priority deliveries to community water systems: full contract level",
    description:
      "CVP and SWP surface supplies are reallocated to prioritize M&I contractors at full contract entitlement levels. CVP agricultural contracts are assigned lower priority. Based on current operations with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "CWS priority: full contract",
  },

  // ---------------------------------------------------------------------------
  // DELTA SCENARIOS - Delta operations, conveyance, and regulatory changes
  // ---------------------------------------------------------------------------
  s0039: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "USBR Alt 3: 65% unimpaired Delta outflow",
    description:
      "USBR Alternative 3 with allocation reductions and 65% unimpaired Delta outflow requirement. Explores how higher environmental flow commitments affect water supply.",
    shortLabel: "Alt 3: 65% unimp.",
  },
  s0040: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "USBR Alt 3: 35% unimpaired Delta outflow",
    description:
      "USBR Alternative 3 with allocation reductions and 35% unimpaired Delta outflow requirement. Lower environmental flow commitment compared to other Alt 3 variants.",
    shortLabel: "Alt 3: 35% unimp.",
  },
  s0041: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "USBR Alt 3: 45% unimpaired Delta outflow",
    description:
      "USBR Alternative 3 with allocation reductions and 45% unimpaired Delta outflow requirement.",
    shortLabel: "Alt 3: 45% unimp.",
  },
  s0042: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "USBR Alt 3: 55% unimpaired Delta outflow",
    description:
      "USBR Alternative 3 with allocation reductions and 55% unimpaired Delta outflow requirement.",
    shortLabel: "Alt 3: 55% unimp.",
  },
  s0044: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "Increased Shasta carryover target",
    description:
      "Increases Shasta Reservoir carryover storage target by 20% compared to current operations, exploring how higher reservoir storage requirements affect downstream allocations.",
    shortLabel: "Shasta +20% carryover",
  },
  s0045: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "No fall X2 salinity requirement",
    description:
      "Removes the fall X2 salinity standard in the Delta, exploring how relaxing this requirement affects Delta outflows and upstream water allocations.",
    shortLabel: "No fall X2",
  },
  s0065: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    label: "DWR 2025 Delta Conveyance Project",
    description:
      "DWR's 2025 Delta Conveyance Project scenario with 2020 LandIQ land use and voluntary agreements (Healthy Rivers and Landscapes), exploring how new Delta infrastructure affects water supply and ecosystem outcomes.",
    shortLabel: "DWR 2025 DCP",
  },
}

/** Default metadata for scenarios not in the lookup */
const DEFAULT_METADATA: ScenarioMetadata = {
  theme: "baseline",
  iconPath: "/images/icons/current_ops.svg",
  label: "Unknown scenario",
  description: "No description available",
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get UI metadata for a scenario by its scenario_id
 * Returns default metadata if scenario not found
 */
export function getScenarioMetadata(scenarioId: string): ScenarioMetadata {
  return scenarioMetadata[scenarioId] ?? DEFAULT_METADATA
}

/**
 * Get theme for a scenario
 */
export function getScenarioTheme(scenarioId: string): ScenarioTheme {
  return scenarioMetadata[scenarioId]?.theme ?? "baseline"
}

/**
 * Get icon path for a scenario
 */
export function getScenarioIconPath(scenarioId: string): string {
  return scenarioMetadata[scenarioId]?.iconPath ?? DEFAULT_METADATA.iconPath
}

/**
 * Get user-friendly label for a scenario
 */
export function getScenarioLabel(scenarioId: string): string {
  return scenarioMetadata[scenarioId]?.label ?? DEFAULT_METADATA.label
}

/**
 * Get user-friendly description for a scenario
 */
export function getScenarioDescription(scenarioId: string): string {
  return (
    scenarioMetadata[scenarioId]?.description ?? DEFAULT_METADATA.description
  )
}

/**
 * Get short label for a scenario (for compact displays)
 * Falls back to label if no shortLabel defined
 */
export function getScenarioShortLabel(scenarioId: string): string {
  const meta = scenarioMetadata[scenarioId]
  return meta?.shortLabel ?? meta?.label ?? DEFAULT_METADATA.label
}

/**
 * Check if we have metadata for a scenario
 */
export function hasScenarioMetadata(scenarioId: string): boolean {
  return scenarioId in scenarioMetadata
}

/**
 * Get all scenario IDs that have metadata defined
 */
export function getKnownScenarioIds(): string[] {
  return Object.keys(scenarioMetadata)
}

/**
 * Get all scenarios for a theme
 */
export function getScenarioIdsByTheme(theme: ScenarioTheme): string[] {
  return Object.entries(scenarioMetadata)
    .filter(([, meta]) => meta.theme === theme)
    .map(([id]) => id)
}

// =============================================================================
// Operations Icons
// =============================================================================

/** Icons for current operations scenario display */
export const CURRENT_OPERATIONS_ICONS: OperationIcon[] = [
  {
    path: "/images/icons/current_ops.svg",
    alt: "Current operations",
    description:
      "Represents how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated.",
    label: "Current operations",
  },
  {
    path: "/images/icons/land_use.svg",
    alt: "Current land use considerations",
    description: "Current land use considerations",
    label: "Updated agricultural land use (2020)",
  },
  {
    path: "/images/icons/tucp.svg",
    alt: "TUCP considerations",
    description:
      "Temporary Urgent Change Petitions (TUCPs, also known as TUCOs) permit changes during droughts to meet human health and safety needs and protect endangered species.",
    label: "TUCP's\nallowed",
  },
]

// =============================================================================
// Hydroclimate options
// =============================================================================

export const hydroclimateOptions: HydroclimateOption[] = [
  {
    value: "historical",
    label: "Historical",
    description:
      "Historical temperature and precipitation over CV inflow basins according to a 100-year observational record",
  },
  {
    value: "warmer-wetter",
    label: "Warmer & Wetter",
    description:
      "1.2\u00B0C temperature increase and 4% precipitation increase, based on 30-year mean values (2028\u20132057 vs. 1992\u20132021) over CV inflow basins",
  },
  {
    value: "warmer-drier-i",
    label: "Warmer & Drier I",
    description:
      "1.5\u00B0C temperature increase and 3% precipitation decrease, based on 30-year mean values (2028\u20132057 vs. 1992\u20132021) over CV inflow basins",
  },
  {
    value: "warmer-drier-ii",
    label: "Warmer & Drier II",
    description:
      "1.8\u00B0C temperature increase and 9% precipitation decrease, based on 30-year mean values (2028\u20132057 vs. 1992\u20132021) over CV inflow basins",
  },
  {
    value: "warmer-drier-iii",
    label: "Warmer & Drier III",
    description:
      "1.9\u00B0C temperature increase and 7% precipitation decrease, based on 30-year mean values (2028\u20132057 vs. 1992\u20132021) over CV inflow basins",
  },
  {
    value: "warmer-drier-iv",
    label: "Warmer & Drier IV",
    description:
      "1.4\u00B0C temperature increase and 12% precipitation decrease, based on 30-year mean values (2028\u20132057 vs. 1992\u20132021) over CV inflow basins",
  },
]

/** Hydroclimate labels for the discrete slider */
export const hydroclimateLabels = [
  "Historical",
  "Warmer Wetter",
  "Warmer Drier I",
  "Warmer Drier II",
  "Warmer Drier III",
  "Warmer Drier IV",
]
