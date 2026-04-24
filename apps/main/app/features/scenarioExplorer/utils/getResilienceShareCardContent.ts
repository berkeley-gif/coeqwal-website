/**
 * Pure copy and chip builder for resilience Share items. Keeps Share tab
 * and Share drawer aligned without duplicating string logic.
 */

import type { ShareItem } from "../store"
import { RESILIENCE_HYDROCLIMATES } from "../hooks/useResilienceMatrix"
import type { ResilienceHeatmapChartData } from "../exploreView/ResiliencePanel"
import type { ResilienceQuadrantChartData } from "../exploreView/ResilienceQuadrantPanel"

export type ResilienceShareItem = Extract<ShareItem, { type: "resilience" }>

export interface ResilienceShareCardLookups {
  /** Short label for a scenario id (e.g. shortLabel or name). */
  scenarioLabel: (id: string) => string
  /** Display name for an outcome code. */
  outcomeLabel: (code: string) => string
  /** Short hydroclimate label (e.g. HYDROCLIMATE_SHORT_LABELS). */
  hydroShortLabel: (hc: string) => string
}

export interface ResilienceShareCardContent {
  headline: string
  /** Primary context line under the headline. */
  subtitle: string
  /** Optional second line when the live thumbnail is an aggregate summary. */
  thumbnailDisclaimer?: string
  /** Prefix-styled chips: Hydro, Scenarios, Outcomes. */
  chips: string[]
  /** Whether to mount ShareResilienceLiveChart (no PNG and not quadrant). */
  showLiveAggregateFallback: boolean
  /** When true, show `thumbnailDisclaimer` under the live chart. */
  showThumbnailDisclaimer: boolean
}

const PANEL_VIEW_HEADLINE: Record<string, string> = {
  aggregate: "Library overview",
  scenario: "By scenario",
  outcome: "By outcome",
  hydroclimate: "By hydroclimate",
}

function isQuadrantChartData(d: unknown): d is ResilienceQuadrantChartData {
  return (
    typeof d === "object" &&
    d !== null &&
    (d as { kind?: string }).kind === "resilience" &&
    (d as { view?: string }).view === "quadrant"
  )
}

function isHeatmapChartData(d: unknown): d is ResilienceHeatmapChartData {
  return (
    typeof d === "object" &&
    d !== null &&
    (d as { kind?: string }).kind === "resilience" &&
    (d as { view?: string }).view !== "quadrant"
  )
}

function encodingLabel(cellEncoding: string): string {
  if (cellEncoding === "quadrant") return "Quadrant"
  return cellEncoding.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}

function isFullHydroSelection(hydroclimates: string[]): boolean {
  if (hydroclimates.length !== RESILIENCE_HYDROCLIMATES.length) return false
  const set = new Set(hydroclimates)
  return RESILIENCE_HYDROCLIMATES.every((h) => set.has(h))
}

function buildHydroChip(
  hydroclimates: string[],
  hydroShortLabel: (hc: string) => string,
): string {
  if (hydroclimates.length === 0) {
    return "Hydro: (none selected)"
  }
  if (isFullHydroSelection(hydroclimates)) {
    return "Hydro: All three periods"
  }
  return `Hydro: ${hydroclimates.map(hydroShortLabel).join(", ")}`
}

const MAX_SCENARIO_NAMES = 3
const MAX_OUTCOME_NAMES = 5

function buildScenarioChip(
  scenarioIds: string[],
  scenarioLabel: (id: string) => string,
): string {
  if (scenarioIds.length === 0) {
    return "Scenarios: Full library"
  }
  const shown = scenarioIds.slice(0, MAX_SCENARIO_NAMES).map(scenarioLabel)
  const rest = scenarioIds.length - MAX_SCENARIO_NAMES
  if (rest > 0) {
    return `Scenarios: ${shown.join(", ")} (+${rest} more)`
  }
  return `Scenarios: ${shown.join(", ")}`
}

function buildOutcomeChip(
  outcomeCodes: string[],
  outcomeLabel: (code: string) => string,
): string {
  if (outcomeCodes.length === 0) {
    return "Outcomes: (none)"
  }
  const shown = outcomeCodes.slice(0, MAX_OUTCOME_NAMES).map(outcomeLabel)
  const rest = outcomeCodes.length - MAX_OUTCOME_NAMES
  if (rest > 0) {
    return `Outcomes: ${shown.join(", ")} (+${rest} more)`
  }
  return `Outcomes: ${shown.join(", ")}`
}

/**
 * Build title, subtitle, chips, and live-thumbnail flags for a resilience share card.
 */
export function getResilienceShareCardContent(
  item: ResilienceShareItem,
  lookups: ResilienceShareCardLookups,
): ResilienceShareCardContent {
  const cached = item.cachedChartData
  const quadrantCached = isQuadrantChartData(cached) ? cached : null
  const heatmapCached = isHeatmapChartData(cached) ? cached : null

  const showLiveAggregateFallback =
    !item.cachedImageDataUrl && item.view !== "quadrant"

  const needsDisclaimer =
    showLiveAggregateFallback &&
    (item.view !== "aggregate" || item.cellEncoding !== "tier")

  const thumbnailDisclaimer = needsDisclaimer
    ? "Preview: summary aggregate tier heatmap for this scope. Layout and encoding may differ from what you saved."
    : undefined

  const hydroChip = buildHydroChip(item.hydroclimates, lookups.hydroShortLabel)
  const scenarioChip = buildScenarioChip(
    item.scenarioIds,
    lookups.scenarioLabel,
  )
  const outcomeChip = buildOutcomeChip(item.outcomeCodes, lookups.outcomeLabel)
  const chips = [hydroChip, scenarioChip, outcomeChip]
  if (item.view !== "quadrant" && item.showCellNumbers) {
    chips.push("Cell values on")
  }

  if (item.view === "quadrant") {
    const headline =
      quadrantCached?.tileLabel ?? item.tileLabel ?? "Leverage quadrant"

    const enc = encodingLabel(item.cellEncoding)
    const scope =
      item.scenarioIds.length === 0
        ? "Full library"
        : item.scenarioIds.length === 1
          ? "1 scenario in scope"
          : `${item.scenarioIds.length} scenarios in scope`

    let subtitle: string
    if (quadrantCached?.xLabel && quadrantCached?.yLabel) {
      const axisShort = (s: string) => {
        const i = s.indexOf("(")
        return i > 0 ? s.slice(0, i).trim() : s
      }
      subtitle = `${scope} · ${axisShort(quadrantCached.xLabel)} / ${axisShort(quadrantCached.yLabel)}`
    } else {
      subtitle = `${enc} · ${scope}`
    }

    return {
      headline,
      subtitle,
      chips,
      showLiveAggregateFallback: false,
      showThumbnailDisclaimer: false,
      thumbnailDisclaimer: undefined,
    }
  }

  const tileLabelFromItem = item.tileLabel
  const tileLabelFromHeatmapCache = heatmapCached?.tileLabel
  const effectiveTileLabel = tileLabelFromHeatmapCache ?? tileLabelFromItem

  const isTileCapture =
    item.tileScope === "scenario" ||
    item.tileScope === "outcome" ||
    item.tileScope === "hydroclimate"

  let headline: string
  if (isTileCapture && (effectiveTileLabel || item.tileId)) {
    const kind =
      item.tileScope === "scenario"
        ? "Scenario"
        : item.tileScope === "outcome"
          ? "Outcome"
          : item.tileScope === "hydroclimate"
            ? "Hydroclimate"
            : null
    const labelFromId =
      item.tileId && item.tileScope === "scenario"
        ? lookups.scenarioLabel(item.tileId)
        : item.tileId && item.tileScope === "outcome"
          ? lookups.outcomeLabel(item.tileId)
          : item.tileId && item.tileScope === "hydroclimate"
            ? lookups.hydroShortLabel(item.tileId)
            : null
    const label = effectiveTileLabel ?? labelFromId ?? "Tile"
    headline = kind ? `${kind}: ${label}` : label
  } else {
    const viewSource = heatmapCached?.view ?? item.view
    const viewKey = viewSource in PANEL_VIEW_HEADLINE ? viewSource : "aggregate"
    const viewPhrase =
      PANEL_VIEW_HEADLINE[viewKey] ?? PANEL_VIEW_HEADLINE.aggregate
    headline = `Resilience · full panel · ${viewPhrase}`
  }

  const enc = encodingLabel(item.cellEncoding)
  const scope =
    item.scenarioIds.length === 0
      ? "Full library"
      : item.scenarioIds.length === 1
        ? "1 scenario in scope"
        : `${item.scenarioIds.length} scenarios in scope`

  const subtitle = `${enc} · ${scope}`

  return {
    headline,
    subtitle,
    chips,
    showLiveAggregateFallback,
    showThumbnailDisclaimer: Boolean(thumbnailDisclaimer),
    thumbnailDisclaimer,
  }
}
