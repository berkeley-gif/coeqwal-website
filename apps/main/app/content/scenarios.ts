/**
 * Scenario metadata and static content
 *
 * Labels and descriptions come from the API. This file provides
 * theme assignment and icon paths, keyed by sibling_group (the historical
 * variant's short_code). Scenarios in the same sibling_group share the
 * same theme since they represent the same strategy under different
 * hydroclimates.
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
 * Keys align with WATER_THEMES ids in content/themes.ts.
 * "unthemed" is for scenarios not yet assigned to a theme.
 */
export type ScenarioTheme =
  | "baseline"
  | "ag_gw"
  | "eco"
  | "cws"
  | "delta"
  | "unthemed"

/**
 * Local UI metadata for a sibling group (theme + icon + optional short label).
 * Labels and descriptions are provided by the API.
 */
export interface ScenarioMetadata {
  /** Scenario theme/category for visual styling */
  theme: ScenarioTheme
  /** Icon path for scenario display */
  iconPath: string
  /** Short label for compact displays (optional, falls back to API name) */
  shortLabel?: string
}

/** Enriched scenario combining API data with local metadata */
export interface Scenario {
  scenarioId: string
  shortCode: string
  isActive: boolean

  /** Display label, from API `name` */
  label: string
  /** Short summary description (1-2 sentences, from API `short_description`) */
  description: string
  /** Compact label for tight spaces (local `shortLabel` or API `name`) */
  shortLabel: string
  /** Visual theme, inferred locally from `siblingGroup` */
  theme: ScenarioTheme
  iconPath: string

  /** Hydroclimate variant ID (e.g. 2 = historical, 3 = cc50) */
  hydroclimateId: number
  /** Sibling group, same strategy under different hydroclimates */
  siblingGroup: string
}

export interface HydroclimateOption {
  value: string
  label: string
  description: string
}

/** Per-hydroclimate definition. One object per supported hydroclimate. */
export interface HydroclimateDef {
  /** Frontend string key used across the app and in share URLs, e.g. "historical" */
  value: string
  /** API hydroclimate_id returned for this climate's scenarios */
  apiId: number
  /** Full display label */
  label: string
  /** Compact label for tight UI (chips, toggle buttons, axis ticks) */
  shortLabel: string
  /** Long-form description for tooltips and info panels */
  description: string
}

/**
 * Source of truth for the hydroclimates the app supports, in
 * display order. To add a hydroclimate, add one entry here. The list,
 * the Hydroclimate type, the API id maps, and the label structures
 * below all derive from this, so there is one place to edit.
 *
 * apiId must match the numeric hydroclimate_id the API returns for this
 * climate's scenarios. See the "Add a hydroclimate" guide in the
 * scenario explorer README.
 */
export const HYDROCLIMATE_DEFS = [
  {
    value: "historical",
    apiId: 2,
    label: "Historical",
    shortLabel: "Historical",
    description:
      "Temperature, precipitation, and streamflow patterns reflect historical conditions",
  },
  {
    value: "cc50",
    apiId: 3,
    label: "Moderate-dry climate risk",
    shortLabel: "Moderate risk",
    description:
      "50th percentile level of concern: warmer and slightly drier conditions (\u22121% runoff change)",
  },
  {
    value: "cc95",
    apiId: 4,
    label: "High climate risk",
    shortLabel: "High risk",
    description:
      "95th percentile level of concern: warmer and much drier conditions (\u22127% runoff change)",
  },
] as const satisfies readonly HydroclimateDef[]

/** A supported hydroclimate value, for example "historical". */
export type Hydroclimate = (typeof HYDROCLIMATE_DEFS)[number]["value"]

/**
 * Maps a tuple of definition objects to the tuple of their `value`
 * fields, preserving length and order. The generic array constraint is
 * what makes this map element-wise into a fixed-length tuple rather
 * than a plain array, so `HYDROCLIMATES` can be destructured
 * positionally.
 */
type ValuesOf<T extends readonly { value: string }[]> = {
  readonly [K in keyof T]: T[K]["value"]
}

/** List of supported hydroclimate values, in display order. */
export const HYDROCLIMATES = HYDROCLIMATE_DEFS.map(
  (d) => d.value,
) as unknown as ValuesOf<typeof HYDROCLIMATE_DEFS>

/**
 * Maps frontend hydroclimate values to API hydroclimate_id numbers.
 * Derived from HYDROCLIMATE_DEFS.
 */
export const HYDROCLIMATE_ID_MAP: Record<string, number> = Object.fromEntries(
  HYDROCLIMATE_DEFS.map((d) => [d.value, d.apiId] as const),
)

/** Reverse lookup: API hydroclimate_id to frontend string value */
export const HYDROCLIMATE_LABEL_MAP: Record<number, string> =
  Object.fromEntries(HYDROCLIMATE_DEFS.map((d) => [d.apiId, d.value] as const))

/** All supported hydroclimate values. Alias of HYDROCLIMATES. */
export const ALL_HYDROCLIMATES: readonly string[] = HYDROCLIMATES

export interface OperationIcon {
  path: string
  alt: string
  description: string
  label: string
}

// =============================================================================
// Scenario Metadata (keyed by sibling_group / historical scenario ID)
// =============================================================================

/**
 * Theme and icon metadata for each sibling group.
 *
 * Keyed by the sibling_group value from the API, which is the historical
 * variant's short_code. All scenarios in a sibling group share the same
 * theme. Labels and descriptions come from the API directly.
 */
export const scenarioMetadata: Record<string, ScenarioMetadata> = {
  // ---------------------------------------------------------------------------
  // BASELINE SCENARIOS
  // ---------------------------------------------------------------------------
  s0011: {
    theme: "baseline",
    iconPath: "/images/icons/land_use_prev.svg",
    shortLabel: "Historical ag land use",
  },
  s0020: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Current ops",
  },
  s0021: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Without TUCPs",
  },
  s0023: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "2024 BiOps (no TUCPs)",
  },
  s0024: {
    theme: "baseline",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "2024 BiOps",
  },

  // ---------------------------------------------------------------------------
  // FARMS SCENARIOS - SGMA and groundwater management
  // ---------------------------------------------------------------------------
  s0025: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    shortLabel: "SGMA: SJ pumping",
  },
  s0026: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    shortLabel: "SGMA: SJ reduced ag",
  },
  s0027: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    shortLabel: "SGMA: CV pumping",
  },
  s0028: {
    theme: "ag_gw",
    iconPath: "/images/icons/groundwater.svg",
    shortLabel: "SGMA: CV reduced ag",
  },

  // ---------------------------------------------------------------------------
  // RIVERS SCENARIOS - Environmental and ecosystem-focused flow changes
  // ---------------------------------------------------------------------------
  s0029: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "Functional flows",
  },
  s0030: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "No flow req.",
  },
  s0031: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "Salmon flows",
  },
  s0032: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "Func. flows + reduced ag",
  },
  s0033: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "Salmon flows + reduced ag",
  },
  s0046: {
    theme: "eco",
    iconPath: "/images/icons/environmental.svg",
    shortLabel: "Func. flows (v2)",
  },

  // ---------------------------------------------------------------------------
  // CWS SCENARIOS - Prioritizing municipal and industrial water deliveries
  // ---------------------------------------------------------------------------
  s0035: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "CWS priority: HHS level",
  },
  s0036: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "CWS priority: functional level",
  },
  s0037: {
    theme: "cws",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "CWS priority: full contract",
  },

  // ---------------------------------------------------------------------------
  // DELTA SCENARIOS - Delta operations, conveyance, and regulatory changes
  // ---------------------------------------------------------------------------
  s0039: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Alt 3: 65% unimp.",
  },
  s0040: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Alt 3: 35% unimp.",
  },
  s0041: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Alt 3: 45% unimp.",
  },
  s0042: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Alt 3: 55% unimp.",
  },
  s0044: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "Shasta +20% carryover",
  },
  s0045: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "No fall X2",
  },
  s0065: {
    theme: "delta",
    iconPath: "/images/icons/current_ops.svg",
    shortLabel: "DWR 2025 DCP",
  },
}

/** Default metadata for scenarios whose sibling_group is not in the map */
const DEFAULT_METADATA: ScenarioMetadata = {
  theme: "unthemed",
  iconPath: "/images/icons/current_ops.svg",
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get UI metadata for a sibling group.
 * Pass the scenario's sibling_group (not its short_code) for correct lookup
 * across all hydroclimate variants.
 */
export function getScenarioMetadata(siblingGroup: string): ScenarioMetadata {
  return scenarioMetadata[siblingGroup] ?? DEFAULT_METADATA
}

/**
 * Get theme for a sibling group.
 * Returns "unthemed" for unknown groups.
 */
export function getScenarioTheme(siblingGroup: string): ScenarioTheme {
  return scenarioMetadata[siblingGroup]?.theme ?? "unthemed"
}

/**
 * Get icon path for a sibling group
 */
export function getScenarioIconPath(siblingGroup: string): string {
  return scenarioMetadata[siblingGroup]?.iconPath ?? DEFAULT_METADATA.iconPath
}

/**
 * Get short label for a sibling group (for compact displays).
 * Returns undefined if no shortLabel is defined.
 */
export function getScenarioShortLabel(
  siblingGroup: string,
): string | undefined {
  return scenarioMetadata[siblingGroup]?.shortLabel
}

/**
 * Check if we have metadata for a sibling group
 */
export function hasScenarioMetadata(siblingGroup: string): boolean {
  return siblingGroup in scenarioMetadata
}

/**
 * Get all sibling group IDs that have metadata defined
 */
export function getKnownSiblingGroups(): string[] {
  return Object.keys(scenarioMetadata)
}

/**
 * Get all sibling groups for a theme
 */
export function getSiblingGroupsByTheme(theme: ScenarioTheme): string[] {
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

export const hydroclimateOptions: HydroclimateOption[] = HYDROCLIMATE_DEFS.map(
  ({ value, label, description }) => ({ value, label, description }),
)

/**
 * Hydroclimate labels for the discrete slider. Parallel array to
 * hydroclimateOptions, derived from HYDROCLIMATE_DEFS so it stays in
 * the same order.
 */
export const hydroclimateLabels = HYDROCLIMATE_DEFS.map((d) => d.label)

/**
 * Compact labels for hydroclimates, keyed by value. Use in tight UI like
 * chips, toggle buttons, and heatmap axis ticks where the full
 * `hydroclimateOptions[].label` is too long.
 */
export const HYDROCLIMATE_SHORT_LABELS: Record<string, string> =
  Object.fromEntries(
    HYDROCLIMATE_DEFS.map((d) => [d.value, d.shortLabel] as const),
  )

/** Full display label keyed by hydroclimate value (e.g. `"historical"` -> `"Historical"`) */
export const HYDROCLIMATE_LABELS_BY_VALUE: Record<string, string> =
  Object.fromEntries(hydroclimateOptions.map((o) => [o.value, o.label]))

/** Long-form description keyed by hydroclimate value (tooltips, info panels) */
export const HYDROCLIMATE_DESCRIPTIONS_BY_VALUE: Record<string, string> =
  Object.fromEntries(hydroclimateOptions.map((o) => [o.value, o.description]))
