export const OUTCOMES = [
  "Community deliveries",
  "Agricultural deliveries", 
  "Environmental deliveries",
  "Reservoir storage",
  "Groundwater storage",
  "Delta salinity",
  "Salmon abundance",
  "Distributional equity"
] as const

export type Outcome = typeof OUTCOMES[number]
