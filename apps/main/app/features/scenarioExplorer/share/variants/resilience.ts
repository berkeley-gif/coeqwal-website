/**
 * Resilience variant handler. URL prefix `q`. Covers every resilience
 * capture surface: panel-wide heatmap, single-tile heatmap, and the
 * leverage quadrant scatter. CSV export branches on
 * `cachedChartData.view === "quadrant"` to pick between the heatmap
 * and quadrant exporters.
 *
 * Raster dimensions key today resolves to `resiliencePanel` for every
 * surface. That's a known limitation: panel, tile, and quadrant
 * captures all use distinct sizes at capture time, but PNG fallback
 * downloads from `cachedSvg` reuse the panel size. See the README
 * "RASTER_SIZE per tileScope" note for the planned fix.
 */

import React from "react"
import {
  resilienceHeatmapDataToCSV,
  resilienceQuadrantDataToCSV,
  type ResilienceHeatmapChartDataShape,
  type ResilienceQuadrantChartDataShape,
} from "../../dataExplorer/utils/exportUtils"
import ResilienceShareCard from "../cards/ResilienceShareCard"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"

type ResilienceItem = ShareItemOfType<"resilience">

const resilienceHandler: VariantHandler<ResilienceItem> = {
  type: "resilience",
  urlPrefix: "q",
  rasterDimensionsKey: "resiliencePanel",

  renderCard(item, ctx) {
    return React.createElement(ResilienceShareCard, {
      item,
      scenarioLookup: ctx.scenarioLookup,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove,
    })
  },

  encodeUrlToken(item) {
    const view = item.view
    const encoding = item.cellEncoding
    const ids = item.scenarioIds.join("~")
    const climates = item.hydroclimates.join("~")
    const outcomes = item.outcomeCodes.join("~")
    // Optional 7th segment "n" when numeric cell values were on at
    // save. tileScope / tileId / tileLabel and the visual / chart
    // caches are not encoded; round-tripped items rehydrate with
    // partial context.
    const num = item.view !== "quadrant" && item.showCellNumbers ? ".n" : ""
    return `${view}.${encoding}.${ids}.${climates}.${outcomes}${num}`
  },

  decodeUrlToken(parts) {
    if (parts.length < 2) return null
    const showCellNumbers = parts[5] === "n"
    return {
      id: crypto.randomUUID(),
      type: "resilience",
      view: parts[0] ?? "aggregate",
      cellEncoding: parts[1] ?? "tier",
      scenarioIds: (parts[2] ?? "").split("~").filter(Boolean),
      hydroclimates: (parts[3] ?? "").split("~").filter(Boolean),
      outcomeCodes: (parts[4] ?? "").split("~").filter(Boolean),
      ...(showCellNumbers ? { showCellNumbers: true } : {}),
    }
  },

  filenameLabel(item) {
    return `coeqwal-resilience-${item.view}`
  },

  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const data = item.cachedChartData as Record<string, unknown>
    const isQuadrant = data.view === "quadrant"
    const scenarios = item.scenarioIds.map((id) => ({
      id,
      label: lookups.scenarioNameLookup(id),
    }))
    const hydroclimate =
      item.hydroclimates.length === 1 ? item.hydroclimates[0] : undefined
    const extra: Array<[string, string]> = []
    const tileLabel = data.tileLabel as string | undefined
    // `Sliced by` answers "what dimension is this tile pivoting on?".
    // For outcome / hydroclimate / quadrant tiles it carries information
    // the `Scenarios` row doesn't (the outcome name, hydroclimate label,
    // or LOI code). For a scenario-scoped small multiple the label
    // collapses to the scenario name and would simply repeat the only
    // entry in `Scenarios`. Drop it in that case so the header stays
    // meaningful.
    if (tileLabel) {
      const onlyScenarioLabel =
        scenarios.length === 1 ? scenarios[0]!.label : undefined
      if (tileLabel !== onlyScenarioLabel) {
        extra.push(["Sliced by", tileLabel])
      }
    }
    if (typeof data.view === "string") extra.push(["View", data.view])
    if (typeof data.cellEncoding === "string") {
      extra.push(["Encoding", data.cellEncoding])
    }
    const header = {
      variantTitle: isQuadrant ? "Resilience quadrant" : "Resilience heatmap",
      scenarios,
      hydroclimate,
      extra,
      includeTierScale: true,
    }
    return isQuadrant
      ? resilienceQuadrantDataToCSV(
          data as unknown as ResilienceQuadrantChartDataShape,
          header,
        )
      : resilienceHeatmapDataToCSV(
          data as unknown as ResilienceHeatmapChartDataShape,
          header,
        )
  },
}

export default resilienceHandler
