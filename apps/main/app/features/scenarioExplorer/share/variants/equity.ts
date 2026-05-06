/**
 * Equity (Distribution) variant handler. URL prefix `e`. Renders a
 * snapshot card with chips for each captured outcome and the equity
 * tool's hydroclimate badge.
 */

import React from "react"
import {
  OUTCOME_NAMES,
  type OutcomeCode,
} from "../../../../content/outcomes"
import {
  equityDataToCSV,
  type EquityChartDataShape,
} from "../../dataExplorer/utils/exportUtils"
import ShareSnapshotCard from "../cards/ShareSnapshotCard"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"

type EquityItem = ShareItemOfType<"equity">

function outcomeCodesToLabels(codes: string[]): string[] {
  return codes.map((code) => OUTCOME_NAMES[code as OutcomeCode] ?? code)
}

const equityHandler: VariantHandler<EquityItem> = {
  type: "equity",
  urlPrefix: "e",
  rasterDimensionsKey: "equity",

  renderCard(item, ctx) {
    const info = ctx.scenarioLookup.get(item.scenarioId)
    return React.createElement(ShareSnapshotCard, {
      id: item.id,
      toolLabel: "Distribution",
      title: info?.description ?? info?.name ?? item.scenarioId,
      scenarioDefinition: info?.definition,
      subtitle: item.compareToBaseline
        ? "Compared to today's operations"
        : "Single scenario view",
      chips: outcomeCodesToLabels(item.outcomeCodes),
      hydroclimate: item.hydroclimate,
      cachedSvg: item.cachedSvg,
      cachedImageDataUrl: item.cachedImageDataUrl,
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove,
    })
  },

  encodeUrlToken(item) {
    // Note and cached image are intentionally not URL-encoded.
    // Notes are a private annotation. Images are too large to fit a URL.
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const outcomes = item.outcomeCodes.join("~")
    const cmp = item.compareToBaseline ? "c" : ""
    return `${item.scenarioId}.${outcomes}.${cmp}.${hc}`
  },

  decodeUrlToken(parts) {
    if (parts.length < 2) return null
    const outcomeCodes = (parts[1] ?? "").split("~").filter(Boolean)
    return {
      id: crypto.randomUUID(),
      type: "equity",
      scenarioId: parts[0] ?? "",
      outcomeCodes,
      compareToBaseline: (parts[2] ?? "").includes("c"),
      hydroclimate: parts[3] || "historical",
    }
  },

  filenameLabel(item) {
    return `coeqwal-distribution-${item.scenarioId}`
  },

  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const scenarioLabel = lookups.scenarioNameLookup(item.scenarioId)
    return equityDataToCSV(
      item.cachedChartData as unknown as EquityChartDataShape,
      scenarioLabel,
    )
  },
}

export default equityHandler
