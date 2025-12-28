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

/** Scenario theme for visual categorization */
export type ScenarioTheme = "baseline" | "groundwater" | "environmental"

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
    iconPath: "/images/icons/no_tucp.svg",
    label: "Current operations without TUCPs",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, but does not allow TUCPs.",
    shortLabel: "Without TUCPs",
  },
  s0023: {
    theme: "baseline",
    iconPath: "/images/icons/no_tucp.svg",
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
  // GROUNDWATER SCENARIOS - SGMA implementation scenarios
  // ---------------------------------------------------------------------------
  s0025: {
    theme: "groundwater",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: San Joaquin Valley limits",
    description:
      "Groundwater pumping limits applied to the San Joaquin Valley region, reflecting potential SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "SGMA: SJ Valley",
  },
  s0027: {
    theme: "groundwater",
    iconPath: "/images/icons/groundwater.svg",
    label: "SGMA: Central Valley limits",
    description:
      "Groundwater pumping limits applied across the entire Central Valley, reflecting comprehensive SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    shortLabel: "SGMA: Central Valley",
  },

  // ---------------------------------------------------------------------------
  // ENVIRONMENTAL SCENARIOS - Flow and ecosystem-focused scenarios
  // ---------------------------------------------------------------------------
  s0029: {
    theme: "environmental",
    iconPath: "/images/icons/environmental.svg",
    label: "Functional flows",
    description:
      "Environmental flows scenario implementing functional flow requirements on tributaries and the Delta. Uses 2020 LandIQ land use to explore how enhanced environmental flow protections affect water allocation and ecosystem outcomes.",
    shortLabel: "Functional flows",
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
      "Based on historical climate patterns from the observational record. This represents the baseline climate conditions used for comparison with future projections.",
  },
  {
    value: "warmer-wetter",
    label: "Warmer Wetter",
    description:
      "Climate scenario with increased temperatures and higher precipitation. This represents a future where California experiences warmer conditions with more rainfall and snowpack.",
  },
  {
    value: "warmer-drier-i",
    label: "Warmer Drier I",
    description:
      "Moderate warming and drying scenario. Represents initial stages of climate change impacts with reduced precipitation and increased temperatures.",
  },
  {
    value: "warmer-drier-ii",
    label: "Warmer Drier II",
    description:
      "Intermediate warming and drying scenario. More pronounced climate change effects with further reductions in water availability.",
  },
  {
    value: "warmer-drier-iii",
    label: "Warmer Drier III",
    description:
      "Advanced warming and drying scenario. Significant climate change impacts with substantial reductions in precipitation and increased evapotranspiration.",
  },
  {
    value: "warmer-drier-iv",
    label: "Warmer Drier IV",
    description:
      "Extreme warming and drying scenario. Most severe climate change projection with dramatic reductions in water resources and increased temperature stress.",
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
