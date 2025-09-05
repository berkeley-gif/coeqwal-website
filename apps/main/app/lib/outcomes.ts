export const OUTCOMES = [
  "Community deliveries",
  "Agricultural deliveries",
  "Environmental health",
  "Delta health",
  "Reservoir storage",
  "Groundwater storage",
  "Salmon abundance",
  "Distributional equity",
] as const

export type Outcome = (typeof OUTCOMES)[number]
