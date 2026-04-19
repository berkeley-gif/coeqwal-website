"use client"

/**
 * ResiliencePanel - resilience heatmap.
 *
 * Hydroclimates run along the X axis; rows are either outcomes (scenario
 * and aggregate views) or scenarios (outcome view). Cells render in one
 * of several modes:
 *   - tier:    categorical tier fill + continuous mean value.
 *   - delta:   diverging fill around 0 with signed delta vs a baseline.
 *   - density: fraction of scenarios at Tier 3+ (risk) or Tier 2- (opp).
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
  Typography,
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
import { hydroclimateOptions } from "../../../content/scenarios"
import { TIER_LABELS, getTierLabel } from "../../../content/tiers"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../utils/scenarioIdSort"
import ResilienceChartTuner from "./ResilienceChartTuner"

export type ResilienceView = "scenario" | "outcome" | "aggregate" | "quadrant"

/**
 * Cell encoding selects how each cell's fill / value is computed and drawn.
 * - `tier`: categorical tier color + arithmetic mean value (current default).
 * - `delta`: diverging color around 0, fed by `deltaMode`.
 * - `density_risk`: fraction of scenarios in Tier 3+ (red ramp, aggregate view only).
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
  | "density_risk"
  | "density_opp"
  | "glyph"
  | "distribution"
  | "leverage"

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
  focusOutcomeCode: string
  selectedHydroclimates: ReadonlySet<ResilienceHydroclimate>
  showCellNumbers: boolean
  quadrantUnit: QuadrantUnit
  quadrantOutcome: string | null
}

interface ResiliencePanelProps {
  controls: ResilienceControlsState
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
  /**
   * Optional callback for mutating the shared control state. When
   * provided, a "TUNE CHART" entry point renders in the upper-left of
   * the chart area; when omitted, the button is suppressed (useful for
   * read-only previews of the panel).
   */
  onControlsChange?: (next: Partial<ResilienceControlsState>) => void
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
 * Resolve the effective viz-level cell renderer from the logical state.
 * Density / glyph are aggregate-only; delta mode overrides tier when set.
 */
function resolveCellRender(
  view: ResilienceView,
  encoding: CellEncoding,
  deltaMode: DeltaMode,
): ResilienceCellRender {
  if (view === "aggregate") {
    if (encoding === "density_risk" || encoding === "density_opp") {
      return encoding
    }
    if (encoding === "glyph") return "glyph"
    if (encoding === "distribution") return "distribution"
    if (encoding === "leverage") return "leverage"
    return deltaMode !== "none" ? "delta" : "tier"
  }
  return deltaMode !== "none" ? "delta" : "tier"
}

export default function ResiliencePanel({
  controls,
  highlightedIds = null,
  onScenarioHover,
  onControlsChange,
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
    focusOutcomeCode,
    selectedHydroclimates,
    showCellNumbers,
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

  // Effective per-view scenario scope. Mirrors the radar-panel pattern:
  // when showAllScenarios is off, respect sidebar `selectedScenarios`;
  // when on, fall back to all 24. Phase 1 renders a single heatmap; the
  // by-scenario branch picks the first item as its focus and later
  // phases will fan this out into small multiples.
  const effectiveScenarioScope = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return [] // sentinel: "all" resolved from matrix
    return selectedScenarios
  }, [showAllScenarios, selectedScenarios])

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

  const aggregate = useResilienceAggregate({
    scenarioIds: aggregateScenarioIds,
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
      [
        TIER_LABELS[1],
        TIER_LABELS[2],
        TIER_LABELS[3],
        TIER_LABELS[4],
      ] as const,
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
  const densRiskMin = theme.palette.tierDensity.riskMin
  const densRiskMax = theme.palette.tierDensity.riskMax
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
      densityRiskMin: densRiskMin,
      densityRiskMax: densRiskMax,
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
      densRiskMin,
      densRiskMax,
      densOppMin,
      densOppMax,
      leverageMin,
      leverageMax,
    ],
  )

  // Column (X axis) items: filtered hydroclimates
  const columns: ResilienceAxisItem[] = useMemo(() => {
    return hydroclimates
      .filter((hc) => selectedHydroclimates.has(hc))
      .map((hc) => ({
        key: hc,
        label: HYDROCLIMATE_LABELS[hc] ?? hc,
        definitionTooltip: HYDROCLIMATE_DESCRIPTIONS[hc],
      }))
  }, [hydroclimates, selectedHydroclimates])

  // Outcome-row order. Driven by the "choose outcome rows" picker in
  // the store: iterates OUTCOME_CODE_ORDER to preserve the canonical
  // sequence, then interleaves each key outcome's NOD/SOD variants
  // immediately after its parent (each row included only when present
  // in `resilienceVisibleOutcomes`).
  const outcomeRowCodes = useMemo(() => {
    const selected = new Set(resilienceVisibleOutcomes)
    const rows: string[] = []
    for (const code of OUTCOME_CODE_ORDER) {
      if (selected.has(code)) rows.push(code)
      const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]
      if (variants) {
        for (const v of variants) {
          if (selected.has(v)) rows.push(v)
        }
      }
    }
    return rows
  }, [resilienceVisibleOutcomes])

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

  // By-outcome view Y axis: sidebar-selected scenarios (in the canonical
  // order) when showAllScenarios is off, or all 24 when it's on.
  const scenarioRowIds = useMemo(() => {
    if (showAllScenarios) return scenarioRowIdsAll
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  // By-scenario view focus: Phase 1 keeps a single heatmap, so we pick
  // the first sidebar-selected scenario (or the baseline when show-all
  // is on). Phase 2 replaces this with small multiples.
  const effectiveFocusScenarioId = useMemo<string | null>(() => {
    if (showAllScenarios) return PRIMARY_SCENARIO_BASELINE_ID
    return selectedScenarios[0] ?? null
  }, [showAllScenarios, selectedScenarios])

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
    () => resolveCellRender(view, cellEncoding, deltaMode),
    [view, cellEncoding, deltaMode],
  )

  // Build the underlying row keys + per-(row, col) value arrays. The
  // "displayable" value is whatever drives the primary visual encoding
  // (tier mean, delta, density fraction, aggregate mean); used both for
  // cells and for marginals / clustering.
  type RowValueFn = (rowKey: string, col: ResilienceHydroclimate) => {
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
    () => { rowKeys: string[]; rowLabels: Record<string, string>; valueFn: RowValueFn; subjectLabel: string }
  >(() => {
    if (view === "scenario") {
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
          const ref = focusId
            ? getCell(focusId, rowKey, HISTORICAL_HC)
            : null
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

    if (view === "outcome") {
      const outcomeName = getOutcomeName(focusOutcomeCode)
      const rowKeys = [...scenarioRowIds]
      const rowLabels: Record<string, string> = {}
      for (const sid of rowKeys) rowLabels[sid] = getDisplayName(sid)

      const valueFn: RowValueFn = (rowKey, hc) => {
        const cell = getCell(rowKey, focusOutcomeCode, hc)
        if (!cell) {
          return {
            continuousValue: null,
            tierLevel: null,
            available: false,
            unavailableReason: "No data for this scenario",
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
        let reference: number | null = null
        if (deltaMode === "vs_historical") {
          const ref = getCell(rowKey, focusOutcomeCode, HISTORICAL_HC)
          reference = ref?.available ? ref.continuousValue : null
        } else {
          const ref = getCell(
            deltaBaselineScenarioId,
            focusOutcomeCode,
            hc,
          )
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

      return { rowKeys, rowLabels, valueFn, subjectLabel: outcomeName }
    }

    // view === "aggregate"
    const rowKeys = [...outcomeRowCodes]
    const rowLabels: Record<string, string> = {}
    for (const code of rowKeys) rowLabels[code] = getOutcomeName(code)

    const valueFn: RowValueFn = (rowKey, hc) => {
      const agg = aggregate.getCell(rowKey, hc)
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

      if (cellEncoding === "density_risk") {
        return {
          ...baseCell,
          densityValue: agg.riskDensity,
          available: true,
          signal: agg.riskDensity,
        }
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
        // Scenario-mode default: one square per scenario in the scope,
        // colored by that scenario's tier. Annotated with scenarioId so
        // the viz can fire hover → sidebar highlight.
        let distribution: ResilienceGlyphEntry[]
        if (
          cellEncoding === "distribution" &&
          distributionMode === "location"
        ) {
          const entries =
            loiByCell[rowKey]?.[hc as ResilienceHydroclimate] ?? []
          distribution = [...entries]
        } else {
          distribution = agg.distribution.map((d) => ({
            tierLevel: d.tierLevel,
            label: getDisplayName(d.scenarioId),
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
        // Tier range across sibling operations at this hydroclimate. We
        // work on the continuous (arithmetic-mean-of-LOI) values so the
        // spread is smoother than the rounded tier 1..4 steps. Require
        // at least 2 available siblings for a meaningful range; mark
        // cells with fewer as unavailable (covered by the hatch pattern).
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
      if (deltaMode === "none") {
        return { ...baseCell, signal: agg.mean }
      }
      // Aggregate delta computation.
      let reference: number | null = null
      if (deltaMode === "vs_historical") {
        const ref = aggregate.getCell(rowKey, HISTORICAL_HC)
        reference =
          ref && ref.availableCount > 0 && ref.mean != null ? ref.mean : null
      } else {
        const ref = getCell(deltaBaselineScenarioId, rowKey, hc)
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
    view,
    cellEncoding,
    deltaMode,
    deltaBaselineScenarioId,
    outcomeRowCodes,
    scenarioRowIds,
    effectiveFocusScenarioId,
    focusOutcomeCode,
    getCell,
    getDisplayName,
    aggregate,
    distributionMode,
    loiByCell,
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
      if (view === "outcome") {
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
            view === "scenario"
              ? (effectiveFocusScenarioId ?? undefined)
              : view === "outcome"
                ? rk
                : undefined,
          outcomeCode:
            view === "scenario"
              ? rk
              : view === "outcome"
                ? focusOutcomeCode
                : rk,
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
    view,
    effectiveFocusScenarioId,
    focusOutcomeCode,
    scenarios,
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
          const isNodSod = (NOD_SOD_OUTCOME_CODES as readonly string[]).includes(
            rowKey,
          )
          if (!isNodSod) {
            distribution = loiBuildEntriesForScope(
              rowKey,
              hc,
              [scenarioId],
            )
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
  // view. Sidebar-selected by default; full 24 when "show all" is on.
  const byScenarioScope = useMemo<readonly string[]>(() => {
    if (view !== "scenario") return []
    if (showAllScenarios) return scenarioRowIdsAll
    return selectedScenarios
  }, [view, showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  const byScenarioTiles = useMemo<ResilienceSmallMultiplesTile[]>(() => {
    if (view !== "scenario" || byScenarioScope.length === 0) return []
    const tiles: ResilienceSmallMultiplesTile[] = []
    for (const sid of byScenarioScope) {
      const title = getDisplayName(sid)
      const tileCells: ResilienceHeatmapCell[] = []
      for (const rk of outcomeRowCodes) {
        const rl = getOutcomeName(rk)
        for (const col of columns) {
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
    columns,
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
  // X = climates. Phase 3 renders all 19 outcomes always. The scenario
  // rows inside each tile respect sidebar selection (falling back to
  // all 24 when sidebar is empty or show-all is on, so the panel is
  // always populated).
  const byOutcomeScenarioRowIds = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return scenarioRowIdsAll
    if (selectedScenarios.length === 0) return scenarioRowIdsAll
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  const byOutcomeRows = useMemo<ResilienceAxisItem[]>(
    () =>
      byOutcomeScenarioRowIds.map((sid) => ({
        key: sid,
        label: getDisplayName(sid),
        definitionTooltip:
          scenarios.find((s) => s.scenarioId === sid)?.description ||
          getDisplayName(sid),
      })),
    [byOutcomeScenarioRowIds, getDisplayName, scenarios],
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
          const isNodSod = (NOD_SOD_OUTCOME_CODES as readonly string[]).includes(
            outcomeCode,
          )
          if (!isNodSod) {
            distribution = loiBuildEntriesForScope(
              outcomeCode,
              hc,
              [scenarioId],
            )
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

  const byOutcomeTiles = useMemo<ResilienceSmallMultiplesTile[]>(() => {
    if (view !== "outcome") return []
    // Phase 3: always render all 19 outcomes (no subsetting yet).
    const tiles: ResilienceSmallMultiplesTile[] = []
    for (const outcomeCode of OUTCOME_CODE_ORDER) {
      const title = getOutcomeName(outcomeCode)
      const tileCells: ResilienceHeatmapCell[] = []
      for (const sid of byOutcomeScenarioRowIds) {
        const rl = getDisplayName(sid)
        for (const col of columns) {
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
    byOutcomeScenarioRowIds,
    columns,
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

  const handleCellClick = useCallback(
    (cell: ResilienceHeatmapCell) => {
      if (!isMapVisible) return
      const outcomeCode = cell.outcomeCode
      if (!outcomeCode) return
      triggerMapForOutcome(outcomeCode, cell.scenarioId ?? null)
    },
    [isMapVisible, triggerMapForOutcome],
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
      const tierColor =
        tierColors[tierColorIndex] ?? theme.palette.grey[300]
      return {
        outcomeCode,
        highlight: {
          key: `resilience-heatmap-${outcomeCode}-${loiId}`,
          longitude: coords[0],
          latitude: coords[1],
          name: entry.locationName ?? loiId,
          tierLevel: tierLevel || 1,
          tierLabel: tierLevel
            ? getTierLabel(tierLevel)
            : (entry.label ?? ""),
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
  // is hidden, same guard as handleCellClick above.
  const handleSquareClick = useCallback(
    (info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry }) => {
      const { cell, entry } = info
      const outcomeCode = cell.outcomeCode
      if (!isMapVisible) return
      if (!outcomeCode) return

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
      if (view === "outcome") return row.label
      if ((NOD_SOD_OUTCOME_CODES as readonly string[]).includes(row.key)) {
        return `  ${row.label}`
      }
      return row.label
    },
    [view],
  )

  // Aggregate view with "selected" scope + empty selection → empty state.
  const aggregateEmpty =
    view === "aggregate" &&
    aggregateScope === "selected" &&
    selectedScenarios.length === 0

  // By-scenario view with no sidebar selection and show-all off →
  // "Select scenarios, or show all" prompt. By-outcome view always has
  // tiles (it falls back to all-24 scenarios for the Y axis), so no
  // global empty state there.
  const sidebarEmpty =
    view === "scenario" &&
    !showAllScenarios &&
    selectedScenarios.length === 0

  // All three heatmap views depend on at least one visible outcome row.
  const noOutcomesSelected = outcomeRowCodes.length === 0 && view !== "quadrant"

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
    !!matrixCells &&
    Object.keys(matrixCells).length > 0 &&
    columns.length > 0

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
        <Typography variant="body2" color="text.secondary">
          Loading resilience data...
        </Typography>
      </Box>
    )
  }

  const titleForView =
    view === "outcome"
      ? "Scenarios by hydroclimate"
      : view === "aggregate"
        ? "Outcomes by hydroclimate (aggregate)"
        : "Outcomes by hydroclimate"

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
      <Box
        sx={{
          px: theme.space.component.lg,
          py: theme.space.component.sm,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* TUNE CHART entry point - pinned to the upper-left of the chart
            area so beginners have an obvious onboarding surface for the
            heatmap's many controls. Only renders when a mutator is
            wired in; suppress for read-only previews. */}
        {onControlsChange && (
          <ResilienceChartTuner
            controls={controls}
            onChange={onControlsChange}
          />
        )}
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          {titleForView}
        </Typography>
        <Typography
          variant="compactCaption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {subjectLabel}
        </Typography>
      </Box>

      <Box
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
        ) : aggregateEmpty ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2">
              Select one or more scenarios in the sidebar to aggregate over,
              or switch the aggregate scope to &ldquo;all scenarios&rdquo;.
            </Typography>
          </Box>
        ) : sidebarEmpty ? (
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
              Select one or more scenarios in the sidebar to populate this
              view, or toggle &ldquo;show all scenarios&rdquo; in the chart
              controls above.
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
              color="text.secondary"
              sx={{ textAlign: "center", maxWidth: 480 }}
            >
              No outcome rows selected. Open &ldquo;choose outcome rows&rdquo;
              in the chart controls above to pick which outcomes to display.
            </Typography>
          </Box>
        ) : view === "scenario" ? (
          <ResilienceHeatmapSmallMultiples
            rows={byScenarioRows}
            columns={columns}
            tiles={byScenarioTiles}
            tierColors={tierColors}
            tierLabels={tierLabels}
            palette={heatmapPalette}
            cellRender={effectiveCellRender}
            showCellNumbers={showCellNumbers}
            tileAspect="wide"
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
          />
        ) : view === "outcome" ? (
          <ResilienceHeatmapSmallMultiples
            rows={byOutcomeRows}
            columns={columns}
            tiles={byOutcomeTiles}
            tierColors={tierColors}
            tierLabels={tierLabels}
            palette={heatmapPalette}
            cellRender={effectiveCellRender}
            showCellNumbers={showCellNumbers}
            tileAspect="tall"
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
          />
        ) : (
          <ResilienceHeatmap
            rows={rows}
            columns={columns}
            cells={cells}
            tierColors={tierColors}
            tierLabels={tierLabels}
            palette={heatmapPalette}
            cellRender={effectiveCellRender}
            showCellNumbers={showCellNumbers}
            onCellHover={handleCellHover}
            onCellClick={isMapVisible ? handleCellClick : undefined}
            highlightedRowKeys={effectiveRowHighlight}
            formatRowTick={formatRowTick}
            marginals={marginalsData}
            showMarginals={showMarginals}
            distributionMode={distributionMode}
            onSquareHover={handleSquareHover}
            onSquareClick={handleSquareClick}
          />
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

      <Box
        sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }}
      />

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
                  vCode.startsWith("NOD")
                    ? "North of Delta"
                    : "South of Delta"
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

      <Box
        sx={{ borderBottom: `1px solid ${theme.palette.divider}`, my: 1 }}
      />

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
