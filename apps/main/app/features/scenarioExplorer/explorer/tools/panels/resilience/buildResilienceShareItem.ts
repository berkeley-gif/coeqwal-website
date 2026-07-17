import type { ShareItem } from "../../../store"
import type { ResilienceControlsState } from "../../../store"
import type { ResilienceCaptureResult } from "./types"

export type BuildResilienceShareItemInput = {
  id: string
  controls: ResilienceControlsState
  outcomeCodes: string[]
  scenarioIds: string[]
  result?: ResilienceCaptureResult | null
  tileId?: string
}

/** Build a resilience share drawer item from controls and an optional capture result */
export function buildResilienceShareItem(
  input: BuildResilienceShareItemInput,
): Extract<ShareItem, { type: "resilience" }> {
  const { id, controls, outcomeCodes, scenarioIds, result, tileId } = input
  const hydroclimates = Array.from(controls.selectedHydroclimates)
  const showCellNumbers = controls.showCellNumbers

  if (result) {
    return {
      id,
      type: "resilience",
      view: result.chartData.view,
      cellEncoding: result.chartData.cellEncoding,
      scenarioIds,
      hydroclimates,
      outcomeCodes,
      showCellNumbers,
      tileScope: result.chartData.tileScope,
      tileId,
      tileLabel: result.chartData.tileLabel,
      cachedSvg: result.svg,
      cachedImageDataUrl: result.dataUrl,
      cachedChartData: result.chartData as unknown as Record<string, unknown>,
    }
  }

  return {
    id,
    type: "resilience",
    view: controls.view,
    cellEncoding: controls.cellEncoding,
    scenarioIds,
    hydroclimates,
    outcomeCodes,
    showCellNumbers,
    tileScope: "panel",
  }
}
