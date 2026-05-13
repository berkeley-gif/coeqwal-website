/**
 * Equity (Distribution) variant handler. URL prefix `e`. Renders a
 * snapshot card with chips for each captured outcome and the equity
 * tool's hydroclimate badge.
 */

import React, { useEffect } from "react"
import { OUTCOME_NAMES, type OutcomeCode } from "../../../../content/outcomes"
import {
  equityDataToCSV,
  type EquityChartDataShape,
} from "../../tools/panels/dataInDepth/utils/exportUtils"
import { useEquityObjectives } from "../../tools/panels/equity/useEquityObjectives"
import ShareSnapshotCard from "../cards/ShareSnapshotCard"
import ShareEquityLiveChart from "../live/ShareEquityLiveChart"
import { hydroclimateSlug, slugifyForFilename } from "../utils/filename"
import type { ShareItemOfType } from "../types"
import type { DataRehydrationContext, VariantHandler } from "../variants"

type EquityItem = ShareItemOfType<"equity">

function outcomeCodesToLabels(codes: string[]): string[] {
  return codes.map((code) => OUTCOME_NAMES[code as OutcomeCode] ?? code)
}

/**
 * Per-item rehydration mount. Each missing equity item gets its own
 * inner component so `useEquityObjectives` can be called once per
 * scenario / baseline pair without violating the rules of hooks.
 *
 * Persists `cachedChartData` in the same shape `OffscreenEquityCapture`
 * writes at capture time so the CSV exporter sees identical input
 * whether the item was captured live or rehydrated from a URL.
 */
const EquityItemRehydrator: React.FC<{
  item: EquityItem
  context: DataRehydrationContext
}> = ({ item, context }) => {
  const { objectives, categories, ready } = useEquityObjectives({
    scenarioId: item.scenarioId,
    compareToBaseline: item.compareToBaseline,
  })

  useEffect(() => {
    if (!ready || objectives.length === 0) return
    if (item.cachedChartData) return
    context.updateShareItem(item.id, {
      cachedChartData: {
        kind: "equity",
        scenarioId: item.scenarioId,
        compareToBaseline: item.compareToBaseline,
        categories,
        objectives,
      },
    })
  }, [
    ready,
    objectives,
    categories,
    item.id,
    item.scenarioId,
    item.compareToBaseline,
    item.cachedChartData,
    context,
  ])

  return null
}

const EquityRehydrator: React.FC<{
  items: EquityItem[]
  context: DataRehydrationContext
}> = ({ items, context }) =>
  React.createElement(
    React.Fragment,
    null,
    items
      .filter((item) => !item.cachedChartData)
      .map((item) =>
        React.createElement(EquityItemRehydrator, {
          key: item.id,
          item,
          context,
        }),
      ),
  )

const equityHandler: VariantHandler<EquityItem> = {
  type: "equity",
  urlPrefix: "e",
  rasterDimensionsKey: "equity",

  renderCard(item, ctx) {
    const info = ctx.scenarioLookup.get(item.scenarioId)
    // URL-restored items arrive without `cachedSvg` / `cachedImageDataUrl`,
    // so build a live fallback the snapshot card can mount when both
    // caches are absent (parallels the radar handler's `liveChart`).
    const hasVisualCache = !!item.cachedSvg || !!item.cachedImageDataUrl
    const liveChart = hasVisualCache
      ? undefined
      : React.createElement(ShareEquityLiveChart, {
          scenarioId: item.scenarioId,
          compareToBaseline: item.compareToBaseline,
        })
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
      liveChart,
      // TierGrid encodes outcome status entirely in tier color and
      // ships no internal color key. Mount the shared legend so PNG
      // and SVG exports of the card can be read on their own.
      showTierLegend: true,
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

  filenameLabel(item, lookups) {
    const scen = slugifyForFilename(
      lookups.scenarioShortLabelLookup(item.scenarioId),
    )
    const baseline = item.compareToBaseline ? "vs-baseline" : ""
    const hc = hydroclimateSlug(item.hydroclimate)
    return ["coeqwal-distribution", scen, baseline, hc]
      .filter(Boolean)
      .join("-")
  },

  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const scenarioLabel = lookups.scenarioNameLookup(item.scenarioId)
    const data = item.cachedChartData as unknown as EquityChartDataShape
    return equityDataToCSV(data, {
      variantTitle: "Distribution",
      scenarios: [{ id: item.scenarioId, label: scenarioLabel }],
      hydroclimate: item.hydroclimate,
      compareToBaseline: data.compareToBaseline,
      includeTierScale: true,
    })
  },

  // Mount one inner component per missing item so `useEquityObjectives`
  // is called per (scenarioId, compareToBaseline) pair. SWR shares
  // the underlying tier queries with the live panel, so the typical
  // case is a warm-cache hit with no extra network.
  DataRehydrator: EquityRehydrator,
}

export default equityHandler
