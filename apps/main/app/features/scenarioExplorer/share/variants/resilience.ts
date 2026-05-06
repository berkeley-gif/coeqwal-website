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

import React, { useEffect, useMemo } from "react"
import {
  getOutcomeName,
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
} from "../../../../content/outcomes"
import { HYDROCLIMATE_SHORT_LABELS } from "../../../../content/scenarios"
import {
  resilienceHeatmapDataToCSV,
  resilienceQuadrantDataToCSV,
  type ResilienceHeatmapChartDataShape,
  type ResilienceQuadrantChartDataShape,
} from "../../dataExplorer/utils/exportUtils"
import { useResilienceAggregate } from "../../hooks/useResilienceAggregate"
import {
  RESILIENCE_HYDROCLIMATES,
  type ResilienceHydroclimate,
} from "../../hooks/useResilienceMatrix"
import ResilienceShareCard from "../cards/ResilienceShareCard"
import {
  hydroclimateSlug,
  slugifyForFilename,
} from "../utils/filename"
import type { ShareItemOfType } from "../types"
import type {
  DataRehydrationContext,
  VariantHandler,
} from "../variants"

type ResilienceItem = ShareItemOfType<"resilience">

/**
 * Restrict the captured outcomes to the canonical display order so
 * the rehydrated table reads the same way as the explore heatmap
 * regardless of the order the URL token serialized them in.
 * Mirrors `orderOutcomes` in `ShareResilienceLiveChart`.
 */
function orderOutcomes(codes: string[]): string[] {
  const known = new Set(codes)
  const ordered: string[] = []
  for (const code of OUTCOME_CODE_ORDER) {
    if (known.has(code)) ordered.push(code)
  }
  for (const code of NOD_SOD_OUTCOME_CODES) {
    if (known.has(code)) ordered.push(code)
  }
  for (const code of codes) {
    if (!ordered.includes(code)) ordered.push(code)
  }
  return ordered
}

function orderHydroclimates(hcs: string[]): ResilienceHydroclimate[] {
  const known = new Set(hcs)
  const ordered: ResilienceHydroclimate[] = []
  for (const hc of RESILIENCE_HYDROCLIMATES) {
    if (known.has(hc)) ordered.push(hc)
  }
  return ordered
}

function hydroclimateLabel(hc: string): string {
  return HYDROCLIMATE_SHORT_LABELS[hc] ?? hc
}

/**
 * Per-item resilience rehydrator. Quadrant captures have no live
 * resolver today; the parent registry filters those out before
 * mounting this component, and they're silently skipped from the
 * bulk ZIP when their `cachedChartData` is missing.
 *
 * The aggregate is taken across the item's scenario scope (groupBy
 * = "scenarios"), matching the visual summary `ShareResilienceLiveChart`
 * already shows for URL-restored items. The CSV exporter reads
 * `rowLabel`, `colLabel`, `tier`, `value` only, so the resulting
 * 2D table is a faithful representation of what the live thumbnail
 * draws even when the original capture used a small-multiples view.
 */
const ResilienceItemRehydrator: React.FC<{
  item: ResilienceItem
  context: DataRehydrationContext
}> = ({ item, context }) => {
  const orderedOutcomes = useMemo(
    () => orderOutcomes(item.outcomeCodes),
    [item.outcomeCodes],
  )
  const orderedHydroclimates = useMemo(
    () => orderHydroclimates(item.hydroclimates),
    [item.hydroclimates],
  )

  const { cells, isLoading, error, matrix } = useResilienceAggregate({
    groupBy: "scenarios",
    scenarioIds: item.scenarioIds,
    outcomeCodes: orderedOutcomes,
    hydroclimates: orderedHydroclimates,
  })

  useEffect(() => {
    if (item.cachedChartData) return
    if (isLoading || error) return
    if (matrix.scenarioIds.length === 0) return
    if (orderedOutcomes.length === 0 || orderedHydroclimates.length === 0) {
      return
    }
    const rows: ResilienceHeatmapChartDataShape["rows"] = []
    for (const code of orderedOutcomes) {
      for (const hc of orderedHydroclimates) {
        const cell = cells[code]?.[hc]
        const available = !!cell && cell.availableCount > 0
        const tierLevel =
          available && cell!.mean != null
            ? Math.min(4, Math.max(1, Math.round(cell!.mean)))
            : undefined
        rows.push({
          rowKey: code,
          rowLabel: getOutcomeName(code),
          colKey: hc,
          colLabel: hydroclimateLabel(hc),
          tier: tierLevel,
          value: available ? (cell!.mean ?? undefined) : undefined,
        })
      }
    }
    if (rows.length === 0) return
    context.updateShareItem(item.id, {
      cachedChartData: {
        kind: "resilience",
        view: item.view,
        cellEncoding: item.cellEncoding,
        tileScope: item.tileScope ?? "panel",
        tileLabel: item.tileLabel,
        rows,
      },
    })
  }, [
    item.id,
    item.view,
    item.cellEncoding,
    item.tileScope,
    item.tileLabel,
    item.cachedChartData,
    cells,
    isLoading,
    error,
    matrix.scenarioIds.length,
    orderedOutcomes,
    orderedHydroclimates,
    context,
  ])

  return null
}

const ResilienceRehydrator: React.FC<{
  items: ResilienceItem[]
  context: DataRehydrationContext
}> = ({ items, context }) =>
  React.createElement(
    React.Fragment,
    null,
    items
      .filter((item) => item.view !== "quadrant" && !item.cachedChartData)
      .map((item) =>
        React.createElement(ResilienceItemRehydrator, {
          key: item.id,
          item,
          context,
        }),
      ),
  )

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

  filenameLabel(item, lookups) {
    const scope = item.tileScope ?? "panel"
    // Per-tile slug: the small-multiples kinds carry a tileId that
    // resolves to a scenario / outcome / hydroclimate label. Panel
    // and quadrant captures have nothing to add here.
    const tail =
      scope === "scenario" && item.tileId
        ? slugifyForFilename(lookups.scenarioShortLabelLookup(item.tileId))
        : scope === "outcome" && item.tileId
          ? slugifyForFilename(lookups.outcomeNameLookup(item.tileId))
          : scope === "hydroclimate" && item.tileId
            ? hydroclimateSlug(item.tileId)
            : ""
    // For a hydroclimate small multiple `tail` already names the
    // hydroclimate; appending `hc` again would duplicate it. The
    // other scopes append the captured hydroclimate(s) so two
    // captures of the same scope/tile at different climates don't
    // collide.
    const hc =
      scope === "hydroclimate"
        ? ""
        : item.hydroclimates.length === 1
          ? hydroclimateSlug(item.hydroclimates[0]!)
          : item.hydroclimates.length > 1
            ? "multi-hc"
            : ""
    return ["coeqwal-resilience", scope, tail, hc].filter(Boolean).join("-")
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

  // Quadrant captures have no live resolver today: their CSV shape
  // (paired x/y leverage scores per scenario) isn't reproducible from
  // the URL's scenario / outcome / hydroclimate tuple alone. The
  // bulk exporter silently skips items whose `exportCsv` returns
  // null. Heatmap items get an inner mount that runs
  // `useResilienceAggregate` for the captured scope.
  DataRehydrator: ResilienceRehydrator,
}

export default resilienceHandler
