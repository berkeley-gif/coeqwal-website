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
    return "This cell shows a derived metric, not a single scenario's outcome level, so it doesn't drive the map."
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

/**
 * Whether a heatmap cell is the one on the map: the map shows the cell's
 * outcome for exactly the scenario the cell stands for under its own
 * hydroclimate. Clicking such a cell takes it off the map, and it is drawn
 * outlined. Matching on the resolved scenario id (not on the requested
 * hydroclimate) means a cell never claims a climate the map is not
 * showing, e.g. while a climate variant has not resolved yet.
 *
 * @param cell - the heatmap cell (its scenarioId is a scenario group id)
 * @param active - the outcome on the map and the resolved scenario id it
 *   shows, or null when nothing is mapped
 * @param getResolvedId - the scenario id a group resolves to under a
 *   hydroclimate (from the resolver hooks), undefined when unresolved
 * @param fallbackScenarioId - the group a cell without a scenario maps
 * @param hydroclimate - the hydroclimate for a cell without one
 * @returns true when the cell matches the mapped outcome
 */
export function getIsCellMapped(
  cell: ResilienceHeatmapCell,
  active: { outcomeCode: string; scenarioId: string } | null,
  getResolvedId: (groupId: string, hydroclimate: string) => string | undefined,
  fallbackScenarioId: string,
  hydroclimate: string,
): boolean {
  if (!active || !cell.available || !cell.outcomeCode) return false
  if (cell.outcomeCode !== active.outcomeCode) return false
  const resolvedId = getResolvedId(
    cell.scenarioId ?? fallbackScenarioId,
    cell.hydroclimate ?? hydroclimate,
  )
  return resolvedId != null && resolvedId === active.scenarioId
}

/**
 * The cell to draw as selected: the first cell, across tiles, that is on
 * the map (see `getIsCellMapped`).
 *
 * @param tiles - the heatmap tiles, in display order
 * @param isMapped - whether a cell is the mapped one
 * @returns the tile id and `${rowKey}|${colKey}` of that cell, or null
 */
export function getMappedCell(
  tiles: ReadonlyArray<ResilienceSmallMultiplesTile>,
  isMapped: (cell: ResilienceHeatmapCell) => boolean,
): { tileId: string; cellKey: string } | null {
  for (const tile of tiles) {
    for (const cell of tile.cells) {
      if (isMapped(cell)) {
        return { tileId: tile.id, cellKey: `${cell.rowKey}|${cell.colKey}` }
      }
    }
  }
  return null
}
