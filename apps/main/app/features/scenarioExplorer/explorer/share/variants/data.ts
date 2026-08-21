/**
 * Data-in-Depth variant handler. URL prefix `d`. Renders a snapshot card
 * with the captured variable, view, and member chips; CSV export emits the
 * per-member summary statistics and the annual series.
 *
 * URL-restored items carry selection state but no visual cache and no data
 * payload, so they render a metadata card with the thumbnail area empty and
 * the data download disabled (no live rehydrator in this version).
 */

import React from "react"
import ShareSnapshotCard from "../cards/ShareSnapshotCard"
import {
  dataInDepthToCSV,
  type DataChartDataShape,
} from "../export/csv/dataCsv"
import {
  getVariable,
  resolveFoldedVariable,
  VIEW_LABELS,
  type VariableView,
} from "../../tools/panels/dataInDepth/config/variableRegistry"
import { hydroclimateSlug, slugifyForFilename } from "../utils/filename"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"

type DataItem = ShareItemOfType<"data">

const DIST_LABELS: Record<string, string> = {
  exceedance: "Exceedance",
  box: "Box plot",
}

function viewLabelFor(item: DataItem): string {
  const view =
    getVariable(item.variableId)?.viewLabels?.[item.view as VariableView] ??
    VIEW_LABELS[item.view as VariableView] ??
    item.view
  const dist =
    item.view === "dist" || item.view === "pct" || item.view === "level"
      ? DIST_LABELS[item.distKind]
      : undefined
  return dist ? `${view} (${dist})` : view
}

const dataHandler: VariantHandler<DataItem> = {
  type: "data",
  urlPrefix: "d", // "d"ata; unique across the registry
  rasterDimensionsKey: "data",

  renderCard(item, ctx) {
    const variableName = getVariable(item.variableId)?.name ?? item.variableId
    // The standardized figure title captured with the chart leads the card
    // (and therefore the exported PNG/SVG, which raster the card chrome);
    // URL-restored items without cached chart data fall back to the
    // variable name.
    const figureTitle = (
      item.cachedChartData as { figureTitle?: string } | undefined
    )?.figureTitle
    return React.createElement(ShareSnapshotCard, {
      id: item.id,
      toolLabel: "Data in depth",
      title: figureTitle ?? variableName,
      subtitle: viewLabelFor(item),
      chips: [
        item.source === "live" ? "Live data" : "Sample data",
        ...item.memberLabels,
      ],
      hydroclimate: item.hydroclimate,
      cachedSvg: item.cachedSvg,
      cachedImageDataUrl: item.cachedImageDataUrl,
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove,
    })
  },

  encodeUrlToken(item) {
    // Series data and images are never URL-encoded (too large); the token
    // carries the selection state only.
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    return [
      item.variableId,
      item.view,
      item.distKind,
      item.compareBy,
      item.memberIds.join("~"),
      item.source,
      hc,
    ].join(".")
  },

  decodeUrlToken(parts) {
    if (parts.length < 1 || !parts[0]) return null
    const memberIds = (parts[4] ?? "").split("~").filter(Boolean)
    // A link minted before a variable was folded into a view of another one
    // must land on the same chart, not on a stranger or a blank panel.
    const resolved = resolveFoldedVariable(parts[0], parts[1] || "dist")
    return {
      id: crypto.randomUUID(),
      type: "data",
      variableId: resolved.id,
      view: resolved.view,
      distKind: parts[2] || "exceedance",
      compareBy: parts[3] || "scenarios",
      memberIds,
      memberLabels: memberIds,
      source: parts[5] === "live" ? "live" : "mock",
      hydroclimate: parts[6] || "historical",
    }
  },

  filenameLabel(item) {
    const variableName = getVariable(item.variableId)?.name ?? item.variableId
    return [
      "coeqwal-data",
      slugifyForFilename(variableName),
      item.view,
      hydroclimateSlug(item.hydroclimate),
    ]
      .filter(Boolean)
      .join("-")
  },

  exportCsv(item) {
    if (!item.cachedChartData) return null
    const data = item.cachedChartData as unknown as DataChartDataShape
    return dataInDepthToCSV(data, {
      variantTitle: "Data in depth",
      hydroclimate: item.hydroclimate,
    })
  },
}

export default dataHandler
