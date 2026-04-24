import type { VerticalParallelLineData } from "@repo/viz"

export type ShareRadarHydroKey = "historical" | "cc50" | "cc95"

/**
 * Map a share item hydroclimate (from capture or URL) to one of the
 * three live tier-fetch buckets used in Share panel and drawer.
 */
export function normalizeShareRadarHydro(hc: string): ShareRadarHydroKey {
  if (hc === "cc50") return "cc50"
  if (hc === "cc95") return "cc95"
  return "historical"
}

/**
 * Live radar fields passed to each share card, scoped to one hydroclimate
 * (from `useComparisonData(hc, true)`).
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
