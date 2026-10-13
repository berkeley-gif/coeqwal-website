/**
 * mapPaintKey - one string naming what the Explore map is drawing, so a
 * "painted" signal from the renderer can be compared with what the tools
 * asked for. Pure. Codes are sorted so selection order does not matter.
 */

export interface MapPaintKeyInput {
  mode: string
  outcomeCode?: string | null
  /** Resolved scenario id the tier layer fetched (activeOutcomeVisualization.scenarioId) */
  scenarioId?: string | null
  /** Distribution: painted `tierCode:locationId` keys */
  mappedLocationKeys?: string[]
  focusScenario?: string | null
  /** Distribution: hydroclimate the markers' tiers were built under */
  hydroclimate?: string | null
  compared?: boolean
}

export function mapPaintKey(input: MapPaintKeyInput): string {
  if (input.mode === "equity") {
    const keys = [...(input.mappedLocationKeys ?? [])].sort()
    if (keys.length === 0) return ""
    return `equity|${keys.join("~")}|${input.focusScenario ?? ""}|${input.hydroclimate ?? ""}|${input.compared ? 1 : 0}`
  }
  if (!input.outcomeCode) return ""
  return `tiers|${input.outcomeCode}|${input.scenarioId ?? ""}`
}

/** The fields of Distribution's painted-marker snapshot a paint key uses */
export interface DistributionPaintSource {
  locationKeys: string[]
  scenarioId: string
  hydroclimate: string
  comparedWithBaseline: boolean
}

/** The map paint key a Distribution snapshot stands for ("" for none).
 *  Pure. */
export function getDistributionPaintKey(
  snapshot: DistributionPaintSource | null,
): string {
  return snapshot
    ? mapPaintKey({
        mode: "equity",
        mappedLocationKeys: snapshot.locationKeys,
        focusScenario: snapshot.scenarioId,
        hydroclimate: snapshot.hydroclimate,
        compared: snapshot.comparedWithBaseline,
      })
    : ""
}
