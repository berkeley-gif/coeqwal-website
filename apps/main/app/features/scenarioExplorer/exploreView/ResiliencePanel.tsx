"use client"

/**
 * ResiliencePanel - resilience heatmap.
 *
 * Hydroclimates run along the X axis; rows are either outcomes (scenario
 * and aggregate views) or scenarios (outcome view). Cells render in one
 * of several modes:
 *   - tier:    categorical tier fill + continuous mean value.
 *   - delta:   diverging fill around 0 with signed delta vs a baseline.
 *   - glyph:   sub-tile grid inside each cell, one tile per scenario.
 *
 * Control state is lifted to ScenarioExplorer.tsx; this panel only
 * consumes it. Data comes from useResilienceMatrix for individual cells
 * and useResilienceAggregate for aggregate-view cells.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from "react"
import {
  Box,
  Checkbox,
  CircularProgress,
  Snackbar,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import { motion, AnimatePresence, useReducedMotion } from "@repo/motion"
import {
  ResilienceHeatmap,
  ResilienceHeatmapSmallMultiples,
  type ResilienceAxisItem,
  type ResilienceHeatmapCell,
  type ResilienceHeatmapPalette,
  type ResilienceHeatmapMarginals,
  type ResilienceCellRender,
  type ResilienceGlyphEntry,
  type ResilienceSmallMultiplesTile,
  hierarchicalRowOrder,
} from "@repo/viz"
import { useScenarioExplorerStore } from "../store"
import {
  useResilienceMatrix,
  type ResilienceHydroclimate,
} from "../hooks/useResilienceMatrix"
import { useResilienceAggregate } from "../hooks/useResilienceAggregate"
import { useResilienceLoiDistribution } from "../hooks/useResilienceLoiDistribution"
import { useOutcomeMapAction } from "../../map/hooks"
import { mapActions, type LocationHighlight } from "../../map/store"
import { getOutcomeLocationCoordinates } from "../../map/config/outcomeLocations"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  getOutcomeDefinition,
  type OutcomeCode,
} from "../../../content/outcomes"
import {
  hydroclimateOptions,
  HYDROCLIMATE_SHORT_LABELS,
} from "../../../content/scenarios"
import { TIER_LABELS, getTierLabel } from "../../../content/tiers"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../utils/scenarioIdSort"
import { useTourAnchor } from "../tour/TourAnchorContext"
import {
  captureElementToBlob,
  captureSvgToBlob,
} from "../dataExplorer/utils/exportUtils"

export type ResilienceView =
  | "scenario"
  | "outcome"
  | "hydroclimate"
  | "aggregate"
  | "quadrant"

/**
 * Which axis of the (scenario, outcome, hydroclimate) cube the
 * aggregate view reduces over. Only meaningful when `view === "aggregate"`.
 *
 *   - `scenarios`   (default): rows=outcomes, cols=hydroclimates; each
 *                   cell aggregates across the scenario scope. This is
 *                   the behavior the aggregate view has always had.
 *   - `outcomes`:   rows=scenarios, cols=hydroclimates; each cell
 *                   aggregates across outcomes. Mixes units across rows
 *                   so continuous-mean / delta / leverage encodings are
 *                   disabled - tier / density / distribution still work.
 *   - `hydroclimates`: rows=outcomes, cols=scenarios; each cell
 *                   aggregates across hydroclimates. `deltaMode` is
 *                   forced to `none` because `historical` is itself one
 *                   of the members being reduced.
 */
export type AggregateOver = "scenarios" | "outcomes" | "hydroclimates"

/**
 * Cell encoding selects how each cell's fill / value is computed and drawn.
 * - `tier`: categorical tier color + arithmetic mean value (current default).
 * - `delta`: diverging color around 0, fed by `deltaMode`.
 * - `density_opp`: fraction in Tier 2- (green ramp, aggregate view only).
 * - `glyph`: sub-tile grid inside each cell, one tile per scenario
 *   (aggregate view only, legacy).
 * - `distribution`: stacked tier-colored horizontal bars inside each cell
 *   (aggregate view only); mirrors the MorphableDistributionGlyph "bars"
 *   mode used in Learn mode.
 * - `leverage`: monochromatic ramp over the tier range across sibling
 *   operations (aggregate view only).
 */
export type CellEncoding =
  | "tier"
  | "delta"
  | "density_opp"
  | "glyph"
  | "distribution"
  | "leverage"

/**
 * Flat, CSV-friendly row shape for a single captured heatmap cell.
 * Mirrors the fields we can reasonably derive from `ResilienceHeatmapCell`
 * without reaching back into the source matrix.
 */
export interface ResilienceChartDataRow {
  rowKey: string
  rowLabel: string
  colKey: string
  colLabel: string
  tier?: number
  value?: number
  delta?: number
  count?: number
}

/**
 * Payload handed off to the Share drawer when the resilience heatmap
 * is snapshotted. Consumers should treat it as opaque data; the CSV
 * export is the only reader that inspects the row shape today.
 */
export interface ResilienceHeatmapChartData {
  kind: "resilience"
  view: ResilienceView
  cellEncoding: CellEncoding
  tileScope: "panel" | "scenario" | "outcome" | "hydroclimate"
  tileLabel?: string
  rows: ResilienceChartDataRow[]
}

export interface ResilienceCaptureResult {
  dataUrl: string
  chartData: ResilienceHeatmapChartData
}

export type ResilienceCaptureFn = () => Promise<ResilienceCaptureResult | null>
export type ResilienceTileCaptureFn = (
  tileId: string,
) => Promise<ResilienceCaptureResult | null>

/**
 * Delta baseline selector. When `none`, no delta is computed.
 * - `vs_historical`: per-(scenario, outcome) climate delta; historical column is 0.
 * - `vs_baseline`: per-(outcome, hc) delta vs `deltaBaselineScenarioId`.
 */
export type DeltaMode = "none" | "vs_historical" | "vs_baseline"

export type AggregateScope = "all" | "selected"

/**
 * Unit of analysis for the quadrant view.
 * - `outcome`: one dot per outcome, averaged across sibling groups.
 * - `loi`: one dot per location of interest, within a single outcome.
 */
export type QuadrantUnit = "outcome" | "loi"

export interface ResilienceControlsState {
  view: ResilienceView
  cellEncoding: CellEncoding
  deltaMode: DeltaMode
  deltaBaselineScenarioId: string
  aggregateScope: AggregateScope
  reorderBySimilarity: boolean
  showMarginals: boolean
  /**
   * Sidebar-driven scope for the by-scenario and by-outcome views. When
   * false (default), these views read `selectedScenarios` from the store
   * and render an empty-state prompt when none are pinned. When true,
   * they fall back to all 24 scenarios. Mirrors the `radarShowAll`
   * pattern in RadarPanel.
   */
  showAllScenarios: boolean
  /**
   * When non-null, the heatmap swaps its small-multiples grid for a
   * single full-size tile matching this id. Used by the "click-to-expand"
   * gesture on each tile's expand icon (and by drill-through actions
   * like the quadrant view). The id is a scenario id in the by-scenario
   * view, or an outcome code in the by-outcome view. The expanded view
   * is dismissed with a Back button or the Esc key, which clears this
   * back to null.
   */
  expandedTileId: string | null
  selectedHydroclimates: ReadonlySet<ResilienceHydroclimate>
  showCellNumbers: boolean
  quadrantUnit: QuadrantUnit
  quadrantOutcome: string | null
  /**
   * Outcome mode primary focus. When set, Outcome mode renders a
   * single heatmap for this outcome. When null, Outcome mode shows
   * an empty state inviting the user to pick an outcome.
   */
  primaryOutcomeCode: string | null
  /**
   * Extra outcomes rendered as small multiples alongside the primary
   * in Outcome mode. Empty by default.
   */
  compareOutcomeCodes: string[]
  /**
   * Per-outcome radar-style regional expansion: each aggregate outcome
   * code listed here has its NOD/SOD variants interleaved into the Y
   * axis. Empty by default; the user opts in one outcome at a time.
   */
  expandedRegionalOutcomes: string[]
  /**
   * Swap rows and columns at the final render stage. A pure view-level
   * transform that doesn't change what data is on the chart - just
   * what's on the Y vs X axis. Shared across every view so the user can
   * toggle it once and have it stick when they pivot between
   * per-scenario / per-outcome / per-hydroclimate.
   */
  transposed: boolean
  /**
   * Which axis the aggregate view reduces over. See `AggregateOver`.
   * Only consulted when `view === "aggregate"`.
   */
  aggregateOver: AggregateOver
}

interface ResiliencePanelProps {
  controls: ResilienceControlsState
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
  /**
   * Optional callback for mutating the shared control state. When
   * provided, the floating corner toolbar (transpose and display menu)
   * renders on the chart; when omitted, it is hidden (read-only
   * previews).
   */
  onControlsChange?: (next: Partial<ResilienceControlsState>) => void
  /**
   * Invoked once after mount with a function that captures the full
   * chart area as a PNG + flat cell data. Mirrors the pattern
   * `RadarPanel` uses via `onCaptureReady`, letting `ScenarioExplorer`
   * stash the capture fn in a ref and call it from the "save
   * snapshot" toolbar button.
   */
  onCaptureReady?: (capture: ResilienceCaptureFn) => void
  /**
   * Invoked once after mount with a function that captures a single
   * small-multiples tile (by its tile id) as a PNG + flat cell data.
   * Null result means the tile id was not visible (e.g. it was in a
   * view mode the panel is no longer rendering).
   */
  onCaptureTileReady?: (capture: ResilienceTileCaptureFn) => void
  /**
   * Invoked when the user clicks a per-tile share icon inside the
   * small-multiples grid. Consumers typically call the function
   * produced by `onCaptureTileReady` and then add a ShareItem.
   */
  onTileShare?: (tileId: string) => void
}

const HYDROCLIMATE_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  hydroclimateOptions.map((h) => [h.value, h.description]),
)

const HYDROCLIMATE_LABELS: Record<string, string> = Object.fromEntries(
  hydroclimateOptions.map((h) => [h.value, h.label]),
)

const HISTORICAL_HC: ResilienceHydroclimate = "historical"

function clampTier(value: number): number {
  return Math.min(4, Math.max(1, Math.round(value)))
}

/**
 * Transpose a heatmap cell: swap its row and column keys + labels.
 * Used by the panel-level transpose transform so every view path
 * can support a "pivot rows and columns" toggle without the viz
 * components or buildValueFn knowing about it.
 */
function transposeCell(cell: ResilienceHeatmapCell): ResilienceHeatmapCell {
  return {
    ...cell,
    rowKey: cell.colKey,
    colKey: cell.rowKey,
    rowLabel: cell.colLabel,
    colLabel: cell.rowLabel,
  }
}

/**
 * Transpose an entire (rows, columns, cells) triple. Pure and order-
 * preserving: row i of the input becomes column i of the output.
 */
function _transposeHeatmap(
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

/**
 * Transpose a small-multiples tile: each tile's cells flip their
 * row/col keys. The tile's own rows/columns axes are shared at the
 * parent level and swapped there; this only touches cell data.
 */
function transposeTile(
  tile: ResilienceSmallMultiplesTile,
): ResilienceSmallMultiplesTile {
  return {
    ...tile,
    cells: tile.cells.map(transposeCell),
  }
}

/**
 * Resolve the effective viz-level cell renderer from the logical state.
 * Glyph, distribution, and legacy density_opp are aggregate-only. Some
 * encodings become incoherent when the aggregate view reduces over
 * outcomes (mixed units across rows) or hydroclimates (no "historical"
 * reference column):
 *
 *   - `aggregateOver=outcomes`: disable `leverage` and (implicitly)
 *     `delta` - fall back to tier. Distribution still works because it
 *     operates on tier levels which are unit-free.
 *   - `aggregateOver=hydroclimates`: `deltaMode` is forced to `none` in
 *     the value fn, so there's no delta to resolve here; all other
 *     encodings are left alone.
 */
function resolveCellRender(
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
      // Leverage is a per-(outcome, hc) tier-range metric across the
      // reduced members - only meaningful when rows share units. Fall
      // back to the tier encoding when aggregating over outcomes.
      return aggregateOver === "outcomes" ? "tier" : "leverage"
    }
    // tier / delta. Delta requires a reference column; force tier when
    // the aggregate reduces away the hydroclimate axis.
    if (aggregateOver === "hydroclimates") return "tier"
    return deltaMode !== "none" ? "delta" : "tier"
  }
  return deltaMode !== "none" ? "delta" : "tier"
}

/**
 * Compose the Snackbar copy shown when a heatmap cell click cannot
 * drive the map. Each branch explains the specific gating reason so
 * the message never sounds like a global "maps aren't ready" failure.
 * The derived-encoding branch is mostly defensive: the Read-as chooser
 * has been removed and `ResilienceControls` coerces the encoding back
 * to tier, but a stale preset or URL can still deliver a derived value
 * transiently before the coercion effect runs.
 */
function getMapLinkBlockedMessage(
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

export default function ResiliencePanel({
  controls,
  highlightedIds = null,
  onScenarioHover,
  onControlsChange,
  onCaptureReady,
  onCaptureTileReady,
  onTileShare,
}: ResiliencePanelProps) {
  const theme = useTheme()
  const {
    view,
    cellEncoding,
    deltaMode,
    deltaBaselineScenarioId,
    aggregateScope,
    reorderBySimilarity,
    showMarginals,
    showAllScenarios,
    expandedTileId,
    selectedHydroclimates,
    showCellNumbers,
    primaryOutcomeCode,
    compareOutcomeCodes,
    expandedRegionalOutcomes,
    transposed,
    aggregateOver,
  } = controls

  const { selectedScenarios } = useScenarioExplorerStore()
  const setHighlightedScenario = useScenarioExplorerStore(
    (s) => s.setHighlightedScenario,
  )
  const showResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.showResilienceOutcomeSelector,
  )
  const setShowResilienceOutcomeSelector = useScenarioExplorerStore(
    (s) => s.setShowResilienceOutcomeSelector,
  )
  const resilienceVisibleOutcomes = useScenarioExplorerStore(
    (s) => s.resilienceVisibleOutcomes,
  )
  const toggleResilienceOutcome = useScenarioExplorerStore(
    (s) => s.toggleResilienceOutcome,
  )
  const setResilienceVisibleOutcomes = useScenarioExplorerStore(
    (s) => s.setResilienceVisibleOutcomes,
  )
  const distributionMode = useScenarioExplorerStore(
    (s) => s.resilienceDistributionMode,
  )
  // Map hydroclimate lives on the scenario explorer store. The toolbar
  // `HydroclimateChooser` writes to the same setter; we call it when the
  // user clicks a heatmap cell so the map repaints for that cell's
  // hydroclimate via the existing sibling-group resolution path.
  const setHydroclimate = useScenarioExplorerStore((s) => s.setHydroclimate)

  // Legacy walkthrough-open state (unused; guide lives in ResilienceControls).
  // const [walkthroughOpen, setWalkthroughOpen] = useState(false)

  // Effective per-view scenario scope. Mirrors the radar-panel pattern:
  // when showAllScenarios is off, respect sidebar `selectedScenarios`;
  // when on, fall back to all 24. Phase 1 renders a single heatmap; the
  // by-scenario branch picks the first item as its focus and later
  // phases will fan this out into small multiples.
  const _effectiveScenarioScope = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return [] // sentinel: "all" resolved from matrix
    return selectedScenarios
  }, [showAllScenarios, selectedScenarios])

  // Scenarios mode is sidebar-driven: when selection is non-empty we
  // render small multiples of those scenarios, and when it is empty we
  // fall through to the Overview aggregate view. This is not a silent
  // mode swap; the rail entry is named "Scenarios" precisely because
  // both states are expected. Outcome mode still has an explicit empty
  // state when no primary outcome has been chosen.
  const scenarioRendersAsOverview =
    view === "scenario" && selectedScenarios.length === 0
  // "Empty" per-outcome only when neither the outcome-axis picker nor
  // the primary/compare fields yield any renderable outcome - the axis
  // picker is authoritative for what rows the chart shows, so treat it
  // as the first source before falling back to "pick a primary".
  const hasOutcomeAxisSelection = useMemo(
    () =>
      resilienceVisibleOutcomes.some(
        (c) => !(NOD_SOD_OUTCOME_CODES as readonly string[]).includes(c),
      ),
    [resilienceVisibleOutcomes],
  )
  const outcomeEmpty =
    view === "outcome" &&
    primaryOutcomeCode == null &&
    compareOutcomeCodes.length === 0 &&
    !hasOutcomeAxisSelection
  const anyEmpty = outcomeEmpty
  const effectiveView: ResilienceView = scenarioRendersAsOverview
    ? "aggregate"
    : view

  const {
    scenarioIds,
    scenarios,
    cells: matrixCells,
    getCell,
    hydroclimates,
    getDisplayName,
    isLoading,
    error,
  } = useResilienceMatrix()

  /**
   * Heatmap axis ticks use the API `shortCode` (e.g. s0020) so dense
   * columns of scenarios stay legible; `fullLabel` and optional
   * `definitionTooltip` carry the long name and description for hover.
   */
  const resolveScenarioAxisItem = useCallback(
    (sid: string): ResilienceAxisItem => {
      const s = scenarios.find((x) => x.scenarioId === sid)
      const full = getDisplayName(sid)
      return {
        key: sid,
        label: s?.shortCode ?? sid,
        fullLabel: full,
        definitionTooltip:
          s?.description && s.description.length > 0 ? s.description : undefined,
      }
    },
    [scenarios, getDisplayName],
  )

  const {
    showOutcomeOnMap,
    showOutcomeOnMapFixed,
    isOutcomeActive,
    isMapVisible,
    activeOutcome,
  } = useOutcomeMapAction()

  // Aggregate hook reads the already-fetched matrix. We key it on the
  // effective scope so it only recomputes when the set changes.
  const aggregateScenarioIds = useMemo(() => {
    if (aggregateScope === "selected") return selectedScenarios
    return undefined
  }, [aggregateScope, selectedScenarios])

  // When the aggregate view is reducing over outcomes or hydroclimates,
  // we route the same hook through a different `groupBy` axis. The hook
  // returns cells keyed by (rowKey, colKey) that match the corresponding
  // 2D slice: scenarios×HC (groupBy=outcomes) or outcomes×scenarios
  // (groupBy=hydroclimates). All other views still use the legacy axis
  // (groupBy=scenarios) because their rows / cols are concrete
  // (matrix-backed) rather than aggregated.
  const aggregateGroupBy =
    effectiveView === "aggregate" ? aggregateOver : "scenarios"

  const aggregate = useResilienceAggregate({
    scenarioIds: aggregateScenarioIds,
    groupBy: aggregateGroupBy,
  })

  // Tier colors from the theme (primitive-only for stable memo).
  const tier1 = theme.palette.tiers.tier1
  const tier2 = theme.palette.tiers.tier2
  const tier3 = theme.palette.tiers.tier3
  const tier4 = theme.palette.tiers.tier4
  const tierColors = useMemo(
    () => [tier1, tier2, tier3, tier4] as const,
    [tier1, tier2, tier3, tier4],
  )

  const tierLabels = useMemo(
    () =>
      [TIER_LABELS[1], TIER_LABELS[2], TIER_LABELS[3], TIER_LABELS[4]] as const,
    [],
  )

  // Chrome / neutral colors for the heatmap pulled from the app theme so
  // the viz component stays theme-agnostic.
  const textPrimary = theme.palette.text.primary
  const commonWhite = theme.palette.common.white
  const grey100 = theme.palette.grey[100]
  const grey300 = theme.palette.grey[300]
  const grey400 = theme.palette.grey[400]
  const grey600 = theme.palette.grey[600]
  const grey700 = theme.palette.grey[700]
  const divNegStrong = theme.palette.tierDiverging.negStrong
  const divNegWeak = theme.palette.tierDiverging.negWeak
  const divZero = theme.palette.tierDiverging.zero
  const divPosWeak = theme.palette.tierDiverging.posWeak
  const divPosStrong = theme.palette.tierDiverging.posStrong
  const densOppMin = theme.palette.tierDensity.oppMin
  const densOppMax = theme.palette.tierDensity.oppMax
  const leverageMin = theme.palette.tierLeverage.min
  const leverageMax = theme.palette.tierLeverage.max
  const heatmapPalette = useMemo<ResilienceHeatmapPalette>(
    () => ({
      text: textPrimary,
      textMuted: grey700,
      hoverStroke: textPrimary,
      onDarkTier: commonWhite,
      onLightTier: textPrimary,
      unavailableFill: grey100,
      unavailableStroke: grey400,
      unavailableHatch: grey300,
      axisHintUnderline: grey400,
      tooltipBg: commonWhite,
      tooltipBorder: grey300,
      tooltipShadow: `0 2px 8px ${grey600}1F`,
      divergingNegStrong: divNegStrong,
      divergingNegWeak: divNegWeak,
      divergingZero: divZero,
      divergingPosWeak: divPosWeak,
      divergingPosStrong: divPosStrong,
      densityOppMin: densOppMin,
      densityOppMax: densOppMax,
      leverageMin,
      leverageMax,
    }),
    [
      textPrimary,
      commonWhite,
      grey100,
      grey300,
      grey400,
      grey600,
      grey700,
      divNegStrong,
      divNegWeak,
      divZero,
      divPosWeak,
      divPosStrong,
      densOppMin,
      densOppMax,
      leverageMin,
      leverageMax,
    ],
  )

  // Hydroclimate (X axis) items: the selected HC chips in canonical
  // order. Used by every view whose column axis is hydroclimates: by-
  // scenario tiles, by-outcome tiles, and the aggregate view unless it
  // is reducing over hydroclimates (where the column axis becomes
  // scenarios, see `columns` below).
  const hydroclimateColumns: ResilienceAxisItem[] = useMemo(() => {
    return hydroclimates
      .filter((hc) => selectedHydroclimates.has(hc))
      .map((hc) => {
        const long = HYDROCLIMATE_LABELS[hc] ?? hc
        const short = HYDROCLIMATE_SHORT_LABELS[hc] ?? long
        return {
          key: hc,
          label: short,
          fullLabel: short !== long ? long : undefined,
          definitionTooltip: HYDROCLIMATE_DESCRIPTIONS[hc],
        }
      })
  }, [hydroclimates, selectedHydroclimates])

  // Scenario-as-columns axis. Used by the aggregate view when
  // aggregateOver="hydroclimates" and by the per-hydroclimate small
  // multiples (each tile has scenarios on X). Respects the
  // aggregate-scope filter when the aggregate view drives it.
  const scenarioColumnItems = useMemo<ResilienceAxisItem[]>(() => {
    const ids =
      effectiveView === "aggregate" &&
      aggregateScope === "selected" &&
      selectedScenarios.length > 0
        ? selectedScenarios
        : scenarioIds
    return ids.map((sid) => resolveScenarioAxisItem(sid))
  }, [
    effectiveView,
    aggregateScope,
    selectedScenarios,
    scenarioIds,
    resolveScenarioAxisItem,
  ])

  // Main column axis used by the single-heatmap render path (the
  // aggregate view only; pivoted views always render as small
  // multiples). Small multiples tiles always read `hydroclimateColumns`
  // or `scenarioColumnItems` directly depending on the per-tile
  // semantics.
  const columns: ResilienceAxisItem[] = useMemo(() => {
    if (effectiveView === "aggregate" && aggregateOver === "hydroclimates") {
      return scenarioColumnItems
    }
    return hydroclimateColumns
  }, [effectiveView, aggregateOver, scenarioColumnItems, hydroclimateColumns])

  // Outcome-row order. Both Scenario and Overview honor the user's
  // Rows chooser (`resilienceVisibleOutcomes`); Scenario mode adds no
  // extra filtering but is no longer forced to the full outcome list.
  // NOD/SOD variants are interleaved whenever the parent outcome is
  // listed in `expandedRegionalOutcomes`, or when the user has
  // explicitly picked a variant in Overview.
  //   - Outcome mode: handled separately via outcomeSmallMultiplesCodes.
  const regionalExpandSet = useMemo(
    () => new Set(expandedRegionalOutcomes),
    [expandedRegionalOutcomes],
  )
  const outcomeRowCodes = useMemo(() => {
    const rows: string[] = []
    const selected = new Set(resilienceVisibleOutcomes)
    if (view === "scenario") {
      for (const code of OUTCOME_CODE_ORDER) {
        if (!selected.has(code)) continue
        rows.push(code)
        if (regionalExpandSet.has(code)) {
          const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
          if (variants) {
            for (const v of variants) rows.push(v)
          }
        }
      }
      return rows
    }
    // Overview / Outcome mode: fall back to the existing Rows-backed set.
    for (const code of OUTCOME_CODE_ORDER) {
      if (selected.has(code)) rows.push(code)
      const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
      if (variants) {
        const expanded = regionalExpandSet.has(code)
        for (const v of variants) {
          // Overview mode keeps the user's explicit regional picks; when
          // they expand the parent we also auto-insert the variants.
          if (selected.has(v) || expanded) rows.push(v)
        }
      }
    }
    return rows
  }, [view, resilienceVisibleOutcomes, regionalExpandSet])

  // Outcome-mode small-multiples codes. Driven primarily by the
  // outcome-axis picker (`resilienceVisibleOutcomes`) so the per-outcome
  // view is never empty when the aggregate view has rows to show. A
  // user-chosen "primary outcome" floats to the front, and any compare
  // codes follow it; remaining visible outcomes fill in after. Regional
  // NOD/SOD variants are dropped at tile level (they don't have
  // standalone definitions).
  const outcomeSmallMultiplesCodes = useMemo<string[]>(() => {
    if (view !== "outcome") return []
    const isAggregate = (c: string) =>
      !(NOD_SOD_OUTCOME_CODES as readonly string[]).includes(c)
    const seen = new Set<string>()
    const out: string[] = []
    const push = (code: string) => {
      if (!isAggregate(code)) return
      if (seen.has(code)) return
      out.push(code)
      seen.add(code)
    }
    if (primaryOutcomeCode) push(primaryOutcomeCode)
    for (const code of compareOutcomeCodes) push(code)
    for (const code of resilienceVisibleOutcomes) push(code)
    return out
  }, [view, primaryOutcomeCode, compareOutcomeCodes, resilienceVisibleOutcomes])

  // Per-LOI distribution fetch (only when the "By location" sub-mode is
  // active for the distribution cell encoding). Scoped to the current
  // view's visible scenarios so we don't over-fetch; NOD/SOD aggregate
  // rows are skipped because they're already regional roll-ups.
  const loiDistributionEnabled =
    cellEncoding === "distribution" &&
    distributionMode === "location" &&
    view !== "quadrant"

  const loiDistributionScope = useMemo<readonly string[]>(() => {
    if (!loiDistributionEnabled) return []
    if (view === "aggregate") {
      return aggregateScenarioIds ?? scenarioIds
    }
    // By-scenario and by-outcome views both fall back to all 24 when no
    // sidebar selection is present.
    if (showAllScenarios || selectedScenarios.length === 0) {
      return scenarioIds
    }
    return selectedScenarios
  }, [
    loiDistributionEnabled,
    view,
    aggregateScenarioIds,
    scenarioIds,
    showAllScenarios,
    selectedScenarios,
  ])

  const loiDistributionOutcomes = useMemo<readonly string[]>(() => {
    if (!loiDistributionEnabled) return []
    if (view === "outcome") return OUTCOME_CODE_ORDER as readonly string[]
    return outcomeRowCodes.filter(
      (c) => !(NOD_SOD_OUTCOME_CODES as readonly string[]).includes(c),
    )
  }, [loiDistributionEnabled, view, outcomeRowCodes])

  const loiDistribution = useResilienceLoiDistribution({
    outcomeCodes: loiDistributionOutcomes,
    scopeScenarioIds: loiDistributionScope,
    enabled: loiDistributionEnabled,
  })
  // Destructure stable members so consumers can list them as memo deps
  // without invalidating on every render (the hook returns a new object
  // literal each call, which would otherwise cascade through buildValueFn
  // → cells → updateChart and rebuild the SVG on every parent re-render -
  // observed as a hover-induced infinite render loop on outcomes whose
  // hover sets hoveredSquareHighlight to a non-null value).
  const loiByCell = loiDistribution.byCell
  const loiBuildEntriesForScope = loiDistribution.buildEntriesForScope

  // Scenario-row order (for outcome view): primary baseline first, then
  // the 24 sibling-group order (already sorted by useScenarioList).
  const scenarioRowIdsAll = useMemo(() => {
    const ids = [...scenarioIds]
    const primary = ids.indexOf(PRIMARY_SCENARIO_BASELINE_ID)
    if (primary > 0) {
      ids.splice(primary, 1)
      ids.unshift(PRIMARY_SCENARIO_BASELINE_ID)
    }
    return ids
  }, [scenarioIds])

  // By-outcome view Y axis: sidebar-driven. When the sidebar selection
  // is non-empty we show those scenarios in canonical order; when empty
  // we fall back to all 24 so the chart always has something to draw.
  // `showAllScenarios` stays as an internal override used by previews
  // and legacy call sites.
  const scenarioRowIds = useMemo(() => {
    if (showAllScenarios || selectedScenarios.length === 0) {
      return scenarioRowIdsAll
    }
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  // By-scenario view focus: sidebar-driven. Scenario mode no longer
  // has its own picker; we key the focused scenario off the first
  // selected one, falling back to the primary baseline so the map
  // layer always has a valid scenario id. When the sidebar is empty
  // Scenario mode renders Overview instead (see scenarioRendersAsOverview).
  const effectiveFocusScenarioId = useMemo<string | null>(() => {
    if (selectedScenarios.length > 0) return selectedScenarios[0] ?? null
    if (showAllScenarios) return PRIMARY_SCENARIO_BASELINE_ID
    return null
  }, [selectedScenarios, showAllScenarios])

  // Scenario-mode small-multiples scope: the sidebar selection in
  // canonical order, with the primary baseline pinned first. Empty
  // when the sidebar is empty; the render path falls through to
  // Overview in that case.
  const scenarioSmallMultiplesIds = useMemo<string[]>(() => {
    if (view !== "scenario") return []
    if (selectedScenarios.length === 0) return []
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [view, selectedScenarios, scenarioRowIdsAll])

  // Best-effort scenario id for map actions. In aggregate views there is
  // no single "focused" scenario, but the map layer still needs a scenario
  // to key the visualization request. We fall back through: explicit
  // focus → first aggregated scenario → baseline. The layer geometry is
  // scenario-invariant for the outcomes we show, so any valid id is fine.
  const mapScenarioFallback = useMemo<string>(() => {
    return (
      effectiveFocusScenarioId ??
      aggregateScenarioIds?.[0] ??
      selectedScenarios[0] ??
      PRIMARY_SCENARIO_BASELINE_ID
    )
  }, [effectiveFocusScenarioId, aggregateScenarioIds, selectedScenarios])

  const effectiveCellRender = useMemo(
    () => resolveCellRender(view, cellEncoding, deltaMode, aggregateOver),
    [view, cellEncoding, deltaMode, aggregateOver],
  )

  // Build the underlying row keys + per-(row, col) value arrays. The
  // "displayable" value is whatever drives the primary visual encoding
  // (tier mean, delta, density fraction, aggregate mean); used both for
  // cells and for marginals / clustering.
  type RowValueFn = (
    rowKey: string,
    col: ResilienceHydroclimate,
  ) => {
    continuousValue: number | null
    tierLevel: number | null
    available: boolean
    unavailableReason?: string
    divergingValue?: number | null
    densityValue?: number | null
    distribution?: ReadonlyArray<ResilienceGlyphEntry>
    leverageValue?: number | null
    type?: "single_value" | "multi_value" | "nod_sod"
    rowLabel: string
    /** Value used for marginal row/col means + clustering. */
    signal: number | null
  }

  const buildValueFn = useCallback<
    () => {
      rowKeys: string[]
      rowLabels: Record<string, string>
      valueFn: RowValueFn
      subjectLabel: string
    }
  >(() => {
    if (effectiveView === "scenario") {
      const focusId = effectiveFocusScenarioId
      const focusName = focusId ? getDisplayName(focusId) : ""
      const rowKeys = [...outcomeRowCodes]
      const rowLabels: Record<string, string> = {}
      for (const code of rowKeys) rowLabels[code] = getOutcomeName(code)

      const valueFn: RowValueFn = (rowKey, hc) => {
        const cell = focusId ? getCell(focusId, rowKey, hc) : null
        if (!cell) {
          return {
            continuousValue: null,
            tierLevel: null,
            available: false,
            unavailableReason: "No data for this row",
            rowLabel: rowLabels[rowKey] ?? rowKey,
            signal: null,
          }
        }
        const base = {
          continuousValue: cell.continuousValue,
          tierLevel: cell.tierLevel,
          available: cell.available,
          unavailableReason: cell.unavailableReason,
          type: cell.type,
          rowLabel: rowLabels[rowKey] ?? rowKey,
        }
        if (deltaMode === "none" || !cell.available) {
          return { ...base, signal: cell.continuousValue }
        }
        // Compute delta
        let reference: number | null = null
        if (deltaMode === "vs_historical") {
          const ref = focusId ? getCell(focusId, rowKey, HISTORICAL_HC) : null
          reference = ref?.available ? ref.continuousValue : null
        } else {
          const ref = getCell(deltaBaselineScenarioId, rowKey, hc)
          reference = ref?.available ? ref.continuousValue : null
        }
        if (reference == null || cell.continuousValue == null) {
          return {
            ...base,
            available: false,
            unavailableReason: "Delta baseline unavailable",
            divergingValue: null,
            signal: null,
          }
        }
        const dv = cell.continuousValue - reference
        return { ...base, divergingValue: dv, signal: dv }
      }

      return {
        rowKeys,
        rowLabels,
        valueFn,
        subjectLabel: focusName,
      }
    }

    if (effectiveView === "outcome") {
      // The by-outcome view renders `byOutcomeTiles` via
      // ResilienceHeatmapSmallMultiples, so the single-heatmap data
      // produced here is never consumed. We still return a valid shape
      // (using the first visible outcome as the subject) so downstream
      // memos that depend on `buildValueFn` stay stable and typed.
      const fallbackOutcome = outcomeRowCodes[0] ?? OUTCOME_CODE_ORDER[0] ?? ""
      const outcomeName = fallbackOutcome ? getOutcomeName(fallbackOutcome) : ""
      const rowKeys = [...scenarioRowIds]
      const rowLabels: Record<string, string> = {}
      for (const sid of rowKeys) rowLabels[sid] = getDisplayName(sid)

      const valueFn: RowValueFn = (rowKey) => ({
        continuousValue: null,
        tierLevel: null,
        available: false,
        unavailableReason: "",
        rowLabel: rowLabels[rowKey] ?? rowKey,
        signal: null,
      })

      return { rowKeys, rowLabels, valueFn, subjectLabel: outcomeName }
    }

    if (effectiveView === "hydroclimate") {
      // Per-hydroclimate view renders `byHydroclimateTiles` via
      // ResilienceHeatmapSmallMultiples; the single-heatmap data built
      // here is not consumed. Return a valid shape (outcomes × scenario
      // column axis) so downstream memos stay stable and typed.
      const rowKeys = [...outcomeRowCodes]
      const rowLabels: Record<string, string> = {}
      for (const code of rowKeys) rowLabels[code] = getOutcomeName(code)

      const valueFn: RowValueFn = (rowKey) => ({
        continuousValue: null,
        tierLevel: null,
        available: false,
        unavailableReason: "",
        rowLabel: rowLabels[rowKey] ?? rowKey,
        signal: null,
      })

      return {
        rowKeys,
        rowLabels,
        valueFn,
        subjectLabel: "",
      }
    }

    // effectiveView === "aggregate". Row axis depends on aggregateOver:
    //   - scenarios (legacy): rows = outcomes.
    //   - outcomes: rows = scenarios in scope.
    //   - hydroclimates: rows = outcomes, cols = scenarios (columns is
    //     `scenarioColumnItems` via the dynamic `columns` memo).
    let rowKeys: string[]
    const rowLabels: Record<string, string> = {}
    let rowKind: "outcome" | "scenario"
    if (aggregateOver === "outcomes") {
      rowKeys =
        aggregateScope === "selected" && selectedScenarios.length > 0
          ? [...selectedScenarios]
          : [...scenarioIds]
      for (const sid of rowKeys) rowLabels[sid] = getDisplayName(sid)
      rowKind = "scenario"
    } else {
      // scenarios OR hydroclimates
      rowKeys =
        outcomeRowCodes.length === 0
          ? [...OUTCOME_CODE_ORDER]
          : [...outcomeRowCodes]
      for (const code of rowKeys) rowLabels[code] = getOutcomeName(code)
      rowKind = "outcome"
    }

    // Column axis is hydroclimates when aggregateOver != hydroclimates,
    // and scenarios when aggregateOver === hydroclimates. vs_historical
    // needs HISTORICAL_HC to exist on the col axis, so we disable delta
    // when it doesn't.
    const colAxisIsHydroclimate = aggregateOver !== "hydroclimates"
    // Delta is only coherent when the col axis is hydroclimates and
    // (for vs_baseline) the row axis is outcomes (so the per-outcome
    // matrix lookup makes sense). Otherwise we treat the chart as
    // non-delta and fall back to the tier encoding downstream.
    const effectiveDeltaMode: DeltaMode = !colAxisIsHydroclimate
      ? "none"
      : deltaMode === "vs_baseline" && rowKind !== "outcome"
        ? "none"
        : deltaMode

    // For distribution / glyph encodings: label + scenarioId on each
    // entry depend on the reduced-axis member kind.
    const labelForMember = (entry: {
      memberId: string
      memberKind: "scenario" | "outcome" | "hydroclimate"
    }): string => {
      if (entry.memberKind === "scenario") return getDisplayName(entry.memberId)
      if (entry.memberKind === "outcome") return getOutcomeName(entry.memberId)
      return HYDROCLIMATE_LABELS[entry.memberId] ?? entry.memberId
    }

    const valueFn: RowValueFn = (rowKey, col) => {
      const agg = aggregate.getCell(rowKey, col)
      if (!agg || agg.availableCount === 0) {
        return {
          continuousValue: null,
          tierLevel: null,
          available: false,
          unavailableReason: "No available data in aggregate",
          rowLabel: rowLabels[rowKey] ?? rowKey,
          signal: null,
        }
      }

      const baseCell = {
        continuousValue: agg.mean,
        tierLevel: agg.mean != null ? clampTier(agg.mean) : null,
        available: agg.mean != null,
        rowLabel: rowLabels[rowKey] ?? rowKey,
      }

      if (cellEncoding === "density_opp") {
        return {
          ...baseCell,
          densityValue: agg.opportunityDensity,
          available: true,
          signal: agg.opportunityDensity,
        }
      }
      if (cellEncoding === "glyph" || cellEncoding === "distribution") {
        let distribution: ResilienceGlyphEntry[]
        if (
          cellEncoding === "distribution" &&
          distributionMode === "location" &&
          aggregateOver === "scenarios" &&
          colAxisIsHydroclimate
        ) {
          // Location-mode distribution only makes sense in the legacy
          // aggregate (rows=outcomes, reducing across scenarios). The
          // per-LOI data is keyed by (outcome, hc).
          const entries =
            loiByCell[rowKey]?.[col as ResilienceHydroclimate] ?? []
          distribution = [...entries]
        } else {
          distribution = agg.distribution.map((d) => ({
            tierLevel: d.tierLevel,
            label: labelForMember(d),
            scenarioId: d.scenarioId,
            tierValue: d.continuousValue ?? undefined,
          }))
        }
        return {
          ...baseCell,
          distribution,
          available: true,
          signal: agg.mean,
        }
      }
      if (cellEncoding === "leverage") {
        const vals = agg.distribution
          .map((d) => d.continuousValue)
          .filter((v): v is number => v != null && Number.isFinite(v))
        if (vals.length < 2) {
          return {
            ...baseCell,
            available: false,
            unavailableReason: "Insufficient sibling coverage",
            leverageValue: null,
            signal: null,
          }
        }
        const min = Math.min(...vals)
        const max = Math.max(...vals)
        const range = Math.max(0, max - min)
        return {
          ...baseCell,
          leverageValue: range,
          available: true,
          signal: range,
        }
      }
      // cellEncoding === "tier" or "delta"
      if (effectiveDeltaMode === "none") {
        return { ...baseCell, signal: agg.mean }
      }
      let reference: number | null = null
      if (effectiveDeltaMode === "vs_historical") {
        const ref = aggregate.getCell(rowKey, HISTORICAL_HC)
        reference =
          ref && ref.availableCount > 0 && ref.mean != null ? ref.mean : null
      } else if (rowKind === "outcome") {
        const ref = getCell(
          deltaBaselineScenarioId,
          rowKey,
          col as ResilienceHydroclimate,
        )
        reference = ref?.available ? ref.continuousValue : null
      }
      if (reference == null || agg.mean == null) {
        return {
          ...baseCell,
          available: false,
          unavailableReason: "Delta baseline unavailable",
          divergingValue: null,
          signal: null,
        }
      }
      const dv = agg.mean - reference
      return { ...baseCell, divergingValue: dv, signal: dv }
    }

    return {
      rowKeys,
      rowLabels,
      valueFn,
      subjectLabel: aggregate.subjectLabel,
    }
  }, [
    effectiveView,
    cellEncoding,
    deltaMode,
    deltaBaselineScenarioId,
    outcomeRowCodes,
    scenarioRowIds,
    effectiveFocusScenarioId,
    getCell,
    getDisplayName,
    aggregate,
    distributionMode,
    loiByCell,
    aggregateOver,
    aggregateScope,
    selectedScenarios,
    scenarioIds,
  ])

  // Compute the (rowKey, col) value grid once, then derive cells,
  // clustering, and marginals from it.
  const { rowKeys, rowLabels, valueFn, subjectLabel } = useMemo(buildValueFn, [
    buildValueFn,
  ])

  const valueGrid = useMemo(() => {
    const grid: Record<string, Record<string, ReturnType<RowValueFn>>> = {}
    for (const rk of rowKeys) {
      const row: Record<string, ReturnType<RowValueFn>> = {}
      for (const col of columns) {
        row[col.key] = valueFn(rk, col.key as ResilienceHydroclimate)
      }
      grid[rk] = row
    }
    return grid
  }, [rowKeys, columns, valueFn])

  // Optional hierarchical row reordering by the row's signal vector.
  const orderedRowKeys = useMemo(() => {
    if (!reorderBySimilarity || rowKeys.length <= 2 || columns.length === 0) {
      return rowKeys
    }
    const matrix: (number | null)[][] = rowKeys.map((rk) =>
      columns.map((col) => valueGrid[rk]?.[col.key]?.signal ?? null),
    )
    const order = hierarchicalRowOrder(matrix)
    return order.map((i) => rowKeys[i]!).filter((k): k is string => !!k)
  }, [reorderBySimilarity, rowKeys, columns, valueGrid])

  // Build rows + cells for the heatmap
  const { rows, cells } = useMemo(() => {
    const out: ResilienceHeatmapCell[] = []

    const rowItems: ResilienceAxisItem[] = orderedRowKeys.map((rk) => {
      if (effectiveView === "outcome") {
        return {
          key: rk,
          label: rowLabels[rk] ?? rk,
          definitionTooltip:
            scenarios.find((s) => s.scenarioId === rk)?.description ||
            rowLabels[rk] ||
            rk,
        }
      }
      return {
        key: rk,
        label: rowLabels[rk] ?? rk,
        definitionTooltip: getOutcomeDefinition(rk),
      }
    })

    // When aggregating across hydroclimates, the column axis becomes
    // scenarios, so col.key is a scenarioId and the cell is not pinned
    // to any one HC. Every other main-heatmap layout has HC columns.
    const columnsAreHydroclimate = !(
      effectiveView === "aggregate" && aggregateOver === "hydroclimates"
    )

    for (const rk of orderedRowKeys) {
      for (const col of columns) {
        const v = valueGrid[rk]?.[col.key]
        if (!v) continue
        out.push({
          rowKey: rk,
          colKey: col.key,
          continuousValue: v.continuousValue,
          tierLevel: v.tierLevel,
          available: v.available,
          unavailableReason: v.unavailableReason,
          rowLabel: rowLabels[rk] ?? rk,
          colLabel: col.label,
          subjectLabel,
          scenarioId:
            effectiveView === "scenario"
              ? (effectiveFocusScenarioId ?? undefined)
              : effectiveView === "outcome"
                ? rk
                : undefined,
          outcomeCode: rk,
          hydroclimate: columnsAreHydroclimate ? col.key : undefined,
          type: v.type,
          divergingValue: v.divergingValue,
          densityValue: v.densityValue,
          distribution: v.distribution,
          leverageValue: v.leverageValue,
        })
      }
    }

    return { rows: rowItems, cells: out }
  }, [
    orderedRowKeys,
    columns,
    valueGrid,
    rowLabels,
    subjectLabel,
    effectiveView,
    effectiveFocusScenarioId,
    scenarios,
    aggregateOver,
  ])

  // Per-scenario cell computation for the by-scenario small-multiples
  // view. Mirrors the scenario branch in `buildValueFn`, but parameterized
  // over scenarioId so each tile can consume its own cells. Honors the
  // active delta mode so the small-multiples respect the Climate shift
  // control when set.
  const computeScenarioTileCell = useCallback(
    (
      scenarioId: string,
      rowKey: string,
      hc: ResilienceHydroclimate,
      rowLabel: string,
      subject: string,
      colLabel: string,
    ): ResilienceHeatmapCell | null => {
      const cell = getCell(scenarioId, rowKey, hc)
      if (!cell) return null
      // When the distribution encoding is active in by-scenario view, the
      // tile itself is a single scenario. "scenario" mode renders a single
      // degenerate square (one entry). "location" mode renders per-LOI
      // squares for that scenario - re-aggregated from the already-fetched
      // raw data.
      let distribution: ReadonlyArray<ResilienceGlyphEntry> | undefined
      if (cellEncoding === "distribution" && cell.available) {
        if (distributionMode === "location") {
          const isNodSod = (
            NOD_SOD_OUTCOME_CODES as readonly string[]
          ).includes(rowKey)
          if (!isNodSod) {
            distribution = loiBuildEntriesForScope(rowKey, hc, [scenarioId])
          }
        } else {
          distribution = [
            {
              tierLevel: cell.tierLevel,
              label: subject,
              scenarioId,
              tierValue: cell.continuousValue ?? undefined,
            },
          ]
        }
      }
      const base: ResilienceHeatmapCell = {
        rowKey,
        colKey: hc,
        continuousValue: cell.continuousValue,
        tierLevel: cell.tierLevel,
        available: cell.available,
        unavailableReason: cell.unavailableReason,
        rowLabel,
        colLabel,
        subjectLabel: subject,
        scenarioId,
        outcomeCode: rowKey,
        hydroclimate: hc,
        type: cell.type,
        distribution,
      }
      if (deltaMode === "none" || !cell.available) return base
      let reference: number | null = null
      if (deltaMode === "vs_historical") {
        const ref = getCell(scenarioId, rowKey, HISTORICAL_HC)
        reference = ref?.available ? ref.continuousValue : null
      } else {
        const ref = getCell(deltaBaselineScenarioId, rowKey, hc)
        reference = ref?.available ? ref.continuousValue : null
      }
      if (reference == null || cell.continuousValue == null) {
        return {
          ...base,
          available: false,
          unavailableReason: "Delta baseline unavailable",
          divergingValue: null,
        }
      }
      return {
        ...base,
        divergingValue: cell.continuousValue - reference,
      }
    },
    [
      getCell,
      deltaMode,
      deltaBaselineScenarioId,
      cellEncoding,
      distributionMode,
      loiBuildEntriesForScope,
    ],
  )

  // Effective list of scenarios for the by-scenario small-multiples
  // view. Primary + compare by default; full 24 when "show all" is on
  // for backward-compat browse-all flows.
  const byScenarioScope = useMemo<readonly string[]>(() => {
    if (view !== "scenario") return []
    if (showAllScenarios) return scenarioRowIdsAll
    return scenarioSmallMultiplesIds
  }, [view, showAllScenarios, scenarioRowIdsAll, scenarioSmallMultiplesIds])

  const byScenarioTiles = useMemo<ResilienceSmallMultiplesTile[]>(() => {
    if (view !== "scenario" || byScenarioScope.length === 0) return []
    const tiles: ResilienceSmallMultiplesTile[] = []
    for (const sid of byScenarioScope) {
      const title = getDisplayName(sid)
      const tileCells: ResilienceHeatmapCell[] = []
      for (const rk of outcomeRowCodes) {
        const rl = getOutcomeName(rk)
        for (const col of hydroclimateColumns) {
          const c = computeScenarioTileCell(
            sid,
            rk,
            col.key as ResilienceHydroclimate,
            rl,
            title,
            col.label,
          )
          if (c) tileCells.push(c)
        }
      }
      tiles.push({ id: sid, title, cells: tileCells })
    }
    return tiles
  }, [
    view,
    byScenarioScope,
    outcomeRowCodes,
    hydroclimateColumns,
    computeScenarioTileCell,
    getDisplayName,
  ])

  // Shared row axis for by-scenario tiles. Separate from `rows` above
  // (which is the single-heatmap Y axis) so the tiles don't depend on
  // the single-heatmap value grid.
  const byScenarioRows = useMemo<ResilienceAxisItem[]>(
    () =>
      outcomeRowCodes.map((code) => ({
        key: code,
        label: getOutcomeName(code),
        definitionTooltip: getOutcomeDefinition(code),
      })),
    [outcomeRowCodes],
  )

  // By-outcome small multiples - one tile per outcome, Y = scenarios,
  // X = climates. The tile set is driven by the user's
  // `outcomeRowCodes` selection (see `byOutcomeTiles` below), and the
  // scenario rows inside each tile respect sidebar selection (falling
  // back to all 24 when sidebar is empty or show-all is on, so the
  // panel is always populated).
  const byOutcomeScenarioRowIds = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return scenarioRowIdsAll
    if (selectedScenarios.length === 0) return scenarioRowIdsAll
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  const byOutcomeRows = useMemo<ResilienceAxisItem[]>(
    () => byOutcomeScenarioRowIds.map((sid) => resolveScenarioAxisItem(sid)),
    [byOutcomeScenarioRowIds, resolveScenarioAxisItem],
  )

  const computeOutcomeTileCell = useCallback(
    (
      scenarioId: string,
      outcomeCode: string,
      hc: ResilienceHydroclimate,
      rowLabel: string,
      subject: string,
      colLabel: string,
    ): ResilienceHeatmapCell | null => {
      const cell = getCell(scenarioId, outcomeCode, hc)
      if (!cell) return null
      // In by-outcome view, each row is a scenario and each tile is one
      // outcome. "distribution" mode is meaningful only per-LOI (scenario
      // mode degenerates to a single square).
      let distribution: ReadonlyArray<ResilienceGlyphEntry> | undefined
      if (cellEncoding === "distribution" && cell.available) {
        if (distributionMode === "location") {
          const isNodSod = (
            NOD_SOD_OUTCOME_CODES as readonly string[]
          ).includes(outcomeCode)
          if (!isNodSod) {
            distribution = loiBuildEntriesForScope(outcomeCode, hc, [
              scenarioId,
            ])
          }
        } else {
          distribution = [
            {
              tierLevel: cell.tierLevel,
              label: rowLabel,
              scenarioId,
              tierValue: cell.continuousValue ?? undefined,
            },
          ]
        }
      }
      const base: ResilienceHeatmapCell = {
        rowKey: scenarioId,
        colKey: hc,
        continuousValue: cell.continuousValue,
        tierLevel: cell.tierLevel,
        available: cell.available,
        unavailableReason: cell.unavailableReason,
        rowLabel,
        colLabel,
        subjectLabel: subject,
        scenarioId,
        outcomeCode,
        hydroclimate: hc,
        type: cell.type,
        distribution,
      }
      if (deltaMode === "none" || !cell.available) return base
      let reference: number | null = null
      if (deltaMode === "vs_historical") {
        const ref = getCell(scenarioId, outcomeCode, HISTORICAL_HC)
        reference = ref?.available ? ref.continuousValue : null
      } else {
        const ref = getCell(deltaBaselineScenarioId, outcomeCode, hc)
        reference = ref?.available ? ref.continuousValue : null
      }
      if (reference == null || cell.continuousValue == null) {
        return {
          ...base,
          available: false,
          unavailableReason: "Delta baseline unavailable",
          divergingValue: null,
        }
      }
      return {
        ...base,
        divergingValue: cell.continuousValue - reference,
      }
    },
    [
      getCell,
      deltaMode,
      deltaBaselineScenarioId,
      cellEncoding,
      distributionMode,
      loiBuildEntriesForScope,
    ],
  )

  // By-hydroclimate small multiples - one tile per hydroclimate, Y =
  // outcomes, X = scenarios. Mirrors the by-scenario / by-outcome
  // gallery pattern: by default the user sees all three HCs as a 3-tile
  // gallery, and any tile can be clicked-to-expand into a full-size
  // heatmap (same pin/expand pattern as the other views).
  const byHydroclimateScenarioColIds = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return scenarioRowIdsAll
    if (selectedScenarios.length === 0) return scenarioRowIdsAll
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  // Column axis (scenarios) for by-hydroclimate tiles. Separate from
  // `scenarioColumnItems` (which drives the single-heatmap aggregate
  // view) so by-HC tiles can respect the sidebar selection the same
  // way the by-outcome gallery does.
  const byHydroclimateColumnItems = useMemo<ResilienceAxisItem[]>(
    () =>
      byHydroclimateScenarioColIds.map((sid) => resolveScenarioAxisItem(sid)),
    [byHydroclimateScenarioColIds, resolveScenarioAxisItem],
  )

  const byHydroclimateRows = useMemo<ResilienceAxisItem[]>(
    () =>
      outcomeRowCodes.map((code) => ({
        key: code,
        label: getOutcomeName(code),
        definitionTooltip: getOutcomeDefinition(code),
      })),
    [outcomeRowCodes],
  )

  const computeHydroclimateTileCell = useCallback(
    (
      scenarioId: string,
      outcomeCode: string,
      hc: ResilienceHydroclimate,
      rowLabel: string,
      subject: string,
      colLabel: string,
    ): ResilienceHeatmapCell | null => {
      const cell = getCell(scenarioId, outcomeCode, hc)
      if (!cell) return null
      // In by-hydroclimate view the tile is a single HC. The
      // "distribution" encoding collapses to a single-entry glyph
      // per cell in scenario mode (each scenario is already its own
      // column). Location mode opens the per-LOI distribution for the
      // clicked scenario - same behavior as by-scenario tiles.
      let distribution: ReadonlyArray<ResilienceGlyphEntry> | undefined
      if (cellEncoding === "distribution" && cell.available) {
        if (distributionMode === "location") {
          const isNodSod = (
            NOD_SOD_OUTCOME_CODES as readonly string[]
          ).includes(outcomeCode)
          if (!isNodSod) {
            distribution = loiBuildEntriesForScope(outcomeCode, hc, [
              scenarioId,
            ])
          }
        } else {
          distribution = [
            {
              tierLevel: cell.tierLevel,
              label: subject,
              scenarioId,
              tierValue: cell.continuousValue ?? undefined,
            },
          ]
        }
      }
      const base: ResilienceHeatmapCell = {
        rowKey: outcomeCode,
        colKey: scenarioId,
        continuousValue: cell.continuousValue,
        tierLevel: cell.tierLevel,
        available: cell.available,
        unavailableReason: cell.unavailableReason,
        rowLabel,
        colLabel,
        subjectLabel: subject,
        scenarioId,
        outcomeCode,
        hydroclimate: hc,
        type: cell.type,
        distribution,
      }
      if (deltaMode === "none" || !cell.available) return base
      let reference: number | null = null
      if (deltaMode === "vs_historical") {
        const ref = getCell(scenarioId, outcomeCode, HISTORICAL_HC)
        reference = ref?.available ? ref.continuousValue : null
      } else {
        const ref = getCell(deltaBaselineScenarioId, outcomeCode, hc)
        reference = ref?.available ? ref.continuousValue : null
      }
      if (reference == null || cell.continuousValue == null) {
        return {
          ...base,
          available: false,
          unavailableReason: "Delta baseline unavailable",
          divergingValue: null,
        }
      }
      return {
        ...base,
        divergingValue: cell.continuousValue - reference,
      }
    },
    [
      getCell,
      deltaMode,
      deltaBaselineScenarioId,
      cellEncoding,
      distributionMode,
      loiBuildEntriesForScope,
    ],
  )

  const byHydroclimateTiles = useMemo<ResilienceSmallMultiplesTile[]>(() => {
    if (view !== "hydroclimate") return []
    // One tile per selected hydroclimate, in canonical matrix order.
    const tiles: ResilienceSmallMultiplesTile[] = []
    for (const hc of hydroclimates) {
      if (!selectedHydroclimates.has(hc)) continue
      const longHydroLabel = HYDROCLIMATE_LABELS[hc] ?? hc
      const desc = HYDROCLIMATE_DESCRIPTIONS[hc]
      const tileCells: ResilienceHeatmapCell[] = []
      for (const rk of outcomeRowCodes) {
        const rl = getOutcomeName(rk)
        for (const sid of byHydroclimateScenarioColIds) {
          const c = computeHydroclimateTileCell(
            sid,
            rk,
            hc,
            rl,
            longHydroLabel,
            getDisplayName(sid),
          )
          if (c) tileCells.push(c)
        }
      }
      tiles.push({
        id: hc,
        title: longHydroLabel,
        titleTooltip: desc
          ? `${longHydroLabel}\n${desc}`
          : longHydroLabel,
        cells: tileCells,
      })
    }
    return tiles
  }, [
    view,
    hydroclimates,
    selectedHydroclimates,
    outcomeRowCodes,
    byHydroclimateScenarioColIds,
    computeHydroclimateTileCell,
    getDisplayName,
  ])

  const byOutcomeTiles = useMemo<ResilienceSmallMultiplesTile[]>(() => {
    if (view !== "outcome") return []
    // Outcome-mode small multiples: primary outcome first, followed by
    // Compare outcomes. NOD/SOD regional variants are skipped at tile
    // level (they don't have standalone definitions) but are still
    // valid row keys elsewhere via the per-outcome expand.
    const tiles: ResilienceSmallMultiplesTile[] = []
    for (const outcomeCode of outcomeSmallMultiplesCodes) {
      if ((NOD_SOD_OUTCOME_CODES as readonly string[]).includes(outcomeCode)) {
        continue
      }
      const title = getOutcomeName(outcomeCode)
      const tileCells: ResilienceHeatmapCell[] = []
      for (const sid of byOutcomeScenarioRowIds) {
        const rl = getDisplayName(sid)
        for (const col of hydroclimateColumns) {
          const c = computeOutcomeTileCell(
            sid,
            outcomeCode,
            col.key as ResilienceHydroclimate,
            rl,
            title,
            col.label,
          )
          if (c) tileCells.push(c)
        }
      }
      tiles.push({ id: outcomeCode, title, cells: tileCells })
    }
    return tiles
  }, [
    view,
    outcomeSmallMultiplesCodes,
    byOutcomeScenarioRowIds,
    hydroclimateColumns,
    computeOutcomeTileCell,
    getDisplayName,
  ])

  // Row and column marginals: mean of each row's/col's signal values.
  const marginalsData = useMemo<ResilienceHeatmapMarginals | undefined>(() => {
    if (!showMarginals) return undefined
    const row: (number | null)[] = orderedRowKeys.map((rk) => {
      let sum = 0
      let count = 0
      for (const col of columns) {
        const v = valueGrid[rk]?.[col.key]?.signal
        if (v != null && Number.isFinite(v)) {
          sum += v
          count += 1
        }
      }
      return count > 0 ? sum / count : null
    })
    const col: (number | null)[] = columns.map((c) => {
      let sum = 0
      let count = 0
      for (const rk of orderedRowKeys) {
        const v = valueGrid[rk]?.[c.key]?.signal
        if (v != null && Number.isFinite(v)) {
          sum += v
          count += 1
        }
      }
      return count > 0 ? sum / count : null
    })
    return { row, col }
  }, [showMarginals, orderedRowKeys, columns, valueGrid])

  // Hover coordination with the sidebar (debounced)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoveredIdRef = useRef<string | null>(null)

  const notifyHover = useCallback(
    (scenarioId: string | null) => {
      if (lastHoveredIdRef.current === scenarioId) return
      lastHoveredIdRef.current = scenarioId
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (scenarioId != null) {
        startTransition(() => {
          setHighlightedScenario(scenarioId)
          onScenarioHover?.(scenarioId)
        })
      } else {
        hoverTimerRef.current = setTimeout(() => {
          startTransition(() => {
            setHighlightedScenario(null)
            onScenarioHover?.(null)
          })
        }, 150)
      }
    },
    [setHighlightedScenario, onScenarioHover],
  )

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const handleCellHover = useCallback(
    (cell: ResilienceHeatmapCell | null) => {
      if (!cell) {
        notifyHover(null)
        return
      }
      if (view === "scenario") {
        notifyHover(effectiveFocusScenarioId)
      } else if (view === "outcome") {
        notifyHover(cell.scenarioId ?? null)
      } else {
        // Aggregate view: no single scenario to highlight.
        notifyHover(null)
      }
    },
    [view, effectiveFocusScenarioId, notifyHover],
  )

  // Aggregate view has no "current" scenario/hydroclimate - every column
  // and row aggregates across them. We anchor the map call on the
  // historical baseline (same scenarioId Get Started uses, which has the
  // widest /locations coverage) and bypass hydroclimate re-resolution so
  // react-marker outcomes render reliably.
  const triggerMapForOutcome = useCallback(
    (outcomeCode: string, hydroclimateAwareSid: string | null) => {
      if (view === "aggregate") {
        const sid = PRIMARY_SCENARIO_BASELINE_ID
        if (!isOutcomeActive(outcomeCode, sid)) {
          showOutcomeOnMapFixed(outcomeCode, sid)
        }
        return
      }
      const sid = hydroclimateAwareSid ?? mapScenarioFallback
      if (!isOutcomeActive(outcomeCode, sid)) {
        showOutcomeOnMap(outcomeCode, sid)
      }
    },
    [
      view,
      mapScenarioFallback,
      showOutcomeOnMap,
      showOutcomeOnMapFixed,
      isOutcomeActive,
    ],
  )

  // Whether clicking this cell can drive the map today. The Overview
  // (aggregate) view and the derived encodings (climate shift, density,
  // leverage) do not map cleanly onto the per-LOI tier paint that the
  // map pipeline serves, so we explain that in a Snackbar instead of
  // painting an approximation.
  const cellMapsCleanly = useCallback(
    (cell: ResilienceHeatmapCell): boolean => {
      if (!cell.outcomeCode) return false
      if (effectiveView === "aggregate") return false
      if (
        cellEncoding === "delta" ||
        cellEncoding === "density_opp" ||
        cellEncoding === "leverage"
      ) {
        return false
      }
      return true
    },
    [effectiveView, cellEncoding],
  )

  // Snackbar message for clicks that can't drive the map. We store the
  // reason as a string so each click shows copy that matches its own
  // gating condition (overview vs. derived encoding vs. missing outcome)
  // rather than the generic "coming soon" line. `null` means closed.
  const [mapBlockedMessage, setMapBlockedMessage] = useState<string | null>(
    null,
  )
  const openMapBlockedMessage = useCallback(
    (message: string) => setMapBlockedMessage(message),
    [],
  )
  const closeMapBlockedMessage = useCallback(
    () => setMapBlockedMessage(null),
    [],
  )

  const handleCellClick = useCallback(
    (cell: ResilienceHeatmapCell) => {
      if (!isMapVisible) return
      if (!cell.outcomeCode) {
        openMapBlockedMessage(
          getMapLinkBlockedMessage(effectiveView, cellEncoding, false),
        )
        return
      }
      if (!cellMapsCleanly(cell)) {
        openMapBlockedMessage(
          getMapLinkBlockedMessage(effectiveView, cellEncoding, true),
        )
        return
      }
      // Align the toolbar HC with the clicked column so the sibling-
      // group resolution in useMapVisualizationAction paints the right
      // climate variant on the map. Safe to call even if the value
      // matches current state - setHydroclimate is idempotent.
      if (cell.hydroclimate) {
        setHydroclimate(cell.hydroclimate)
      }
      triggerMapForOutcome(cell.outcomeCode, cell.scenarioId ?? null)
    },
    [
      isMapVisible,
      cellMapsCleanly,
      openMapBlockedMessage,
      effectiveView,
      cellEncoding,
      setHydroclimate,
      triggerMapForOutcome,
    ],
  )

  // Build a LocationHighlight payload from a distribution square in
  // "location" mode. Returns null if the cell lacks an outcome code, the
  // entry lacks an LOI, or we can't resolve coordinates.
  const buildLocationHighlight = useCallback(
    (
      cell: ResilienceHeatmapCell,
      entry: ResilienceGlyphEntry,
    ): { outcomeCode: string; highlight: LocationHighlight } | null => {
      const outcomeCode = cell.outcomeCode
      const loiId = entry.loiId
      if (!outcomeCode || !loiId) return null
      const coords = getOutcomeLocationCoordinates(outcomeCode, loiId)
      if (!coords) return null
      const tierLevel = entry.tierLevel ?? 0
      const tierColorIndex = Math.max(1, Math.min(4, tierLevel)) - 1
      const tierColor = tierColors[tierColorIndex] ?? theme.palette.grey[300]
      return {
        outcomeCode,
        highlight: {
          key: `resilience-heatmap-${outcomeCode}-${loiId}`,
          longitude: coords[0],
          latitude: coords[1],
          name: entry.locationName ?? loiId,
          tierLevel: tierLevel || 1,
          tierLabel: tierLevel ? getTierLabel(tierLevel) : (entry.label ?? ""),
          tierColor,
        },
      }
    },
    [tierColors, theme.palette.grey],
  )

  // Pinned squares survive hover-leave and are rendered as persistent
  // popups on the map (same UX as the get-started key-outcomes overlay).
  // We keep `outcomeCode` alongside each highlight so we can drop pins
  // when the active map outcome changes.
  const [pinnedSquareLois, setPinnedSquareLois] = useState<
    Map<string, { outcomeCode: string; highlight: LocationHighlight }>
  >(() => new Map())

  // Hover highlight is a ref, not state. Storing it as useState caused
  // every mousemove over the distribution squares to re-render the panel
  // (and therefore the memoized ResilienceHeatmap), which in turn fired
  // `updateChart` and rebuilt the SVG. When that rebuild happened between
  // `mousedown` and `mouseup` on a square, the browser resolved the
  // click on the parent <svg> rather than the original <rect>, so clicks
  // on hover-sensitive outcomes (the three react-marker outcomes that
  // drive a Mapbox popup on hover) were dropped intermittently. Refs do
  // not trigger a render; we emit to the map store imperatively from the
  // hover/click handlers below.
  const hoveredSquareHighlightRef = useRef<LocationHighlight | null>(null)

  // Mirror pinnedSquareLois in a ref so `emitLocationHighlights` can
  // read the latest value without needing it in its dep array.
  const pinnedSquareLoisRef = useRef(pinnedSquareLois)
  useEffect(() => {
    pinnedSquareLoisRef.current = pinnedSquareLois
  }, [pinnedSquareLois])

  // Merged [pinned ∪ hovered] emitter. Reads both sources from refs so
  // its own identity is stable across renders.
  const emitLocationHighlights = useCallback(() => {
    const list: LocationHighlight[] = []
    for (const { highlight } of pinnedSquareLoisRef.current.values()) {
      list.push({ ...highlight, pinned: true })
    }
    const hovered = hoveredSquareHighlightRef.current
    if (hovered && !pinnedSquareLoisRef.current.has(hovered.key)) {
      list.push(hovered)
    }
    mapActions.setLocationHighlights(list)
  }, [])

  // Click-driven re-emit: when the pinned set changes we need to push
  // the new list to the map store. Hover-driven re-emit is handled
  // imperatively inside handleSquareHover.
  useEffect(() => {
    emitLocationHighlights()
  }, [pinnedSquareLois, emitLocationHighlights])

  // Per-square hover for the distribution encoding. Branches by
  // distributionMode: "scenario" drives the sidebar highlight (same code
  // path as the radar's dot-hover); "location" feeds the merged
  // hover-plus-pins emitter above.
  const handleSquareHover = useCallback(
    (
      info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry } | null,
    ) => {
      if (!info) {
        if (distributionMode === "location") {
          hoveredSquareHighlightRef.current = null
          emitLocationHighlights()
        } else {
          notifyHover(null)
        }
        return
      }
      if (distributionMode === "location") {
        const built = buildLocationHighlight(info.cell, info.entry)
        hoveredSquareHighlightRef.current = built?.highlight ?? null
        emitLocationHighlights()
      } else {
        // "scenario" mode - drive sidebar highlight + scroll.
        const sid = info.entry.scenarioId
        if (sid) notifyHover(sid)
      }
    },
    [
      distributionMode,
      notifyHover,
      buildLocationHighlight,
      emitLocationHighlights,
    ],
  )

  // Per-square click. Opens the outcome's map layer and (location mode)
  // toggles a persistent pin for the clicked LOI. No-op when the map
  // is hidden, same guard as handleCellClick above. Overview / derived
  // cells short-circuit to the reason-specific Snackbar - even the LOI
  // pin is gated, since the pin's tier color would disagree with the
  // cell's reduced scalar.
  const handleSquareClick = useCallback(
    (info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry }) => {
      const { cell, entry } = info
      const outcomeCode = cell.outcomeCode
      if (!isMapVisible) return
      if (!outcomeCode) {
        openMapBlockedMessage(
          getMapLinkBlockedMessage(effectiveView, cellEncoding, false),
        )
        return
      }
      if (!cellMapsCleanly(cell)) {
        openMapBlockedMessage(
          getMapLinkBlockedMessage(effectiveView, cellEncoding, true),
        )
        return
      }

      if (cell.hydroclimate) {
        setHydroclimate(cell.hydroclimate)
      }

      if (distributionMode === "location") {
        // Location mode encodes LOIs. Entries carry no scenarioId, so we
        // defer to triggerMapForOutcome which picks between the
        // hydroclimate-aware and fixed-baseline paths based on view. Pin
        // state below updates regardless - the guard inside the trigger
        // prevents repeat clicks from toggling the layer off.
        triggerMapForOutcome(outcomeCode, cell.scenarioId ?? null)

        const built = buildLocationHighlight(cell, entry)
        if (!built) return
        setPinnedSquareLois((prev) => {
          const next = new Map(prev)
          if (next.has(built.highlight.key)) {
            next.delete(built.highlight.key)
          } else {
            next.set(built.highlight.key, built)
          }
          return next
        })
      } else {
        triggerMapForOutcome(
          outcomeCode,
          entry.scenarioId ?? cell.scenarioId ?? null,
        )
      }
    },
    [
      isMapVisible,
      cellMapsCleanly,
      openMapBlockedMessage,
      effectiveView,
      cellEncoding,
      setHydroclimate,
      distributionMode,
      triggerMapForOutcome,
      buildLocationHighlight,
    ],
  )

  // When the active map outcome changes (either by our own click or by
  // any other caller), drop pinned squares whose outcome no longer
  // matches so stale popups don't float on top of a different layer.
  const activeOutcomeCode = activeOutcome?.outcomeCode ?? null
  useEffect(() => {
    if (pinnedSquareLois.size === 0) return
    setPinnedSquareLois((prev) => {
      let changed = false
      const next = new Map(prev)
      for (const [key, pin] of prev) {
        if (activeOutcomeCode !== pin.outcomeCode) {
          next.delete(key)
          changed = true
        }
      }
      return changed ? next : prev
    })
    // We intentionally depend only on activeOutcomeCode - depending on
    // pinnedSquareLois would re-run the effect after our own setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOutcomeCode])

  // Cleanup on unmount: drop any hover / pinned state and any location
  // highlights we painted so the map doesn't retain stale pins when the
  // user leaves the tool.
  useEffect(() => {
    return () => {
      setPinnedSquareLois(new Map())
      hoveredSquareHighlightRef.current = null
      mapActions.clearLocationHighlights()
    }
  }, [])

  // Highlighted rows (sidebar hover sync). Only meaningful in outcome view
  // where rows are scenarios.
  const highlightedRowKeys = useMemo<Set<string> | null>(() => {
    if (!highlightedIds || highlightedIds.size === 0) return null
    if (view === "outcome") return new Set(highlightedIds)
    return null
  }, [highlightedIds, view])

  const dimRowKeys = useMemo<Set<string> | null>(() => {
    if (view !== "outcome") return null
    if (selectedScenarios.length === 0) return null
    return new Set(selectedScenarios)
  }, [view, selectedScenarios])

  const effectiveRowHighlight = useMemo<Set<string> | null>(() => {
    if (highlightedRowKeys && highlightedRowKeys.size > 0)
      return highlightedRowKeys
    return dimRowKeys
  }, [highlightedRowKeys, dimRowKeys])

  const formatRowTick = useCallback(
    (row: ResilienceAxisItem) => {
      const label =
        row.key === "FW_EXP"
          ? "Delta export freshwater"
          : row.key === "FW_DELTA_USES"
            ? "In-Delta freshwater"
            : row.label
      if (view === "outcome") return label
      if ((NOD_SOD_OUTCOME_CODES as readonly string[]).includes(row.key)) {
        return `  ${label}`
      }
      return label
    },
    [view],
  )

  // Empty state detection derived from the per-mode flags computed up
  // top near the store-state destructuring. This section just names a
  // couple of derived flags the JSX uses below for chip rendering.
  const noOutcomesSelected =
    !anyEmpty && view === "aggregate" && outcomeRowCodes.length === 0

  // Expand wiring for the small-multiples tile headers. Expand swaps
  // the grid for a single full-size heatmap via the `expandedTileId`
  // control state. The per-tile pin/check affordance was removed so
  // the sidebar is the single source of truth for scenario selection;
  // outcome visibility is driven by the "choose outcomes" chip in the
  // chart controls.
  const handleTileExpand = useCallback(
    (tileId: string) => {
      onControlsChange?.({ expandedTileId: tileId })
    },
    [onControlsChange],
  )
  const handleBackToGrid = useCallback(() => {
    onControlsChange?.({ expandedTileId: null })
  }, [onControlsChange])

  // Resolve the expanded tile (if any) from the current per-view tile
  // set. Guarded by effectiveView so an `expandedTileId` left over from
  // a previous view doesn't accidentally render into the wrong grid.
  const expandedTile = useMemo<ResilienceSmallMultiplesTile | null>(() => {
    if (!expandedTileId) return null
    if (view === "scenario") {
      return byScenarioTiles.find((t) => t.id === expandedTileId) ?? null
    }
    if (view === "outcome") {
      return byOutcomeTiles.find((t) => t.id === expandedTileId) ?? null
    }
    if (view === "hydroclimate") {
      return byHydroclimateTiles.find((t) => t.id === expandedTileId) ?? null
    }
    return null
  }, [
    expandedTileId,
    view,
    byScenarioTiles,
    byOutcomeTiles,
    byHydroclimateTiles,
  ])

  // Esc dismisses the expanded view when it's open, mirroring the
  // keyboard affordance on modals / tuner overlays elsewhere. The
  // listener is only installed while an expanded tile is active so it
  // doesn't fight the walkthrough panel's own Esc handler.
  useEffect(() => {
    if (!expandedTile) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        handleBackToGrid()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [expandedTile, handleBackToGrid])

  // Show cell values and transpose both live in the chart controls
  // (Rows row), so this panel no longer renders a floating display
  // menu. Nothing else remains for a chart-corner toolbar to hold.
  // const handleOpenWalkthrough = useCallback(() => {
  //   setWalkthroughOpen(true)
  // }, [])

  // View-level transpose transform. Applied just before render so the
  // underlying buildValueFn / tile compute pipeline stays unchanged.
  // Marginals swap row/col arrays when transposed.
  //
  // These hooks must sit above the early returns below so React
  // always sees the same hook-call order on every render (the
  // `error` / `isLoading && !hasData` branches bail out before the
  // main tree renders).
  const displayRows = transposed ? columns : rows
  const displayColumns = transposed ? rows : columns
  const displayCells = useMemo(
    () => (transposed ? cells.map(transposeCell) : cells),
    [transposed, cells],
  )
  const displayMarginals = useMemo<ResilienceHeatmapMarginals | undefined>(
    () =>
      marginalsData && transposed
        ? { row: marginalsData.col, col: marginalsData.row }
        : marginalsData,
    [transposed, marginalsData],
  )

  const displayByScenarioRows = transposed
    ? hydroclimateColumns
    : byScenarioRows
  const displayByScenarioColumns = transposed
    ? byScenarioRows
    : hydroclimateColumns
  const displayByScenarioTiles = useMemo(
    () => (transposed ? byScenarioTiles.map(transposeTile) : byScenarioTiles),
    [transposed, byScenarioTiles],
  )

  const displayByOutcomeRows = transposed ? hydroclimateColumns : byOutcomeRows
  const displayByOutcomeColumns = transposed
    ? byOutcomeRows
    : hydroclimateColumns
  const displayByOutcomeTiles = useMemo(
    () => (transposed ? byOutcomeTiles.map(transposeTile) : byOutcomeTiles),
    [transposed, byOutcomeTiles],
  )

  const displayByHydroclimateRows = transposed
    ? byHydroclimateColumnItems
    : byHydroclimateRows
  const displayByHydroclimateColumns = transposed
    ? byHydroclimateRows
    : byHydroclimateColumnItems
  const displayByHydroclimateTiles = useMemo(
    () =>
      transposed ? byHydroclimateTiles.map(transposeTile) : byHydroclimateTiles,
    [transposed, byHydroclimateTiles],
  )

  // Cross-fade + translate-y pivot animation. Respects the user's
  // reduced-motion preference (WCAG 2.3.3).
  const prefersReducedMotion = useReducedMotion()
  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" as const }
  const motionInitial = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: 8 }
  const motionExit = prefersReducedMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 0, y: -8 }

  // Tour anchors. The `resilience.cell` anchor attaches to the first
  // rendered heatmap cell via a callback ref threaded into the viz
  // (see `ResilienceHeatmap`'s `firstCellRef` prop), so the tour can
  // point at an actual tile rather than the surrounding chart wrapper.
  const cellAnchorRef = useTourAnchor("resilience.cell")

  // Snapshot capture plumbing. The chart body wrapper is the common
  // ancestor of every rendered heatmap SVG (single heatmap,
  // small-multiples grid, expanded tile), so a DOM-level capture here
  // works regardless of which `effectiveView` is active. Per-tile
  // capture locates the tile's root SVG via the `data-tile-id`
  // attribute that `ResilienceHeatmapSmallMultiples` stamps on each
  // tile wrapper.
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)

  const effectiveViewRef = useRef(effectiveView)
  useEffect(() => {
    effectiveViewRef.current = effectiveView
  }, [effectiveView])

  const cellEncodingRef = useRef(cellEncoding)
  useEffect(() => {
    cellEncodingRef.current = cellEncoding
  }, [cellEncoding])

  const byScenarioTilesRef = useRef(displayByScenarioTiles)
  useEffect(() => {
    byScenarioTilesRef.current = displayByScenarioTiles
  }, [displayByScenarioTiles])

  const byOutcomeTilesRef = useRef(displayByOutcomeTiles)
  useEffect(() => {
    byOutcomeTilesRef.current = displayByOutcomeTiles
  }, [displayByOutcomeTiles])

  const byHydroclimateTilesRef = useRef(displayByHydroclimateTiles)
  useEffect(() => {
    byHydroclimateTilesRef.current = displayByHydroclimateTiles
  }, [displayByHydroclimateTiles])

  const displayCellsRef = useRef(displayCells)
  useEffect(() => {
    displayCellsRef.current = displayCells
  }, [displayCells])

  const cellsToRows = useCallback(
    (cellsIn: ResilienceHeatmapCell[]): ResilienceChartDataRow[] =>
      cellsIn.map((cell) => ({
        rowKey: cell.rowKey,
        rowLabel: cell.rowLabel,
        colKey: cell.colKey,
        colLabel: cell.colLabel,
        tier: cell.tierLevel ?? undefined,
        value: cell.continuousValue ?? undefined,
        delta: cell.divergingValue ?? undefined,
        count: cell.distribution?.length,
      })),
    [],
  )

  const captureResilience = useCallback<ResilienceCaptureFn>(async () => {
    const el = chartWrapperRef.current
    if (!el) return null
    try {
      const { dataUrl } = await captureElementToBlob(el)
      const view = effectiveViewRef.current
      let rowsOut: ResilienceChartDataRow[]
      let tileScope:
        | "panel"
        | "scenario"
        | "outcome"
        | "hydroclimate" = "panel"
      if (view === "scenario") {
        rowsOut = byScenarioTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
        tileScope = "panel"
      } else if (view === "outcome") {
        rowsOut = byOutcomeTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
      } else if (view === "hydroclimate") {
        rowsOut = byHydroclimateTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
      } else {
        rowsOut = cellsToRows(displayCellsRef.current)
      }
      return {
        dataUrl,
        chartData: {
          kind: "resilience",
          view,
          cellEncoding: cellEncodingRef.current,
          tileScope,
          rows: rowsOut,
        },
      }
    } catch (err) {
      console.error("[ResiliencePanel] captureResilience failed:", err)
      return null
    }
  }, [cellsToRows])

  const captureResilienceTile = useCallback<ResilienceTileCaptureFn>(
    async (tileId) => {
      const wrapper = chartWrapperRef.current
      if (!wrapper) return null
      const tileEl = wrapper.querySelector<HTMLElement>(
        `[data-tile-id="${CSS.escape(tileId)}"]`,
      )
      if (!tileEl) return null
      // Scope the SVG lookup to the tile body wrapper. The tile header
      // contains action buttons whose MUI icons render as <svg>, so a
      // bare `tileEl.querySelector("svg")` would grab the share icon
      // rather than the heatmap.
      const body = tileEl.querySelector<HTMLElement>(
        "[data-resilience-tile-body]",
      )
      const svg = body?.querySelector("svg") ?? null
      if (!(svg instanceof SVGSVGElement)) return null
      try {
        const { dataUrl } = await captureSvgToBlob(svg)
        const view = effectiveViewRef.current
        let tileScope: "scenario" | "outcome" | "hydroclimate" = "scenario"
        let tileSource = byScenarioTilesRef.current
        if (view === "outcome") {
          tileScope = "outcome"
          tileSource = byOutcomeTilesRef.current
        } else if (view === "hydroclimate") {
          tileScope = "hydroclimate"
          tileSource = byHydroclimateTilesRef.current
        }
        const tile = tileSource.find((t) => t.id === tileId)
        if (!tile) return null
        return {
          dataUrl,
          chartData: {
            kind: "resilience",
            view,
            cellEncoding: cellEncodingRef.current,
            tileScope,
            tileLabel: tile.title,
            rows: cellsToRows(tile.cells),
          },
        }
      } catch (err) {
        console.error("[ResiliencePanel] captureResilienceTile failed:", err)
        return null
      }
    },
    [cellsToRows],
  )

  useEffect(() => {
    onCaptureReady?.(captureResilience)
  }, [captureResilience, onCaptureReady])

  useEffect(() => {
    onCaptureTileReady?.(captureResilienceTile)
  }, [captureResilienceTile, onCaptureTileReady])

  // Per-tile share icon rendered inside the tile header next to the
  // expand button. The button does not participate in tile hover /
  // expand gestures - it only fires the external `onTileShare`, which
  // resolves to `handleResilienceTileSnapshot` in `ScenarioExplorer`.
  const renderTileShareAction = useMemo(() => {
    if (!onTileShare) return undefined
    return (tile: ResilienceSmallMultiplesTile) => (
      <Box
        component="button"
        type="button"
        aria-label={`Save snapshot of ${tile.title}`}
        title="Save snapshot of this tile"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          onTileShare(tile.id)
        }}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          padding: 0,
          borderRadius: "4px",
          border: "none",
          background: "transparent",
          color: theme.palette.grey[600],
          cursor: "pointer",
          "&:hover": {
            color: theme.palette.blue.bright,
            backgroundColor: theme.palette.interaction.selectedBackground,
          },
        }}
      >
        <icons.IosShare sx={{ fontSize: "0.875rem" }} />
      </Box>
    )
  }, [onTileShare, theme])

  // Render states

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
          p: 3,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    )
  }

  const hasData =
    !!matrixCells && Object.keys(matrixCells).length > 0 && columns.length > 0

  if (isLoading && !hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 2,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2">Loading resilience data...</Typography>
      </Box>
    )
  }

  const scenarioColumnLabelRotation =
    effectiveView === "hydroclimate" && !transposed ? -90 : 0

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Panel-level title. Names the pivot (what the chart is) and
          spells out the specific subject it exhibits (which scenarios /
          outcomes / climates, or the aggregate framing). Kept
          intentionally different in shape from the one-line sentence
          header so the two don't read as duplicates: the sentence
          describes how the user is currently configuring the chart;
          the title describes what the chart IS. */}
      <ResiliencePanelTitle
        view={view}
        aggregateOver={aggregateOver}
        scenarioCount={selectedScenarios.length}
        outcomeCount={resilienceVisibleOutcomes.length}
        climateCount={selectedHydroclimates.size}
      />

      {isMapVisible && effectiveView === "aggregate" && (
        <Typography
          variant="caption"
          sx={{
            px: theme.space.component.lg,
            pb: theme.space.component.xs,
            color: theme.palette.grey[700],
            lineHeight: 1.3,
          }}
        >
          Overview cells aggregate across scenarios. Switch to Scenarios,
          Outcomes, or Hydroclimates to link cells to the map.
        </Typography>
      )}

      <Box
        ref={chartWrapperRef}
        sx={{
          flex: 1,
          minHeight: 0,
          px: theme.space.component.lg,
          pb: theme.space.component.md,
          position: "relative",
        }}
      >
        {showResilienceOutcomeSelector && (
          <ResilienceOutcomeSelector
            visible={resilienceVisibleOutcomes}
            onToggle={toggleResilienceOutcome}
            onSetAll={setResilienceVisibleOutcomes}
            onClose={() => setShowResilienceOutcomeSelector(false)}
          />
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={motionInitial}
            animate={{ opacity: 1, y: 0 }}
            exit={motionExit}
            transition={motionTransition}
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {columns.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Select at least one hydroclimate in the chart controls.
                </Typography>
              </Box>
            ) : noOutcomesSelected ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 3,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", maxWidth: 480 }}
                >
                  No outcome rows selected. Open &ldquo;choose outcome
                  rows&rdquo; in the chart controls above to pick which outcomes
                  to display.
                </Typography>
              </Box>
            ) : outcomeEmpty ? (
              <ResilienceEmptyState
                eyebrow="Outcome"
                title="No outcomes to show"
                body="Open the outcome picker (or the Outcomes phrase in the sentence above) and pick at least one outcome to see its tile."
              />
            ) : expandedTile ? (
              <ExpandedTileView
                tile={transposed ? transposeTile(expandedTile) : expandedTile}
                rows={
                  view === "scenario"
                    ? displayByScenarioRows
                    : view === "outcome"
                      ? displayByOutcomeRows
                      : displayByHydroclimateRows
                }
                columns={
                  view === "scenario"
                    ? displayByScenarioColumns
                    : view === "outcome"
                      ? displayByOutcomeColumns
                      : displayByHydroclimateColumns
                }
                tierColors={tierColors}
                tierLabels={tierLabels}
                palette={heatmapPalette}
                cellRender={effectiveCellRender}
                showCellNumbers={showCellNumbers}
                formatRowTick={formatRowTick}
                distributionMode={distributionMode}
                columnLabelRotation={scenarioColumnLabelRotation}
                onCellHover={handleCellHover}
                onCellClick={isMapVisible ? handleCellClick : undefined}
                onSquareHover={(info) =>
                  handleSquareHover(
                    info ? { cell: info.cell, entry: info.entry } : null,
                  )
                }
                onSquareClick={(info) =>
                  handleSquareClick({ cell: info.cell, entry: info.entry })
                }
                onBack={handleBackToGrid}
                backLabel={
                  view === "scenario"
                    ? "Back to all scenarios"
                    : view === "outcome"
                      ? "Back to all outcomes"
                      : "Back to all hydroclimates"
                }
              />
            ) : effectiveView === "scenario" ? (
              <BrowseShell>
                <ResilienceHeatmapSmallMultiples
                  firstCellRef={cellAnchorRef}
                  rows={displayByScenarioRows}
                  columns={displayByScenarioColumns}
                  tiles={displayByScenarioTiles}
                  tierColors={tierColors}
                  tierLabels={tierLabels}
                  palette={heatmapPalette}
                  cellRender={effectiveCellRender}
                  showCellNumbers={showCellNumbers}
                  tileAspect={transposed ? "tall" : "wide"}
                  onCellHover={handleCellHover}
                  onCellClick={isMapVisible ? handleCellClick : undefined}
                  formatRowTick={formatRowTick}
                  distributionMode={distributionMode}
                  onSquareHover={(info) =>
                    handleSquareHover(
                      info ? { cell: info.cell, entry: info.entry } : null,
                    )
                  }
                  onSquareClick={(info) =>
                    handleSquareClick({ cell: info.cell, entry: info.entry })
                  }
                  onTileExpand={
                    onControlsChange ? handleTileExpand : undefined
                  }
                  renderTileActions={renderTileShareAction}
                />
              </BrowseShell>
            ) : effectiveView === "outcome" ? (
              <BrowseShell>
                <ResilienceHeatmapSmallMultiples
                  firstCellRef={cellAnchorRef}
                  rows={displayByOutcomeRows}
                  columns={displayByOutcomeColumns}
                  tiles={displayByOutcomeTiles}
                  tierColors={tierColors}
                  tierLabels={tierLabels}
                  palette={heatmapPalette}
                  cellRender={effectiveCellRender}
                  showCellNumbers={showCellNumbers}
                  tileAspect={transposed ? "wide" : "tall"}
                  onCellHover={handleCellHover}
                  onCellClick={isMapVisible ? handleCellClick : undefined}
                  formatRowTick={formatRowTick}
                  distributionMode={distributionMode}
                  onSquareHover={(info) =>
                    handleSquareHover(
                      info ? { cell: info.cell, entry: info.entry } : null,
                    )
                  }
                  onSquareClick={(info) =>
                    handleSquareClick({ cell: info.cell, entry: info.entry })
                  }
                  onTileExpand={
                    onControlsChange ? handleTileExpand : undefined
                  }
                  renderTileActions={renderTileShareAction}
                />
              </BrowseShell>
            ) : effectiveView === "hydroclimate" ? (
              <BrowseShell>
                <ResilienceHeatmapSmallMultiples
                  firstCellRef={cellAnchorRef}
                  rows={displayByHydroclimateRows}
                  columns={displayByHydroclimateColumns}
                  tiles={displayByHydroclimateTiles}
                  tierColors={tierColors}
                  tierLabels={tierLabels}
                  palette={heatmapPalette}
                  cellRender={effectiveCellRender}
                  showCellNumbers={showCellNumbers}
                  tileAspect={transposed ? "tall" : "wide"}
                  columnLabelRotation={scenarioColumnLabelRotation}
                  onCellHover={handleCellHover}
                  onCellClick={isMapVisible ? handleCellClick : undefined}
                  formatRowTick={formatRowTick}
                  distributionMode={distributionMode}
                  onSquareHover={(info) =>
                    handleSquareHover(
                      info ? { cell: info.cell, entry: info.entry } : null,
                    )
                  }
                  onSquareClick={(info) =>
                    handleSquareClick({ cell: info.cell, entry: info.entry })
                  }
                  onTileExpand={
                    onControlsChange ? handleTileExpand : undefined
                  }
                  renderTileActions={renderTileShareAction}
                />
              </BrowseShell>
            ) : (
              <BrowseShell>
                <ResilienceHeatmap
                  rows={displayRows}
                  columns={displayColumns}
                  cells={displayCells}
                  tierColors={tierColors}
                  tierLabels={tierLabels}
                  palette={heatmapPalette}
                  cellRender={effectiveCellRender}
                  showCellNumbers={showCellNumbers}
                  onCellHover={handleCellHover}
                  onCellClick={isMapVisible ? handleCellClick : undefined}
                  highlightedRowKeys={
                    transposed ? undefined : effectiveRowHighlight
                  }
                  formatRowTick={formatRowTick}
                  marginals={displayMarginals}
                  showMarginals={showMarginals}
                  distributionMode={distributionMode}
                  firstCellRef={cellAnchorRef}
                  onSquareHover={handleSquareHover}
                  onSquareClick={handleSquareClick}
                />
              </BrowseShell>
            )}
          </motion.div>
        </AnimatePresence>
      </Box>

      {isLoading && hasData && (
        <CircularProgress
          size={18}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
            opacity: 0.5,
          }}
        />
      )}

      <Snackbar
        open={mapBlockedMessage !== null}
        autoHideDuration={4500}
        onClose={closeMapBlockedMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={mapBlockedMessage ?? undefined}
        ContentProps={{
          sx: {
            fontSize: "0.85rem",
            fontWeight: 500,
            borderRadius: theme.borderRadius.sm,
            justifyContent: "center",
            maxWidth: 320,
            px: 2,
            py: 1.5,
            "& .MuiSnackbarContent-message": {
              textAlign: "center",
              whiteSpace: "normal",
              lineHeight: 1.4,
            },
          },
        }}
      />
    </Box>
  )
}

// Outcome-row picker overlay. Mirrors the radar's "choose axes" panel:
// 220px wide, anchored to the left of the chart area, with a header,
// two group toggles ("All key outcomes" / "All regional outcomes"), and
// per-outcome checkboxes (regional variants indented under their parent
// key outcome).
function ResilienceOutcomeSelector({
  visible,
  onToggle,
  onSetAll,
  onClose,
}: {
  visible: readonly string[]
  onToggle: (code: string) => void
  onSetAll: (codes: string[]) => void
  onClose: () => void
}) {
  const theme = useTheme()
  const visibleSet = useMemo(() => new Set(visible), [visible])

  const allKeySelected = OUTCOME_CODE_ORDER.every((c) => visibleSet.has(c))
  const someKeySelected =
    !allKeySelected && OUTCOME_CODE_ORDER.some((c) => visibleSet.has(c))

  const allRegionalSelected = NOD_SOD_OUTCOME_CODES.every((c) =>
    visibleSet.has(c),
  )
  const someRegionalSelected =
    !allRegionalSelected && NOD_SOD_OUTCOME_CODES.some((c) => visibleSet.has(c))

  const toggleGroup = useCallback(
    (codes: readonly string[], allOn: boolean) => {
      if (allOn) {
        onSetAll(visible.filter((c) => !codes.includes(c)))
      } else {
        const merged = [...visible]
        for (const c of codes) {
          if (!merged.includes(c)) merged.push(c)
        }
        onSetAll(merged)
      }
    },
    [visible, onSetAll],
  )

  const withRegional = useMemo(
    () =>
      OUTCOME_CODE_ORDER.filter(
        (c) => OUTCOME_REGIONAL_VARIANTS[c as OutcomeCode] != null,
      ),
    [],
  )
  const withoutRegional = useMemo(
    () =>
      OUTCOME_CODE_ORDER.filter(
        (c) => OUTCOME_REGIONAL_VARIANTS[c as OutcomeCode] == null,
      ),
    [],
  )

  const checkboxSx = useMemo(
    () => ({ padding: 0, margin: 0, transform: "scale(0.8)" }),
    [],
  )

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: theme.space.component.lg,
        bottom: theme.space.component.md,
        width: 220,
        zIndex: 2,
        overflowY: "auto",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
        py: 1.5,
        px: 1,
      }}
    >
      <TooltipCloseButton
        onClick={onClose}
        ariaLabel="Close choose outcome rows panel"
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          fontSize: "0.7rem",
          letterSpacing: "0.04em",
          color: "text.primary",
          mb: 1,
          display: "block",
          pl: 0.5,
          pr: 5,
        }}
      >
        Choose outcome rows
      </Typography>

      <OutcomeRow
        label="All key outcomes"
        checked={allKeySelected}
        indeterminate={someKeySelected}
        bold
        onClick={() => toggleGroup(OUTCOME_CODE_ORDER, allKeySelected)}
        sx={checkboxSx}
      />
      <OutcomeRow
        label="All regional outcomes"
        checked={allRegionalSelected}
        indeterminate={someRegionalSelected}
        bold
        onClick={() => toggleGroup(NOD_SOD_OUTCOME_CODES, allRegionalSelected)}
        sx={checkboxSx}
      />

      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }} />

      {withRegional.map((code) => {
        const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]!
        return (
          <Box key={code} sx={{ mb: 0.75 }}>
            <OutcomeRow
              label={getOutcomeName(code)}
              checked={visibleSet.has(code)}
              bold
              onClick={() => onToggle(code)}
              sx={checkboxSx}
            />
            {variants.map((vCode) => (
              <OutcomeRow
                key={vCode}
                label={
                  vCode.startsWith("NOD") ? "North of Delta" : "South of Delta"
                }
                checked={visibleSet.has(vCode)}
                indent
                onClick={() => onToggle(vCode)}
                sx={checkboxSx}
              />
            ))}
          </Box>
        )
      })}

      <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }} />

      {withoutRegional.map((code) => (
        <OutcomeRow
          key={code}
          label={getOutcomeName(code)}
          checked={visibleSet.has(code)}
          bold
          onClick={() => onToggle(code)}
          sx={checkboxSx}
        />
      ))}
    </Box>
  )
}

function OutcomeRow({
  label,
  checked,
  indeterminate,
  bold,
  indent,
  onClick,
  sx,
}: {
  label: string
  checked: boolean
  indeterminate?: boolean
  bold?: boolean
  indent?: boolean
  onClick: () => void
  sx: Record<string, unknown>
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        width: "100%",
        border: "none",
        background: "none",
        cursor: "pointer",
        py: 0.35,
        pl: indent ? 2.5 : 0.5,
        pr: 0.5,
        borderRadius: 0.5,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        indeterminate={indeterminate}
        tabIndex={-1}
        sx={sx}
      />
      <Typography
        variant="caption"
        sx={{
          fontWeight: bold ? 500 : 400,
          fontSize: "0.72rem",
          lineHeight: 1.3,
          textAlign: "left",
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

/**
 * Expanded single-tile view. Shows one scenario or outcome at full
 * size with a "← Back" button that dismisses via `onBack`. Framer
 * Motion's `layoutId` lets the browser interpolate between the grid
 * tile and the full-size heatmap when the user reduced-motion pref is
 * off; with reduced motion the transition degrades to a static swap.
 */
function ExpandedTileView({
  tile,
  rows,
  columns,
  tierColors,
  tierLabels,
  palette,
  cellRender,
  showCellNumbers,
  formatRowTick,
  distributionMode,
  columnLabelRotation = 0,
  onCellHover,
  onCellClick,
  onSquareHover,
  onSquareClick,
  onBack,
  backLabel,
}: {
  tile: ResilienceSmallMultiplesTile
  rows: ResilienceAxisItem[]
  columns: ResilienceAxisItem[]
  tierColors: readonly [string, string, string, string]
  tierLabels: readonly [string, string, string, string]
  palette: ResilienceHeatmapPalette
  cellRender: ResilienceCellRender
  showCellNumbers: boolean
  formatRowTick: (row: ResilienceAxisItem) => string
  distributionMode: "scenario" | "location"
  columnLabelRotation?: number
  onCellHover: (cell: ResilienceHeatmapCell | null) => void
  onCellClick?: (cell: ResilienceHeatmapCell) => void
  onSquareHover: (
    info: {
      tileId: string
      cell: ResilienceHeatmapCell
      entry: ResilienceGlyphEntry
    } | null,
  ) => void
  onSquareClick: (info: {
    tileId: string
    cell: ResilienceHeatmapCell
    entry: ResilienceGlyphEntry
  }) => void
  onBack: () => void
  backLabel: string
}) {
  const theme = useTheme()
  const prefersReducedMotion = useReducedMotion()
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 0.5,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={onBack}
          sx={{
            appearance: "none",
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderRadius: 999,
            px: 1.25,
            py: 0.4,
            fontSize: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            "&:hover": { backgroundColor: theme.palette.action.hover },
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
            },
          }}
        >
          {`\u2190 ${backLabel}`}
        </Box>
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 600 }}
          title={tile.titleTooltip ?? tile.title}
        >
          {tile.title}
        </Typography>
        {tile.subtitle && (
          <Typography variant="caption" color="text.secondary">
            {tile.subtitle}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          Press Esc to return
        </Typography>
      </Box>
      <motion.div
        layoutId={`resilience-tile-${tile.id}`}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.25 }}
        style={{ flex: 1, minHeight: 0 }}
      >
        <ResilienceHeatmap
          rows={rows}
          columns={columns}
          cells={tile.cells}
          tierColors={tierColors}
          tierLabels={tierLabels}
          palette={palette}
          cellRender={cellRender}
          showCellNumbers={showCellNumbers}
          columnLabelRotation={columnLabelRotation}
          onCellHover={onCellHover}
          onCellClick={onCellClick}
          formatRowTick={formatRowTick}
          distributionMode={distributionMode}
          onSquareHover={(info) =>
            onSquareHover(info ? { tileId: tile.id, ...info } : null)
          }
          onSquareClick={(info) => onSquareClick({ tileId: tile.id, ...info })}
        />
      </motion.div>
    </Box>
  )
}

/**
 * Wraps a small-multiples grid with an optional curation chip above.
 * The chip tells the user "Comparing N of M · focus on my selection"
 * when they've pinned items while in show-all mode, and clicking it
 * fires the supplied `onClick` (typically flipping show-all off).
 */
/**
 * ResiliencePanelTitle - two-line header rendered at the top of the
 * chart area.
 *
 * Line 1 (title) names the chart as a noun phrase anchored on the
 * Third-role dimension ("Scenarios as small multiples", "Averaged
 * across outcomes", etc.). Line 2 (subtitle) spells out the scope
 * of the subject the chart exhibits (how many scenarios / outcomes
 * / hydroclimates). This is orthogonal to the sentence-header
 * control bar above the chart, which narrates the current
 * configuration: title = what the chart IS, sentence = how you are
 * currently looking at it.
 *
 * The title follows the same Z-dim / Z-mode framing that the
 * sentence header uses (see `ResilienceControls`), so the two
 * headers stay in lockstep as the user rotates the permutation.
 */
function ResiliencePanelTitle({
  view,
  aggregateOver,
  scenarioCount,
  outcomeCount,
  climateCount,
}: {
  view: ResilienceView
  aggregateOver: AggregateOver
  scenarioCount: number
  outcomeCount: number
  climateCount: number
}) {
  const theme = useTheme()

  // Local copy of the Z-role derivation so the title doesn't have
  // to import from ResilienceControls. Must stay in sync with the
  // adapter over there.
  type ZDim = "scenario" | "outcome" | "hydroclimate"
  type ZMode = "facet" | "aggregate"
  const AGGREGATE_OVER_TO_ZDIM: Record<AggregateOver, ZDim> = {
    scenarios: "scenario",
    outcomes: "outcome",
    hydroclimates: "hydroclimate",
  }
  const DIM_PLURAL_TITLECASE: Record<ZDim, string> = {
    scenario: "Scenarios",
    outcome: "Outcomes",
    hydroclimate: "Hydroclimates",
  }
  const DIM_PLURAL_LOWER: Record<ZDim, string> = {
    scenario: "scenarios",
    outcome: "outcomes",
    hydroclimate: "hydroclimates",
  }

  let title: string
  let subtitle: string

  if (view === "quadrant") {
    title = "Leverage"
    subtitle = "Climate sensitivity against operational range"
  } else {
    const zDim: ZDim =
      view === "aggregate"
        ? AGGREGATE_OVER_TO_ZDIM[aggregateOver]
        : (view as ZDim)
    const zMode: ZMode = view === "aggregate" ? "aggregate" : "facet"

    // Mirror the sentence header's empty-selection fallback so the
    // title reads aggregate when the panel is actually showing the
    // library aggregate.
    const effectiveMode: ZMode =
      zMode === "facet" && zDim === "scenario" && scenarioCount === 0
        ? "aggregate"
        : zMode

    title =
      effectiveMode === "facet"
        ? `${DIM_PLURAL_TITLECASE[zDim]} as small multiples`
        : `Averaged across ${DIM_PLURAL_LOWER[zDim]}`

    const scopeBits: string[] = []
    if (scenarioCount > 0) {
      scopeBits.push(
        `${scenarioCount} scenario${scenarioCount === 1 ? "" : "s"}`,
      )
    } else {
      scopeBits.push("entire scenario library")
    }
    scopeBits.push(`${outcomeCount} outcome${outcomeCount === 1 ? "" : "s"}`)
    scopeBits.push(
      `${climateCount} hydroclimate${climateCount === 1 ? "" : "s"}`,
    )
    subtitle = scopeBits.join(" · ")
  }

  return (
    <Box
      sx={{
        px: theme.space.component.lg,
        pt: theme.space.component.sm,
        pb: theme.space.component.xs,
      }}
    >
      <Typography
        component="h2"
        sx={{
          m: 0,
          fontSize: "1.0625rem",
          fontWeight: 600,
          lineHeight: 1.3,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      <Typography
        component="div"
        sx={{
          mt: 0.25,
          fontSize: "0.8125rem",
          lineHeight: 1.4,
          color: theme.palette.grey[700],
        }}
      >
        {subtitle}
      </Typography>
    </Box>
  )
}

/**
 * Layout shell for the chart area. Stacks an optional curation chip
 * above the children so every view path (by-scenario gallery,
 * by-outcome gallery, aggregate) can render consistent header
 * affordances without each branch having to rebuild its own flex
 * column.
 */
function BrowseShell({
  chip,
  children,
}: {
  /**
   * Compact status/hint chip pinned above the chart. When `content` is
   * set, it fully replaces the default `label` + `actionLabel` layout,
   * letting call sites embed interactive elements (inline toggles,
   * multi-sentence copy, etc.) inside the chip surface.
   */
  chip?: {
    label?: string
    actionLabel?: string
    onClick?: () => void
    content?: React.ReactNode
  } | null
  children: React.ReactNode
}) {
  const theme = useTheme()
  if (!chip) return <>{children}</>
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        gap: 1,
      }}
    >
      {chip && (
        <Box
          sx={{
            display: "inline-flex",
            alignSelf: "flex-start",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            rowGap: 0.5,
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {chip.content ? (
            chip.content
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {chip.label}
            </Typography>
          )}
          {!chip.content && chip.actionLabel && chip.onClick && (
            <Box
              component="button"
              type="button"
              onClick={chip.onClick}
              sx={{
                appearance: "none",
                border: "none",
                background: "transparent",
                color: theme.palette.primary.main,
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: 600,
                textDecoration: "underline",
                p: 0,
                "&:hover": { opacity: 0.85 },
                "&:focus-visible": {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2,
                },
              }}
            >
              {chip.actionLabel}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>{children}</Box>
    </Box>
  )
}

/**
 * ResilienceEmptyState - consistent empty-state rendering used by
 * Scenario, Outcome, and Overview modes when the user has not yet
 * picked a primary focus (or, in Overview, when the scope is empty).
 *
 * The visual rhythm intentionally mirrors the populated panel so the
 * user does not get a different chrome for the empty case.
 */
function ResilienceEmptyState({
  eyebrow,
  title,
  body,
  actionLabel,
  onAction,
}: {
  eyebrow: string
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Box sx={{ maxWidth: 480, textAlign: "center" }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: theme.palette.grey[700],
            mb: 1,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.grey[700], mb: actionLabel ? 2 : 0 }}
        >
          {body}
        </Typography>
        {actionLabel && onAction && (
          <Box
            component="button"
            type="button"
            onClick={onAction}
            sx={{
              appearance: "none",
              border: `1px solid ${theme.palette.divider}`,
              background: theme.palette.common.white,
              color: theme.palette.text.primary,
              cursor: "pointer",
              fontSize: "0.8125rem",
              fontWeight: 500,
              lineHeight: 1.3,
              px: 1.5,
              py: 0.75,
              borderRadius: "12px",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.blue.bright,
              },
            }}
          >
            {actionLabel}
          </Box>
        )}
      </Box>
    </Box>
  )
}
