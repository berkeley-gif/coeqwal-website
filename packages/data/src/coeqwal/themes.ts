/**
 * Themes — the COEQWAL issue areas used to organize scenarios
 */

// =============================================================================
// Types
// =============================================================================

export interface Theme {
  /** Stable identifier (e.g. "communities") */
  id: string
  /** Display label — may contain \n for line-breaks in circle layouts */
  label: string
  /** Short label for compact UI contexts (tabs, chips, dropdowns) */
  shortLabel: string
  /** One-sentence description of what this theme covers */
  description: string
}

// =============================================================================
// Themes
// =============================================================================

export const WATER_THEMES: Theme[] = [
  {
    id: "cws",
    label: "Community\nwater systems",
    shortLabel: "Community water systems",
    description:
      "Whether people and communities can reliably access safe, affordable water for daily life, health, and essential services.",
  },
  {
    id: "ag_gw",
    label: "Farms, groundwater\n& food systems",
    shortLabel: "Farms & groundwater",
    description:
      "How water availability supports food production today, while sustaining groundwater and agricultural viability over time.",
  },
  {
    id: "eco",
    label: "Rivers, salmon\n& ecosystems",
    shortLabel: "Rivers & ecosystems",
    description:
      "Whether rivers, fish, and ecosystems receive the flows they need to remain functional and resilient.",
  },
  {
    id: "delta",
    label: "The Delta as\na living place",
    shortLabel: "The Delta",
    description:
      "How water decisions affect the Delta as a place where communities, farms, and ecosystems coexist.",
  },
  {
    id: "climate",
    label: "Drought, climate risk,\nand resilience",
    shortLabel: "Climate resilience",
    description:
      "How the water system performs under increasing climate variability, drought risk, and extreme conditions.",
  },
  {
    id: "governance",
    label: "Operations\nand impacts",
    shortLabel: "Operations & impacts",
    description:
      "How evidence, trade-offs, and equity considerations inform water-management decisions.",
  },
]

// =============================================================================
// Theme to Scenario ID mappings
// =============================================================================

/**
 * Maps each water theme ID to the scenario IDs that address it.
 * Scenario IDs match the keys in scenarioMetadata (e.g. "s0035").
 * Note: THESE ARE PROVISIONAL (Feb 24, 2026)
 * */
export const THEME_SCENARIOS: Record<string, string[]> = {
  cws: ["s0035", "s0036", "s0037"],
  ag_gw: ["s0011", "s0025", "s0026", "s0027", "s0028"],
  eco: ["s0030", "s0029", "s0032", "s0031", "s0033", "s0046"],
  delta: [
    "s0040",
    "s0041",
    "s0042",
    "s0039",
    "s0044",
    "s0045",
    "s0028",
    "s0065",
    "s0030",
  ],
  climate: [],
  governance: ["s0020", "s0021", "s0023", "s0024"],
}
