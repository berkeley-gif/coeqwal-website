/**
 * Bar-chart variant handler. Drives the per-scenario "key outcomes"
 * row card produced by the strategy grid and the scenario-selection
 * sidebar. URL prefix `b`.
 */

import React, { useEffect } from "react"
import type { ChartDataPoint } from "../../../scenarios/components/shared/types"
import { barChartDataToCSV } from "../../tools/panels/dataInDepth/utils/exportUtils"
import ShareScenarioCard from "../cards/ShareScenarioCard"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"
import { hydroclimateSlug, slugifyForFilename } from "../utils/filename"

type BarChartItem = ShareItemOfType<"barChart">

const barChartHandler: VariantHandler<BarChartItem> = {
  type: "barChart",
  urlPrefix: "b",
  rasterDimensionsKey: "barChartRow",

  renderCard(item, ctx) {
    const info = ctx.scenarioLookup.get(item.scenarioId)
    const viewLabel =
      item.viewMode === "average"
        ? "Key outcomes average"
        : item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
    const chartData =
      (item.cachedChartData as Record<string, ChartDataPoint[]> | undefined) ??
      (ctx.allChartData[item.scenarioId] as
        | Record<string, ChartDataPoint[]>
        | undefined)
    return React.createElement(ShareScenarioCard, {
      scenarioId: item.id,
      name: info?.description ?? info?.name ?? item.scenarioId,
      scenarioDefinition: info?.definition,
      description: viewLabel,
      hydroclimate: item.hydroclimate,
      chartData,
      outcomeNames: ctx.outcomeNames,
      viewMode: item.viewMode,
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove ? () => ctx.onRemove!(item.id) : undefined,
    })
  },

  encodeUrlToken(item) {
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const modeToken =
      item.viewMode === "average"
        ? "a"
        : item.viewMode === "distribution"
          ? "d"
          : "b"
    return `${item.scenarioId}.${modeToken}.${hc}`
  },

  decodeUrlToken(parts) {
    if (parts.length < 2) return null
    const modeToken = parts[1]
    return {
      id: crypto.randomUUID(),
      type: "barChart",
      scenarioId: parts[0]!,
      viewMode:
        modeToken === "a"
          ? "average"
          : modeToken === "d"
            ? "distribution"
            : "bar",
      hydroclimate: parts[2] || "historical",
    }
  },

  filenameLabel(item, lookups) {
    const scen = slugifyForFilename(
      lookups.scenarioShortLabelLookup(item.scenarioId),
    )
    // Bar chart's runtime `viewMode` reuses the word "distribution"
    // for the per-row glyph display, which collides visually with the
    // equity tool's filename token. Rename in filenames only.
    const view =
      item.viewMode === "distribution"
        ? "bars"
        : item.viewMode === "average"
          ? "avg"
          : "bar"
    const hc = hydroclimateSlug(item.hydroclimate)
    return ["coeqwal-bar-chart", scen, view, hc].filter(Boolean).join("-")
  },

  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const data = item.cachedChartData as Record<
      string,
      { label?: string; value?: number; rawCount?: number }[]
    >
    const scenarioLabel = lookups.scenarioNameLookup(item.scenarioId)
    const viewLabel =
      item.viewMode === "average"
        ? "Key outcomes average"
        : item.viewMode === "distribution"
          ? "Key outcomes distribution"
          : "Key outcomes bar chart"
    const csv = barChartDataToCSV(
      data,
      {
        variantTitle: "Bar chart",
        scenarios: [{ id: item.scenarioId, label: scenarioLabel }],
        hydroclimate: item.hydroclimate,
        extra: [["View", viewLabel]],
        includeTierScale: true,
      },
      lookups.outcomeNameLookup,
    )
    return csv || null
  },

  // Bar-chart rehydration is trivial: the scenario's resolved
  // outcome rows live in `context.allChartData[scenarioId]` because
  // the share panel already mounts `useResolvedScenarioTiers` for
  // the rest of the panel. Nothing async to await — write through
  // synchronously when the data is present and the item is missing
  // it. Replaces the inline `useEffect` that used to live in
  // Share.tsx.
  DataRehydrator({ items, context }) {
    useEffect(() => {
      if (!context.allChartData) return
      for (const item of items) {
        if (item.cachedChartData) continue
        const resolved = context.allChartData[item.scenarioId]
        if (!resolved) continue
        context.updateShareItem(item.id, {
          cachedChartData: resolved as Record<string, unknown>,
        })
      }
    }, [items, context])
    return null
  },
}

export default barChartHandler
