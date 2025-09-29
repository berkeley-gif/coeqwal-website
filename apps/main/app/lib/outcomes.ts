export const OUTCOMES = [
  "Community deliveries",
  "Agricultural productivity", 
  "Environmental flows",
  "Delta estuary health",
  "Freshwater for Delta exports",
  "Reservoir storage",
  "Groundwater storage",
  "Winter-run Chinook salmon abundance",
] as const

export type Outcome = (typeof OUTCOMES)[number]

// Outcome definitions for tooltips
export const outcomeDefinitions: Record<string, string> = {
  "Community deliveries": "Water delivered to community water systems for residential, commercial, and industrial use",
  "Agricultural revenue": "Impact on agricultural production",
  "Environmental flows": "Water allocated to support ecosystem health, wildlife habitats, and environmental protection",
  "Delta estuary status": "Ecological responses to flow, measured by direct indicators (SAV growth, salinity, turbidity, microhabitat availability)",
  "Freshwater for Delta exports": "Frequency with which water at Delta pumps (Banks and Jones) meets salinity thresholds for drinking water",
  "Reservoir storage": "Amount of water stored in California's major reservoir systems each spring",
  "Groundwater storage": "Amount of water stored in underground aquifer systems.",
  "Winter-run Chinook salmon abundance": "Population levels of Winter-run Chinook salmon in the Sacramento River.",
}

// Tier value definitions for each outcome
export const outcomeTierValues: Record<string, { tier1: string; tier2: string; tier3: string; tier4: string }> = {
  "Community deliveries": {
    tier1: "Full demands met in at least 95% of years.",
    tier2: "Functional minimum demands met in all years.",
    tier3: "Human health & safety minimums met in all years.",
    tier4: "Human health & safety minimums not achieved for all years."
  },
  "Agricultural revenue": {
    tier1: "Increased production: Agricultural production increases with respect to today's outcomes.",
    tier2: "Minimal impact: Agricultural production declines less than 5% with respect to today's outcomes.",
    tier3: "Moderate impact: Agricultural production declines 5%-20% with respect to today's outcomes.", 
    tier4: "Severe impact: Agricultural production declines more than 20% with respect to today's outcomes."
  },
  "Environmental flows": {
    tier1: "Functional ecosystem: Functional flows to sustain native freshwater species in 90% of years. Higher mean daily flows in spring/winter than summer.",
    tier2: "Modified functional flows: Partial functional flows in wet season/spring. Full functional flows in summer for 75% of years. Higher mean daily flows in spring/winter than summer.",
    tier3: "Existing flow requirements: Minimum flow constraints for current operations met in 50% of years.",
    tier4: "No function: None of the above thresholds met."
  },
  "Delta estuary status": {
    tier1: "Scenario scores in the top 25% based on yearly evaluation of ecosystem indicators: low SAV, high turbidity, fresh conditions, expanded microhabitats in most years.",
    tier2: "Scenario scores in the top 50% based on yearly evaluation of ecosystem indicators: unchanged SAV, high turbidity, fresh conditions, some microhabitats available in most years.",
    tier3: "Scenario scores in the top 75% based on yearly evaluation of ecosystem indicators: unchanged SAV, standard turbidity, moderate salinity, few microhabitats available in most years.", 
    tier4: "None of the above thresholds met: unchanged SAV, low turbidity, moderate to high salinity, few microhabitats available in most years."
  },
  "Freshwater for Delta exports": {
    tier1: "Average salinity below 900 uS/cm for all 12 months per year for 95% of years.",
    tier2: "Average salinity between 900-1600 uS/cm for at least 10 months per year for 95% of years.",
    tier3: "Average salinity above 1600 uS/cm for 2 or more months in any year, or more than 5% of years at either pumping station.",
    tier4: "Average salinity greater than 2500 uS/cm for 2 or more months in any year."
  },
  "Reservoir storage": {
    tier1: "Storage ≥ top threshold for at least 90% of years.",
    tier2: "Storage ≥ middle threshold for at least 67% of years.",
    tier3: "Storage ≥ middle threshold for at least 30% of years.",
    tier4: "Storage below middle threshold for more than 70% of years."
  },
  "Groundwater storage": {
    tier1: "Groundwater trend is stable or increasing from 1960-2021 levels AND average total storage > current operations.",
    tier2: "Groundwater trend stable/increasing BUT average total storage < current operations.",
    tier3: "Groundwater trend declining at moderate rate.",
    tier4: "Groundwater trend declining severely."
  },
  "Winter-run Chinook salmon abundance": {
    tier1: "Strong growth: At least 80% chance population grows to 8x current size.",
    tier2: "Moderate growth: At least 80% chance population grows 2-8x current size.",
    tier3: "Little or no change: At least 80% chance population grows from current size.",
    tier4: "Population decline."
  }
}
