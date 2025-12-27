/**
 * Strategy and scenario definitions
 *
 * Unified data source for all strategy/scenario information.
 * TODO: Group by theme: baseline, groundwater, environmental (just stubbed in for now)
 */

// =============================================================================
// Types
// =============================================================================

export type StrategyTheme = "baseline" | "groundwater" | "environmental"

export interface Strategy {
  /** Unique identifier (e.g., "current-ops") */
  value: string
  /** Display label */
  label: string
  /** Full description of the strategy */
  description: string
  /** Strategy theme/category */
  theme: StrategyTheme
  /** API scenario ID (e.g., "s0020") */
  scenarioId: string
  /** Icon path for strategy display */
  iconPath: string
  /** Short label for compact displays (optional, defaults to label) */
  shortLabel?: string
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
// Strategy definitions
// =============================================================================

/**
 * All available strategies with full metadata
 */
export const strategies: Strategy[] = [
  // ---------------------------------------------------------------------------
  // BASELINE STRATEGIES - Current operations under different regulatory frameworks
  // ---------------------------------------------------------------------------
  {
    value: "current-ops",
    label: "Current operations",
    shortLabel: "Current ops",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, and allows for TUCPs.",
    theme: "baseline",
    scenarioId: "s0020",
    iconPath: "/images/icons/current_ops.svg",
  },
  {
    value: "current-ops-wo-tucp",
    label: "Current operations without TUCPs",
    shortLabel: "Without TUCPs",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, but does not allow TUCPs.",
    theme: "baseline",
    scenarioId: "s0021",
    iconPath: "/images/icons/no_tucp.svg",
  },
  {
    value: "current-ops-historical-ag",
    label: "Current operations with historical agricultural land use",
    shortLabel: "Historical ag land use",
    description:
      "This strategy reflects current operations, includes TUCPs, but represents 2004-2013 agricultural land use. This operational strategy is useful for understanding how recent changes in land use affect agricultural water demands and statewide water allocations.",
    theme: "baseline",
    scenarioId: "s0011",
    iconPath: "/images/icons/land_use_prev.svg",
  },
  {
    value: "usbr-2024-wo-tucp",
    label: "2024 USBR BiOps without TUCPs",
    shortLabel: "2024 BiOps (no TUCPs)",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use. TUCPs are not active. This scenario reflects the latest federal biological opinions and updated land use data.",
    theme: "baseline",
    scenarioId: "s0023",
    iconPath: "/images/icons/no_tucp.svg",
  },
  {
    value: "usbr-2024",
    label: "2024 USBR BiOps",
    shortLabel: "2024 BiOps",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use and TUCPs active. Analogous to USBR's Alt2V1 with DWR's adjusted historical hydroclimate and updated land use.",
    theme: "baseline",
    scenarioId: "s0024",
    iconPath: "/images/icons/current_ops.svg",
  },

  // ---------------------------------------------------------------------------
  // GROUNDWATER STRATEGIES - SGMA implementation scenarios
  // ---------------------------------------------------------------------------
  {
    value: "sgma-sj-valley",
    label: "SGMA: San Joaquin Valley limits",
    shortLabel: "SGMA: SJ Valley",
    description:
      "Groundwater pumping limits applied to the San Joaquin Valley region, reflecting potential SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    theme: "groundwater",
    scenarioId: "s0025",
    iconPath: "/images/icons/groundwater.svg",
  },
  {
    value: "sgma-central-valley",
    label: "SGMA: Central Valley limits",
    shortLabel: "SGMA: Central Valley",
    description:
      "Groundwater pumping limits applied across the entire Central Valley, reflecting comprehensive SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    theme: "groundwater",
    scenarioId: "s0027",
    iconPath: "/images/icons/groundwater.svg",
  },

  // ---------------------------------------------------------------------------
  // ENVIRONMENTAL STRATEGIES - Flow and ecosystem-focused scenarios
  // ---------------------------------------------------------------------------
  {
    value: "functional-flows",
    label: "Functional flows",
    shortLabel: "Functional flows",
    description:
      "Environmental flows scenario implementing functional flow requirements on tributaries and the Delta. Uses 2020 LandIQ land use to explore how enhanced environmental flow protections affect water allocation and ecosystem outcomes.",
    theme: "environmental",
    scenarioId: "s0029",
    iconPath: "/images/icons/environmental.svg",
  },
]

// =============================================================================
// Helper Functions
// =============================================================================

/** Get a strategy by its value/id */
export function getStrategy(value: string): Strategy | undefined {
  return strategies.find((s) => s.value === value)
}

/** Get a strategy by its scenario ID */
export function getStrategyByScenarioId(scenarioId: string): Strategy | undefined {
  return strategies.find((s) => s.scenarioId === scenarioId)
}

/** Get all strategies for a theme */
export function getStrategiesByTheme(theme: StrategyTheme): Strategy[] {
  return strategies.filter((s) => s.theme === theme)
}

// =============================================================================
// Operations Icons
// =============================================================================

/** Icons for current operations strategy display */
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

