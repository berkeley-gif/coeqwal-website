export const OUTCOMES = [
  "Community deliveries",
  "Agricultural revenue",
  "Environmental flows",
  "Delta estuary status",
  "Reservoir storage",
  "Groundwater storage",
  "Salmon abundance",
  "Distributional equity",
] as const

export type Outcome = (typeof OUTCOMES)[number]
