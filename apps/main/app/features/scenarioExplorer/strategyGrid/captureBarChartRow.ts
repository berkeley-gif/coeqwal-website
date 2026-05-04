/**
 * Locate the live `outcome-col` for a scenario row in the list view
 * and produce a stand-alone SVG (and rasterized PNG) of it via
 * `composeAndRasterize`. Returns `null` when the row is not on
 * screen (e.g. the user is not in list mode), in which case callers
 * should add a no-image bar-chart share item that re-renders live
 * from `cachedChartData`.
 */

import { composeAndRasterize } from "../dataExplorer/utils/exportUtils"

export interface CapturedBarChartRow {
  svg: string
  dataUrl: string
}

export async function captureBarChartRow(
  scenarioId: string,
): Promise<CapturedBarChartRow | null> {
  if (typeof document === "undefined") return null
  const el = document.querySelector<HTMLElement>(
    `[data-outcome-col-scenario-id="${CSS.escape(scenarioId)}"]`,
  )
  if (!el) return null
  try {
    return await composeAndRasterize(el)
  } catch (err) {
    console.warn(
      "[captureBarChartRow] composeAndRasterize failed for",
      scenarioId,
      err,
    )
    return null
  }
}
