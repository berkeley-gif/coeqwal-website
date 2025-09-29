// Strategy options with descriptions
export const strategies = [
  {
    value: "current-ops",
    label: "Current operational strategy",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, and allows for TUCPs.",
  },
  {
    value: "current-ops-wo-tucp",
    label: "Current operational strategy without TUCP's",
    description:
      "This strategy reflects existing operational rules, infrastructure constraints, and regulatory requirements for water allocation, but does not allow TUCPs.",
  },
]

// Strategy definitions for the definition panel with icons
export const strategyDefinitions = [
  {
    id: "current-ops",
    label: "Current operations",
    description:
      "This operational strategy shows how California manages water today, including the laws, regulations, priorities, and decisions that affect how California’s water supply is allocated. It includes Temporary Urgent Change Petitions (TUCPs), which allow changes during droughts to meet human health and safety needs and protect endangered species.",
    iconPath: "/images/icons/current_ops.svg",
  },
  {
    id: "current-ops-wo-tucp",
    label: "Without TUCP's",
    description:
      "Operations without Temporary Urgent Change Petitions (TUCPs), which allow changes during droughts to meet human health and safety needs and protect endangered species.",
    iconPath: "/images/icons/no_tucp.svg",
  },
]

// Hydroclimate options from the original ScenarioExplorer slider
export const hydroclimateOptions = [
  {
    value: "warmer-wetter",
    label: "Warmer Wetter",
    description:
      "Climate scenario with increased temperatures and higher precipitation. This represents a future where California experiences warmer conditions with more rainfall and snowpack.",
  },
  {
    value: "historical",
    label: "Historical",
    description:
      "Based on historical climate patterns from the observational record. This represents the baseline climate conditions used for comparison with future projections.",
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
  "Warmer Wetter",
  "Historical",
  "Warmer Drier I",
  "Warmer Drier II",
  "Warmer Drier III",
  "Warmer Drier IV",
]
