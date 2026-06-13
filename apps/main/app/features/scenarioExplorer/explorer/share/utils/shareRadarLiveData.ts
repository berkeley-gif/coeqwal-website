import type { VerticalParallelLineData } from "@repo/viz"
import {
  HYDROCLIMATES,
  type Hydroclimate,
} from "../../../../../content/scenarios"

/**
 * The hydroclimate keys the share radar fetches live. Derived from the
 * {@link HYDROCLIMATES} list in content/scenarios so there is
 * one place to edit when the supported set changes. See the
 * "Hydroclimates" section of the share README for the add-a-hydroclimate
 * steps and the rules-of-hooks constraint on `useShareRenderContext`.
 */
export type ShareRadarHydroKey = Hydroclimate

/** First entry is the fallback for unknown or missing hydroclimates. */
const DEFAULT_SHARE_RADAR_HYDRO: ShareRadarHydroKey = HYDROCLIMATES[0]
const SHARE_RADAR_HYDRO_SET = new Set<string>(HYDROCLIMATES)

/**
 * Map a share item hydroclimate (from capture or URL) to one of the
 * live tier-fetch buckets used in the Share panel and drawer. Unknown
 * values fall back to the default so an old or malformed URL still
 * resolves to a real bucket.
 */
export function normalizeShareRadarHydro(hc: string): ShareRadarHydroKey {
  return SHARE_RADAR_HYDRO_SET.has(hc)
    ? (hc as ShareRadarHydroKey)
    : DEFAULT_SHARE_RADAR_HYDRO
}

/**
 * Live radar fields passed to each share card, scoped to one hydroclimate
 * (from `useTierChartData(hc, true)`).
 */
export interface ShareRadarLiveDataFields {
  radarPlotData: VerticalParallelLineData[]
  radarBaseline: VerticalParallelLineData | null
  radarAxisRange: Record<string, { min: number; max: number }>
  radarLineColorByScenario: Map<string, string>
  morphGeneration: number
}

type ComparisonBundle = {
  data: VerticalParallelLineData[]
  baselineScenario: VerticalParallelLineData | null
  axisRange: Record<string, { min: number; max: number }>
  scenarios: { id: string; name: string; color: string }[]
  morphGeneration: number
}

export function buildShareRadarLiveDataFields(
  c: ComparisonBundle,
): ShareRadarLiveDataFields {
  const radarLineColorByScenario = new Map<string, string>()
  c.scenarios.forEach((s) => {
    radarLineColorByScenario.set(s.id, s.color)
  })
  return {
    radarPlotData: c.data,
    radarBaseline: c.baselineScenario,
    radarAxisRange: c.axisRange,
    radarLineColorByScenario,
    morphGeneration: c.morphGeneration,
  }
}
