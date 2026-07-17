import {
  HYDROCLIMATES,
  type Hydroclimate,
} from "../../../../../../content/scenarios"

/**
 * Hydroclimates used by the resilience heatmap matrix and store
 * defaults. These are the app-wide hydroclimates (HYDROCLIMATES in
 * content/scenarios). The resilience-specific aliases stay so the
 * resilience code that imports them reads clearly, and so this module
 * remains hook-free for the store-init path.
 */
export const RESILIENCE_HYDROCLIMATES = HYDROCLIMATES

export type ResilienceHydroclimate = Hydroclimate
