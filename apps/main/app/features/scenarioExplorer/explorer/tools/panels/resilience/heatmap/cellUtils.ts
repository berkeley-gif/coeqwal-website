import type {
  ResilienceHeatmapCell,
  ResilienceSmallMultiplesTile,
  ResilienceAxisItem,
  ResilienceCellRender,
} from "@repo/viz"
import type {
  AggregateOver,
  CellEncoding,
  DeltaMode,
  ResilienceView,
} from "../../../../store"
import { getOutcomeName } from "../../../../../../../content/outcomes"
import type { HoveredInteraction } from "../../../../useExploreHoverCoordination"

export function clampTier(value: number): number {
  return Math.min(4, Math.max(1, Math.round(value)))
}

/** Swap row and column keys + labels on a heatmap cell */
export function transposeCell(cell: ResilienceHeatmapCell): ResilienceHeatmapCell {
  return {
    ...cell,
    rowKey: cell.colKey,
    colKey: cell.rowKey,
    rowLabel: cell.colLabel,
    rowLabelFull: cell.colLabelFull,
    colLabel: cell.rowLabel,
    colLabelFull: cell.rowLabelFull,
  }
}

export function transposeHeatmap(
  rows: ResilienceAxisItem[],
  columns: ResilienceAxisItem[],
  cells: ResilienceHeatmapCell[],
): {
  rows: ResilienceAxisItem[]
  columns: ResilienceAxisItem[]
  cells: ResilienceHeatmapCell[]
} {
  return {
    rows: columns,
    columns: rows,
    cells: cells.map(transposeCell),
  }
}

export function transposeTile(
  tile: ResilienceSmallMultiplesTile,
): ResilienceSmallMultiplesTile {
  return {
    ...tile,
    cells: tile.cells.map(transposeCell),
  }
}

export function resolveCellRender(
  view: ResilienceView,
  encoding: CellEncoding,
  deltaMode: DeltaMode,
  aggregateOver: AggregateOver = "scenarios",
): ResilienceCellRender {
  if (view === "aggregate") {
    if (encoding === "density_opp") {
      return encoding
    }
    if (encoding === "glyph") return "glyph"
    if (encoding === "distribution") return "distribution"
    if (encoding === "leverage") {
      return aggregateOver === "outcomes" ? "tier" : "leverage"
    }
    if (aggregateOver === "hydroclimates") return "tier"
    return deltaMode !== "none" ? "delta" : "tier"
  }
  return deltaMode !== "none" ? "delta" : "tier"
}

export function getMapLinkBlockedMessage(
  effectiveView: ResilienceView,
  cellEncoding: CellEncoding,
  hasOutcome: boolean,
): string {
  if (!hasOutcome) {
    return "This cell isn't tied to a mappable outcome."
  }
  if (effectiveView === "aggregate") {
    return "Overview cells aggregate many scenarios or outcomes, so they don't open a single slice on the map. Switch to Scenarios, Outcomes, or Hydroclimates to link cells to the map."
  }
  if (
    cellEncoding === "delta" ||
    cellEncoding === "density_opp" ||
    cellEncoding === "leverage"
  ) {
    return "This cell shows a derived metric, not a single scenario tier, so it doesn't drive the map."
  }
  return "This cell can't be linked to the map from the current view."
}

export function resolveScenarioIdFromCell(
  cell: ResilienceHeatmapCell,
  effectiveView: ResilienceView,
  aggregateOver: AggregateOver,
): string | null {
  if (cell.scenarioId) return cell.scenarioId
  if (effectiveView === "aggregate") {
    if (aggregateOver === "outcomes") return cell.rowKey
    if (aggregateOver === "hydroclimates") return cell.colKey
  }
  return null
}

export function hoverPayloadFromCell(
  cell: ResilienceHeatmapCell,
  scenarioId: string,
): HoveredInteraction {
  const outcome =
    cell.outcomeCode != null ? getOutcomeName(cell.outcomeCode) : undefined
  const tierValue = cell.tierLevel ?? cell.continuousValue ?? undefined
  return {
    scenarioId,
    ...(outcome ? { outcome } : {}),
    ...(tierValue != null ? { tierValue } : {}),
  }
}
