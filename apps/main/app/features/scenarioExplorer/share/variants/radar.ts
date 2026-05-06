/**
 * Radar variant handler. Drives the parallel-plot share card produced
 * by the radar tool toolbar and the scenario-selection sidebar's
 * theme-header overlay path. URL prefix `r`.
 *
 * Holds the live-fallback builder previously inlined in
 * ShareItemView. The fallback only mounts when an item arrives from
 * a URL without a cached SVG/PNG, so live re-render cost is paid
 * lazily.
 */

import React, { useEffect } from "react"
import type { VerticalParallelLineData } from "@repo/viz"
import { getOutcomeName } from "../../../../content/outcomes"
import { radarDataToCSV } from "../../dataExplorer/utils/exportUtils"
import ShareRadarCard from "../cards/ShareRadarCard"
import ShareRadarLiveChart from "../live/ShareRadarLiveChart"
import {
  normalizeShareRadarHydro,
  type ShareRadarLiveDataFields,
} from "../utils/shareRadarLiveData"
import { hydroclimateSlug, joinScenarioSlugs } from "../utils/filename"
import type { ShareItemOfType } from "../types"
import type { VariantHandler } from "../variants"

type RadarItem = ShareItemOfType<"radar">

function renderRadarLiveChart(
  item: RadarItem,
  liveData: ShareRadarLiveDataFields,
  fallbackLineColor: string,
): React.ReactNode {
  const idSet = new Set(item.scenarioIds)
  const filtered = liveData.radarPlotData.filter((d) => idSet.has(d.id))
  if (filtered.length === 0) return null

  const orderedFiltered = item.scenarioIds
    .map((id) => filtered.find((d) => d.id === id))
    .filter((d): d is VerticalParallelLineData => !!d)

  const axesDisplay = item.axes.map((code) => getOutcomeName(code))

  const lineColors = orderedFiltered.map((d, i) => {
    const captured = item.scenarioColors?.[i]
    if (captured) return captured
    return liveData.radarLineColorByScenario.get(d.id) ?? fallbackLineColor
  })

  return React.createElement(ShareRadarLiveChart, {
    data: orderedFiltered,
    axes: axesDisplay,
    lineColors,
    baselineData: liveData.radarBaseline,
    axisRange: liveData.radarAxisRange,
    showRadarRange: item.showRange,
    showTierZones: item.showTierZones !== false,
    highlightBaseline: item.highlightBaseline,
    showDotsOnly: item.showDotsOnly,
    morphGeneration: liveData.morphGeneration,
  })
}

const radarHandler: VariantHandler<RadarItem> = {
  type: "radar",
  urlPrefix: "r",
  rasterDimensionsKey: "radar",

  renderCard(item, ctx) {
    const names = item.scenarioIds.map(
      (id) =>
        ctx.scenarioLookup.get(id)?.description ??
        ctx.scenarioLookup.get(id)?.name ??
        id,
    )
    const definitions = item.scenarioIds.map(
      (id) => ctx.scenarioLookup.get(id)?.definition ?? "",
    )
    const radarLive =
      ctx.radarLiveByHydro[normalizeShareRadarHydro(item.hydroclimate)]
    const hasVisualCache = !!item.cachedSvg || !!item.cachedImageDataUrl
    const liveChart = hasVisualCache
      ? undefined
      : renderRadarLiveChart(item, radarLive, ctx.theme.palette.grey[600])
    return React.createElement(ShareRadarCard, {
      scenarioNames: names,
      scenarioDefinitions: definitions,
      scenarioColors: item.scenarioColors,
      hydroclimate: item.hydroclimate,
      showRange: item.showRange,
      showTierZones: item.showTierZones !== false,
      highlightBaseline: item.highlightBaseline,
      showDotsOnly: item.showDotsOnly,
      cachedSvg: item.cachedSvg,
      cachedImageDataUrl: item.cachedImageDataUrl,
      liveChart,
      note: item.note,
      onNoteChange: ctx.onNoteChange,
      onRemove: ctx.onRemove ? () => ctx.onRemove!(item.id) : undefined,
    })
  },

  encodeUrlToken(item) {
    const hc = item.hydroclimate === "historical" ? "" : item.hydroclimate
    const ids = item.scenarioIds.join("~")
    const axes = item.axes.join("~")
    let flags = ""
    if (item.showRange) flags += "r"
    if (item.highlightBaseline) flags += "b"
    if (item.showDotsOnly) flags += "d"
    if (item.showTierZones === false) flags += "n"
    return `${ids}.${axes}.${flags}.${hc}`
  },

  decodeUrlToken(parts) {
    if (parts.length < 2) return null
    const scenarioIds = parts[0]!.split("~").filter(Boolean)
    const axes = parts[1]!.split("~").filter(Boolean)
    const flags = parts[2] ?? ""
    return {
      id: crypto.randomUUID(),
      type: "radar",
      scenarioIds,
      axes,
      showRange: flags.includes("r"),
      showTierZones: !flags.includes("n"),
      highlightBaseline: flags.includes("b"),
      showDotsOnly: flags.includes("d"),
      hydroclimate: parts[3] || "historical",
    }
  },

  filenameLabel(item, lookups) {
    // joinScenarioSlugs dedupes consecutive identical short-label
    // slugs so two ids that share a label don't yield
    // `current-ops-vs-current-ops`.
    const ids = joinScenarioSlugs(
      item.scenarioIds,
      lookups.scenarioShortLabelLookup,
    )
    const hc = hydroclimateSlug(item.hydroclimate)
    return ["coeqwal-radar", ids, hc].filter(Boolean).join("-")
  },

  exportCsv(item, lookups) {
    if (!item.cachedChartData) return null
    const scenarios = item.scenarioIds.map((id) => ({
      id,
      label: lookups.scenarioNameLookup(id),
    }))
    return radarDataToCSV(
      item.cachedChartData as Record<string, unknown>,
      {
        variantTitle: "Radar",
        scenarios,
        hydroclimate: item.hydroclimate,
        includeTierScale: true,
      },
      item.scenarioIds,
      lookups.scenarioNameLookup,
      lookups.outcomeNameLookup,
    )
  },

  // Radar's bulk-rehydration source is `context.radarLiveByHydro`,
  // the per-hydroclimate live data the share panel already builds
  // for live fallback rendering. The shape RadarPanel persists at
  // capture time is `{ [scenarioId]: values }` (see
  // `buildRadarCaptureSlice`), so reproduce that here from the
  // already-resolved `VerticalParallelLineData[]` for the item's
  // hydroclimate. No async work required.
  DataRehydrator({ items, context }) {
    useEffect(() => {
      for (const item of items) {
        if (item.cachedChartData) continue
        const live =
          context.radarLiveByHydro[normalizeShareRadarHydro(item.hydroclimate)]
        if (!live || live.radarPlotData.length === 0) continue
        const idSet = new Set(item.scenarioIds)
        const filtered = live.radarPlotData.filter(
          (d: VerticalParallelLineData) => idSet.has(d.id),
        )
        if (filtered.length === 0) continue
        const chartData: Record<string, unknown> = {}
        for (const d of filtered) chartData[d.id] = d.values
        context.updateShareItem(item.id, { cachedChartData: chartData })
      }
    }, [items, context])
    return null
  },
}

export default radarHandler
