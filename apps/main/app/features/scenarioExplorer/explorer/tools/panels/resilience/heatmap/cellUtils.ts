import type {
  ResilienceHeatmapCell,
  ResilienceSmallMultiplesTile,
  ResilienceAxisItem,
  ResilienceCellRender,
} from "@repo/viz"
import type { CellEncoding, DeltaMode, ResilienceView } from "../../../../store"
import { getOutcomeName } from "../../../../../../../content/outcomes"
import type { HoveredInteraction } from "../../../../useExploreHoverCoordination"

export { clampTier } from "@repo/viz"

/** Swap row and column keys + labels on a heatmap cell */
export function transposeCell(
  cell: ResilienceHeatmapCell,
): ResilienceHeatmapCell {
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
  deltaMode: DeltaMode,
): ResilienceCellRender {
  return deltaMode !== "none" ? "delta" : "tier"
}

export function getMapLinkBlockedMessage(
  cellEncoding: CellEncoding,
  hasOutcome: boolean,
): string {
  if (!hasOutcome) {
    return "This cell isn't tied to a mappable outcome."
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
): string | null {
  if (cell.scenarioId) return cell.scenarioId
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
