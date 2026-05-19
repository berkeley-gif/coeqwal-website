/** Hydroclimate keys used by the resilience heatmap matrix and store defaults */
export const RESILIENCE_HYDROCLIMATES = [
  "historical",
  "cc50",
  "cc95",
] as const

export type ResilienceHydroclimate = (typeof RESILIENCE_HYDROCLIMATES)[number]
