export const OUTCOMES = [
  "Community deliveries",
  "Agricultural revenue",
  "Environmental flows",
  "Delta estuary status",
  "Delta exports",
  "Reservoir storage",
  "Groundwater storage",
  "Salmon abundance",
] as const

export type Outcome = (typeof OUTCOMES)[number]
