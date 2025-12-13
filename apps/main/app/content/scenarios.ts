// ============================================================================
// STRATEGY DEFINITIONS
// ============================================================================
// Strategies are grouped by theme for easier understanding

// Strategy options with descriptions
export const strategies = [
  // -------------------------------------------------------------------------
  // BASELINE STRATEGIES - Current operations under different regulatory frameworks
  // -------------------------------------------------------------------------
  {
    value: "current-ops",
    label: "Current operations",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, and allows for TUCPs.",
    theme: "baseline",
    scenarioId: "s0020",
  },
  {
    value: "current-ops-wo-tucp",
    label: "Current operations without TUCPs",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, but does not allow TUCPs.",
    theme: "baseline",
    scenarioId: "s0021",
  },
  {
    value: "current-ops-historical-ag",
    label: "Current operations with historical agricultural land use",
    description:
      "This strategy reflects current operations, includes TUCPs, but represents 2004-2013 agricultural land use. This operational strategy is useful for understanding how recent changes in land use affect agricultural water demands and statewide water allocations.",
    theme: "baseline",
    scenarioId: "s0011",
  },
  {
    value: "usbr-2024-wo-tucp",
    label: "2024 USBR BiOps without TUCPs",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use. TUCPs are not active. This scenario reflects the latest federal biological opinions and updated land use data.",
    theme: "baseline",
    scenarioId: "s0023",
  },
  {
    value: "usbr-2024",
    label: "2024 USBR BiOps",
    description:
      "Updated baseline scenario using 2024 USBR Proposed Action (Alt2V1) with 2020 LandIQ land use and TUCPs active. Analogous to USBR's Alt2V1 with DWR's adjusted historical hydroclimate and updated land use.",
    theme: "baseline",
    scenarioId: "s0024",
  },

  // -------------------------------------------------------------------------
  // GROUNDWATER STRATEGIES - SGMA implementation scenarios
  // -------------------------------------------------------------------------
  {
    value: "sgma-sj-valley",
    label: "SGMA: San Joaquin Valley limits",
    description:
      "Groundwater pumping limits applied to the San Joaquin Valley region, reflecting potential SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    theme: "groundwater",
    scenarioId: "s0025",
  },
  {
    value: "sgma-central-valley",
    label: "SGMA: Central Valley limits",
    description:
      "Groundwater pumping limits applied across the entire Central Valley, reflecting comprehensive SGMA sustainability requirements. Based on current operations (s0020) with 2020 LandIQ land use and TUCPs active.",
    theme: "groundwater",
    scenarioId: "s0027",
  },

  // -------------------------------------------------------------------------
  // ENVIRONMENTAL STRATEGIES - Flow and ecosystem-focused scenarios
  // -------------------------------------------------------------------------
  {
    value: "functional-flows",
    label: "Functional flows",
    description:
      "Environmental flows scenario implementing functional flow requirements on tributaries and the Delta. Uses 2020 LandIQ land use to explore how enhanced environmental flow protections affect water allocation and ecosystem outcomes.",
    theme: "environmental",
    scenarioId: "s0029",
  },
]

// Strategy definitions for the definition panel with operations icons
export const strategyDefinitions = [
  // Baseline strategies
  {
    id: "current-ops",
    label: "Current operations",
    description:
      "This operational strategy shows how California manages water today, including the laws, regulations, priorities, and decisions that affect how California's water supply is allocated. It includes Temporary Urgent Change Petitions (TUCPs), which allow changes during droughts to meet human health and safety needs and protect endangered species.",
    iconPath: "/images/icons/current_ops.svg",
    theme: "baseline",
  },
  {
    id: "current-ops-wo-tucp",
    label: "Without TUCPs",
    description:
      "Operations without Temporary Urgent Change Petitions (TUCPs), which allow changes during droughts to meet human health and safety needs and protect endangered species.",
    iconPath: "/images/icons/no_tucp.svg",
    theme: "baseline",
  },
  {
    id: "current-ops-historical-ag",
    label: "Historical agricultural land use",
    description:
      "Current operations with historical agricultural land use patterns based on 2004-2013 mapping, showing how recent land use changes affect water demands and allocations.",
    iconPath: "/images/icons/land_use_prev.svg",
    theme: "baseline",
  },
  {
    id: "usbr-2024-wo-tucp",
    label: "2024 USBR BiOps (no TUCPs)",
    description:
      "Updated baseline using 2024 USBR Proposed Action biological opinions with 2020 land use data. TUCPs are not active in this scenario.",
    iconPath: "/images/icons/no_tucp.svg",
    theme: "baseline",
  },
  {
    id: "usbr-2024",
    label: "2024 USBR BiOps",
    description:
      "Updated baseline using 2024 USBR Proposed Action biological opinions with 2020 land use data and TUCPs active.",
    iconPath: "/images/icons/current_ops.svg",
    theme: "baseline",
  },
  // Groundwater strategies
  {
    id: "sgma-sj-valley",
    label: "SGMA: SJ Valley",
    description:
      "Groundwater pumping limits applied to the San Joaquin Valley region, reflecting SGMA sustainability requirements.",
    iconPath: "/images/icons/land_use.svg", // TODO: Add SGMA-specific icon
    theme: "groundwater",
  },
  {
    id: "sgma-central-valley",
    label: "SGMA: Central Valley",
    description:
      "Groundwater pumping limits applied across the entire Central Valley, reflecting comprehensive SGMA sustainability requirements.",
    iconPath: "/images/icons/land_use.svg", // TODO: Add SGMA-specific icon
    theme: "groundwater",
  },
  // Environmental strategies
  {
    id: "functional-flows",
    label: "Functional flows",
    description:
      "Environmental flows scenario with functional flow requirements on tributaries and the Delta to support ecosystem health.",
    iconPath: "/images/icons/current_ops.svg", // TODO: Add environmental flow icon
    theme: "environmental",
  },
]

// Hydroclimate options
export const hydroclimateOptions = [
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

// Hydroclimate labels for the discrete slider
export const hydroclimateLabels = [
  "Historical",
  "Warmer Wetter",
  "Warmer Drier I",
  "Warmer Drier II",
  "Warmer Drier III",
  "Warmer Drier IV",
]
