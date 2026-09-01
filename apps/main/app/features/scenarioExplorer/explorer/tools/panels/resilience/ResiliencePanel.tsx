"use client"

/**
 * ResiliencePanel - resilience heatmap.
 *
 * Control state lives on the explorer store. This panel reads
 * `resilience*` fields directly (same pattern as RadarPanel).
 *
 * CONTENTS (in source order)
 * --------------------------
 *  1. Types and props   Result/data types live in ./types. ResiliencePanelProps here.
 *  2. Store reads        resilience* slice fields + derived scenario scope.
 *  3. Columns and rows   Hydroclimate/scenario columns, outcome row codes, row ids.
 *  4. Small multiples    byScenario / byHydroclimate / byOutcome tile builders.
 *  5. Interaction         Cell/tile/row/col/square hover + click handlers.
 *  6. Map highlights       LOI distribution, pinned squares, highlight emission.
 *  7. Sidebar highlights   Row/col/tile highlight + dim derivations from sidebar.
 *  8. Latest-value refs    Refs mirroring reactive values for the capture closures.
 *  9. Capture              Solo / panel / tile capture + onCapture* wiring.
 * 10. Chart-view state     Assembles the props handed to ResiliencePanelChartView.
 * 11. Render               Error / loading / chart states.
 *
 * This file is large. Sections 4, 5, and 9 are candidates for
 * extraction into colocated hooks/modules, but they close heavily over
 * component scope. See resilience/README.md ("Refactor backlog").
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
  CircularProgress,
  Snackbar,
  Typography,
  icons,
  useTheme,
} from "@repo/ui/mui"
import { motion, AnimatePresence, useReducedMotion } from "@repo/motion"
import {
  type ResilienceAxisItem,
  type ResilienceHeatmapCell,
  type ResilienceGlyphEntry,
  type ResilienceSmallMultiplesTile,
} from "@repo/viz"
import { useResilienceSlice, useWorkspaceSlice } from "../../../store"
import { useScrollRightIndicator } from "../../hooks/useScrollRightIndicator"
import ScrollRightIndicator from "../../chrome/layout/ScrollRightIndicator"

export type {
  ResilienceView,
  CellEncoding,
  DeltaMode,
  ResilienceControlsState,
} from "../../../store"
import type { ResilienceView } from "../../../store"
import {
  useResilienceMatrix,
  type ResilienceHydroclimate,
} from "./useResilienceMatrix"
import { useResilienceLoiDistribution } from "./useResilienceLoiDistribution"
import { useOutcomeMapAction } from "../../../../../map/hooks"
import { mapActions, type LocationHighlight } from "../../../../../map/store"
import { getOutcomeLocationCoordinates } from "../../../../../map/config/outcomeLocations"
import {
  OUTCOME_CODE_ORDER,
  OUTCOME_REGIONAL_VARIANTS,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  getOutcomeDefinition,
  type OutcomeCode,
} from "../../../../../../content/outcomes"
import {
  HYDROCLIMATE_SHORT_LABELS,
  HYDROCLIMATE_LABELS_BY_VALUE,
  HYDROCLIMATE_DESCRIPTIONS_BY_VALUE,
} from "../../../../../../content/scenarios"
import { getTierLabel } from "../../../../../../content/tiers"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../../../../utils/scenarioIdSort"
import {
  captureResilienceOffscreen,
  RESILIENCE_TILE_CAPTURE_WIDTH,
  RESILIENCE_TILE_CAPTURE_HEIGHT,
} from "./OffscreenResilienceCapture"
import { captureResiliencePanelOffscreen } from "./OffscreenResiliencePanelCapture"
import ResiliencePanelChartView, {
  computeResiliencePanelSmallMultiplesCaptureHeight,
  type ResiliencePanelChartViewState,
  type ResiliencePanelChartViewProps,
  type ResiliencePanelChartViewHandlers,
} from "./ResiliencePanelChartView"
import type { HoveredInteraction } from "../../../useExploreHoverCoordination"
import { useResilienceHeatmapTheme } from "./useResilienceHeatmapTheme"
import {
  transposeTile,
  resolveCellRender,
  getMapLinkBlockedMessage,
  resolveScenarioIdFromCell,
  hoverPayloadFromCell,
} from "./heatmap"
import OutcomeChooserPanel from "../../components/OutcomeChooserPanel"
import { ResiliencePanelTitle } from "./ResiliencePanelTitle"

export type {
  ResilienceChartDataRow,
  ResilienceHeatmapChartData,
  ResilienceCaptureResult,
} from "./types"
import type { ResilienceChartDataRow, ResilienceCaptureResult } from "./types"

export type {
  ResilienceCaptureFn,
  ResilienceTileCaptureFn,
  ResilienceScenarioSoloCaptureFn,
} from "../../../share/capture/types"
import type {
  ResilienceCaptureFn,
  ResilienceTileCaptureFn,
  ResilienceScenarioSoloCaptureFn,
} from "../../../share/capture/types"

interface ResiliencePanelProps {
  highlightedIds?: Set<string> | null
  onChartHover?: (info: HoveredInteraction | null) => void
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
   * Invoked once after mount with a function that captures one
   * scenario as a synthesized scenario-solo tile, independent of
   * the panel's current view. The scenario sidebar uses this so
   * clicking a row's share icon always produces a card scoped to
   * that scenario (matching radar / equity sidebar semantics)
   * even when the live panel is showing a different view.
   */
  onCaptureScenarioSoloReady?: (
    capture: ResilienceScenarioSoloCaptureFn,
  ) => void
  /**
   * Invoked when the user clicks a per-tile share icon inside the
   * small-multiples grid. Consumers typically call the function
   * produced by `onCaptureTileReady` and then add a ShareItem.
   */
  onTileShare?: (tileId: string) => void | Promise<boolean> | boolean
}

const HYDROCLIMATE_DESCRIPTIONS = HYDROCLIMATE_DESCRIPTIONS_BY_VALUE
const HYDROCLIMATE_LABELS = HYDROCLIMATE_LABELS_BY_VALUE

const HISTORICAL_HC: ResilienceHydroclimate = "historical"

export default function ResiliencePanel({
  highlightedIds = null,
  onChartHover,
  onCaptureReady,
  onCaptureTileReady,
  onCaptureScenarioSoloReady,
  onTileShare,
}: ResiliencePanelProps) {
  const theme = useTheme()
  const {
    resilienceView: view,
    resilienceCellEncoding: cellEncoding,
    resilienceDeltaMode: deltaMode,
    resilienceDeltaBaselineScenarioId: deltaBaselineScenarioId,
    resilienceShowAllScenarios: showAllScenarios,
    resilienceSelectedHydroclimates: selectedHydroclimates,
    resilienceShowCellNumbers: showCellNumbers,
    resiliencePrimaryOutcomeCode: primaryOutcomeCode,
    resilienceCompareOutcomeCodes: compareOutcomeCodes,
    resilienceTransposed: transposed,
    showResilienceOutcomeSelector,
    setShowResilienceOutcomeSelector,
    resilienceVisibleOutcomes,
    toggleResilienceOutcome,
    setResilienceVisibleOutcomes,
    resilienceDistributionMode: distributionMode,
  } = useResilienceSlice()
  const { selectedScenarios, setHydroclimate } = useWorkspaceSlice()

  // ============================================================
  // Store-derived scope, columns, and rows
  // ============================================================
  const _effectiveScenarioScope = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return [] // sentinel: "all" resolved from matrix
    return selectedScenarios
  }, [showAllScenarios, selectedScenarios])

  // "Empty" per-outcome only when neither the outcome-axis picker nor
  // the primary/compare fields yield any renderable outcome.
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
  const effectiveView: ResilienceView = view

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
   * Heatmap axis ticks show the scenario's full display name. Dense
   * axes stay legible via truncation-with-ellipsis in ResilienceHeatmap
   * (native `<title>` tooltip on truncation), not a short code.
   * `definitionTooltip` carries the description for the richer hover
   * card when one is on file.
   */
  const resolveScenarioAxisItem = useCallback(
    (sid: string): ResilienceAxisItem => {
      const s = scenarios.find((x) => x.scenarioId === sid)
      return {
        key: sid,
        label: getDisplayName(sid),
        definitionTooltip:
          s?.description && s.description.length > 0
            ? s.description
            : undefined,
      }
    },
    [scenarios, getDisplayName],
  )

  const { showOutcomeOnMap, isOutcomeActive, isMapVisible, activeOutcome } =
    useOutcomeMapAction()

  // Tier colors, labels, and heatmap chrome palette shared with the
  // Share-tab live thumbnails so the viz stays theme-agnostic without
  // duplicating the token wiring in every caller.
  const {
    tierColors,
    tierLabels,
    palette: heatmapPalette,
  } = useResilienceHeatmapTheme()

  // Hydroclimate (X axis) items: the selected HC chips in canonical
  // order. Used by every view's column axis: by-scenario tiles,
  // by-outcome tiles, and (transposed) by-hydroclimate tiles.
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

  // Outcome-row order, shared by every view. A row shows up when its
  // own code is selected in the Rows chooser (`resilienceVisibleOutcomes`)
  // - this applies to parent outcomes and to NOD/SOD variants alike, so
  // picking "North of Delta" on its own is enough, with no dependency on
  // the parent also being selected.
  //   - Outcome mode's tile set is handled separately via
  //     outcomeSmallMultiplesCodes; this only governs rows within a
  //     tile (by-scenario, by-hydroclimate) or the LOI-distribution scope.
  const outcomeRowCodes = useMemo(() => {
    const rows: string[] = []
    const selected = new Set(resilienceVisibleOutcomes)
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

  // Outcome-mode small-multiples codes. Driven primarily by the
  // outcome-axis picker (`resilienceVisibleOutcomes`). A user-chosen
  // "primary outcome" floats to the front, and any compare codes
  // follow it. Remaining visible outcomes fill in after. Regional
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
  // view's visible scenarios so we don't over-fetch. NOD/SOD aggregate
  // rows are skipped because they're already regional roll-ups.
  const loiDistributionEnabled =
    cellEncoding === "distribution" && distributionMode === "location"

  const loiDistributionScope = useMemo<readonly string[]>(() => {
    if (!loiDistributionEnabled) return []
    // By-scenario and by-outcome views both fall back to all 24 when no
    // sidebar selection is present.
    if (showAllScenarios || selectedScenarios.length === 0) {
      return scenarioIds
    }
    return selectedScenarios
  }, [loiDistributionEnabled, scenarioIds, showAllScenarios, selectedScenarios])

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
  // literal each call, which would otherwise cascade through the tile
  // cell builders and rebuild the SVG on every parent re-render -
  // observed as a hover-induced infinite render loop on outcomes whose
  // hover sets hoveredSquareHighlight to a non-null value).
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

  // By-scenario view focus: sidebar-driven. Scenario mode no longer
  // has its own picker. We key the focused scenario off the first
  // selected one, falling back to the primary baseline so the map
  // layer always has a valid scenario id.
  const effectiveFocusScenarioId = useMemo<string | null>(() => {
    if (selectedScenarios.length > 0) return selectedScenarios[0] ?? null
    if (showAllScenarios) return PRIMARY_SCENARIO_BASELINE_ID
    return null
  }, [selectedScenarios, showAllScenarios])

  // Scenario-mode small-multiples scope: the sidebar selection in
  // canonical order, with the primary baseline pinned first. Empty
  // when the sidebar is empty.
  const scenarioSmallMultiplesIds = useMemo<string[]>(() => {
    if (view !== "scenario") return []
    if (selectedScenarios.length === 0) return []
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [view, selectedScenarios, scenarioRowIdsAll])

  // Best-effort scenario id for map actions. The map layer always
  // needs a scenario to key the visualization request. We fall back
  // through: explicit focus → first selected → baseline. The layer
  // geometry is scenario-invariant for the outcomes we show, so any
  // valid id is fine.
  const mapScenarioFallback = useMemo<string>(() => {
    return (
      effectiveFocusScenarioId ??
      selectedScenarios[0] ??
      PRIMARY_SCENARIO_BASELINE_ID
    )
  }, [effectiveFocusScenarioId, selectedScenarios])

  const effectiveCellRender = useMemo(
    () => resolveCellRender(view, deltaMode),
    [view, deltaMode],
  )

  // Per-scenario cell computation for the by-scenario small-multiples
  // view. Honors the active delta mode so the small-multiples respect
  // the Climate shift control when set.
  // ============================================================
  // 4. Small multiples (by scenario / hydroclimate / outcome)
  // ============================================================
  const computeScenarioTileCell = useCallback(
    (
      scenarioId: string,
      rowKey: string,
      hc: ResilienceHydroclimate,
      rowLabel: string,
      subject: string,
      colLabel: string,
      colLabelFull?: string,
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
        colLabelFull,
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
  // view. Primary + compare by default. Full 24 when "show all" is on,
  // or when nothing is selected in the sidebar, so the panel is never
  // left with an empty grid.
  const byScenarioScope = useMemo<readonly string[]>(() => {
    if (view !== "scenario") return []
    if (showAllScenarios || selectedScenarios.length === 0) {
      return scenarioRowIdsAll
    }
    return scenarioSmallMultiplesIds
  }, [
    view,
    showAllScenarios,
    selectedScenarios,
    scenarioRowIdsAll,
    scenarioSmallMultiplesIds,
  ])

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
            col.fullLabel,
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

  // Shared row axis for by-scenario tiles.
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
      colLabelFull?: string,
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
        colLabelFull,
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

  // By-hydroclimate small multiples: one tile per hydroclimate, Y =
  // outcomes, X = scenarios. Mirrors the by-scenario / by-outcome gallery
  // pattern (multi-tile grid, shared legend).
  const byHydroclimateScenarioColIds = useMemo<readonly string[]>(() => {
    if (showAllScenarios) return scenarioRowIdsAll
    if (selectedScenarios.length === 0) return scenarioRowIdsAll
    const selectedSet = new Set(selectedScenarios)
    return scenarioRowIdsAll.filter((id) => selectedSet.has(id))
  }, [showAllScenarios, scenarioRowIdsAll, selectedScenarios])

  // Column axis (scenarios) for by-hydroclimate tiles. Respects the
  // sidebar selection the same way the by-outcome gallery does.
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
      colLabelFull?: string,
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
        colLabelFull,
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
        for (const col of byHydroclimateColumnItems) {
          const sid = col.key
          const c = computeHydroclimateTileCell(
            sid,
            rk,
            hc,
            rl,
            longHydroLabel,
            getDisplayName(sid),
            col.fullLabel,
          )
          if (c) tileCells.push(c)
        }
      }
      tiles.push({
        id: hc,
        title: longHydroLabel,
        titleTooltip: desc ? `${longHydroLabel}\n${desc}` : longHydroLabel,
        cells: tileCells,
      })
    }
    return tiles
  }, [
    view,
    hydroclimates,
    selectedHydroclimates,
    outcomeRowCodes,
    byHydroclimateColumnItems,
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
            col.fullLabel,
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

  // Hover coordination with the sidebar (debounced)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoverKeyRef = useRef<string | null>(null)

  const hoverKey = useCallback(
    (info: HoveredInteraction | null) =>
      info
        ? `${info.scenarioId}|${info.outcome ?? ""}|${info.tierValue ?? ""}`
        : null,
    [],
  )

  const notifyChartHover = useCallback(
    (info: HoveredInteraction | null) => {
      const key = hoverKey(info)
      if (lastHoverKeyRef.current === key) return
      lastHoverKeyRef.current = key
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (info != null) {
        startTransition(() => {
          onChartHover?.(info)
        })
      } else {
        hoverTimerRef.current = setTimeout(() => {
          startTransition(() => {
            onChartHover?.(null)
          })
        }, 150)
      }
    },
    [hoverKey, onChartHover],
  )

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  // ============================================================
  // 5. Interaction handlers (cell / tile / row / col / square hover + click)
  // Refactor backlog: the most interdependent cluster (timers, refs,
  // pinned-square state). Highest regression risk. Extract last.
  // ============================================================
  const handleCellHover = useCallback(
    (cell: ResilienceHeatmapCell | null) => {
      if (!cell) {
        notifyChartHover(null)
        return
      }
      const scenarioId = resolveScenarioIdFromCell(cell)
      if (!scenarioId) {
        notifyChartHover(null)
        return
      }
      notifyChartHover(hoverPayloadFromCell(cell, scenarioId))
    },
    [notifyChartHover],
  )

  const handleTileHover = useCallback(
    (tileId: string | null) => {
      if (!tileId) {
        notifyChartHover(null)
        return
      }
      notifyChartHover({ scenarioId: tileId })
    },
    [notifyChartHover],
  )

  const handleRowKeyHover = useCallback(
    (rowKey: string | null) => {
      if (!rowKey) {
        notifyChartHover(null)
        return
      }
      notifyChartHover({ scenarioId: rowKey })
    },
    [notifyChartHover],
  )

  const handleColKeyHover = useCallback(
    (colKey: string | null) => {
      if (!colKey) {
        notifyChartHover(null)
        return
      }
      notifyChartHover({ scenarioId: colKey })
    },
    [notifyChartHover],
  )

  const triggerMapForOutcome = useCallback(
    (outcomeCode: string, hydroclimateAwareSid: string | null) => {
      const sid = hydroclimateAwareSid ?? mapScenarioFallback
      if (!isOutcomeActive(outcomeCode, sid)) {
        showOutcomeOnMap(outcomeCode, sid)
      }
    },
    [mapScenarioFallback, showOutcomeOnMap, isOutcomeActive],
  )

  // Whether clicking this cell can drive the map today. The derived
  // encodings (climate shift, density, leverage) do not map cleanly
  // onto the per-LOI tier paint that the map pipeline serves, so we
  // explain that in a Snackbar instead of painting an approximation.
  const cellMapsCleanly = useCallback(
    (cell: ResilienceHeatmapCell): boolean => {
      if (!cell.outcomeCode) return false
      if (
        cellEncoding === "delta" ||
        cellEncoding === "density_opp" ||
        cellEncoding === "leverage"
      ) {
        return false
      }
      return true
    },
    [cellEncoding],
  )

  // Snackbar message for clicks that can't drive the map. We store the
  // reason as a string so each click shows copy that matches its own
  // gating condition (derived encoding vs. missing outcome) rather
  // than the generic "coming soon" line. `null` means closed.
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
        openMapBlockedMessage(getMapLinkBlockedMessage(cellEncoding, false))
        return
      }
      if (!cellMapsCleanly(cell)) {
        openMapBlockedMessage(getMapLinkBlockedMessage(cellEncoding, true))
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
  // popups on the map (same UX as the tier-animation storyboard's key-outcomes overlay).
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
  // not trigger a render. We emit to the map store imperatively from the
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
  // ============================================================
  // 6. Map highlights (LOI distribution, pinned squares, emission)
  // ============================================================
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
  // path as the radar's dot-hover). "Location" feeds the merged
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
          notifyChartHover(null)
        }
        return
      }
      if (distributionMode === "location") {
        const built = buildLocationHighlight(info.cell, info.entry)
        hoveredSquareHighlightRef.current = built?.highlight ?? null
        emitLocationHighlights()
      } else {
        const sid = info.entry.scenarioId
        if (sid) {
          notifyChartHover(hoverPayloadFromCell(info.cell, sid))
        }
      }
    },
    [
      distributionMode,
      notifyChartHover,
      buildLocationHighlight,
      emitLocationHighlights,
    ],
  )

  // Per-square click. Opens the outcome's map layer and (location mode)
  // toggles a persistent pin for the clicked LOI. No-op when the map
  // is hidden, same guard as handleCellClick above. Derived-encoding
  // cells short-circuit to the reason-specific Snackbar - even the LOI
  // pin is gated, since the pin's tier color would disagree with the
  // cell's reduced scalar.
  const handleSquareClick = useCallback(
    (info: { cell: ResilienceHeatmapCell; entry: ResilienceGlyphEntry }) => {
      const { cell, entry } = info
      const outcomeCode = cell.outcomeCode
      if (!isMapVisible) return
      if (!outcomeCode) {
        openMapBlockedMessage(getMapLinkBlockedMessage(cellEncoding, false))
        return
      }
      if (!cellMapsCleanly(cell)) {
        openMapBlockedMessage(getMapLinkBlockedMessage(cellEncoding, true))
        return
      }

      if (cell.hydroclimate) {
        setHydroclimate(cell.hydroclimate)
      }

      if (distributionMode === "location") {
        // Location mode encodes LOIs. Entries carry no scenarioId, so we
        // defer to triggerMapForOutcome which picks between the
        // hydroclimate-aware and fallback scenario. Pin state below
        // updates regardless. The guard inside the trigger prevents
        // repeat clicks from toggling the layer off.
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

  // Sidebar → chart: emphasize scenario rows, columns, or tiles.
  // ============================================================
  // 7. Sidebar-driven highlight + dim derivations
  // ============================================================
  const highlightedRowKeysFromSidebar = useMemo<Set<string> | null>(() => {
    if (!highlightedIds || highlightedIds.size === 0) return null
    if (view === "outcome") return new Set(highlightedIds)
    return null
  }, [highlightedIds, view])

  const highlightedColKeysFromSidebar = useMemo<Set<string> | null>(() => {
    if (!highlightedIds || highlightedIds.size === 0) return null
    if (view === "hydroclimate") return new Set(highlightedIds)
    return null
  }, [highlightedIds, view])

  const highlightedTileIdsFromSidebar = useMemo<Set<string> | null>(() => {
    if (!highlightedIds || highlightedIds.size === 0) return null
    if (view === "scenario") return new Set(highlightedIds)
    return null
  }, [highlightedIds, view])

  const dimRowKeys = useMemo<Set<string> | null>(() => {
    if (view !== "outcome") return null
    if (selectedScenarios.length === 0) return null
    return new Set(selectedScenarios)
  }, [view, selectedScenarios])

  const effectiveRowHighlight = useMemo<Set<string> | null>(() => {
    if (
      highlightedRowKeysFromSidebar &&
      highlightedRowKeysFromSidebar.size > 0
    ) {
      return highlightedRowKeysFromSidebar
    }
    return dimRowKeys
  }, [highlightedRowKeysFromSidebar, dimRowKeys])

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

  // Show cell values and transpose both live in the chart controls
  // (Rows row), so this panel no longer renders a floating display
  // menu. Nothing else remains for a chart-corner toolbar to hold.
  // const handleOpenWalkthrough = useCallback(() => {
  //   setWalkthroughOpen(true)
  // }, [])

  // View-level transpose transform. Applied just before render so the
  // underlying tile compute pipeline stays unchanged.
  //
  // These hooks must sit above the early returns below so React
  // always sees the same hook-call order on every render (the
  // `error` / `isLoading && !hasData` branches bail out before the
  // main tree renders).
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

  /**
   * One by-scenario small-multiples tile for any valid scenario id, even
   * when the panel is showing a different view or the scenario is not
   * in the on-screen small-multiples scope. Used for share/capture
   * without duplicating the full grid in the DOM.
   */
  const makeScenarioSoloMultiplesTile = useCallback(
    (sid: string): ResilienceSmallMultiplesTile | null => {
      if (!scenarioRowIdsAll.includes(sid)) return null
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
            col.fullLabel,
          )
          if (c) tileCells.push(c)
        }
      }
      const base: ResilienceSmallMultiplesTile = {
        id: sid,
        title,
        cells: tileCells,
      }
      return transposed ? transposeTile(base) : base
    },
    [
      scenarioRowIdsAll,
      getDisplayName,
      outcomeRowCodes,
      hydroclimateColumns,
      computeScenarioTileCell,
      transposed,
    ],
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

  // Per-tile capture locates the tile's root SVG via the
  // `data-tile-id` attribute that `ResilienceHeatmapSmallMultiples`
  // stamps on each tile wrapper.
  // ============================================================
  // 8. Latest-value refs
  // Mirror reactive values so the capture closures (section 9) can
  // read current data without being re-created on every change.
  // ============================================================
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

  // ============================================================
  // 9. Capture (solo / panel / tile) + onCapture* wiring
  // Refactor backlog: candidate useResilienceCapture hook, but it
  // threads ~8 refs + ~15 reactive values + the capture props, and two
  // refs (chartViewState/Visuals) are declared in section 10. Deferred;
  // see resilience/README.md before extracting.
  // ============================================================
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

  const renderSoloScenarioForShare = useCallback(
    async (scenarioId: string): Promise<ResilienceCaptureResult | null> => {
      const tile = makeScenarioSoloMultiplesTile(scenarioId)
      if (!tile) return null
      // Refuse to capture an empty card. Happens when the user has cleared
      // all hydroclimate chips or all outcome rows. The heatmap would
      // render a blank thumbnail and the share card would be unhelpful.
      if (tile.cells.length === 0) {
        console.warn(
          "[ResiliencePanel] renderSoloScenarioForShare: nothing to draw for",
          scenarioId,
          "(no outcomes or hydroclimates selected); skipping share.",
        )
        return null
      }
      const encoding = cellEncodingRef.current
      try {
        const { svg, dataUrl } = await captureResilienceOffscreen({
          theme,
          width: RESILIENCE_TILE_CAPTURE_WIDTH,
          height: RESILIENCE_TILE_CAPTURE_HEIGHT,
          captureKind: "resilience:scenario-solo",
          props: {
            rows: displayByScenarioRows,
            columns: displayByScenarioColumns,
            cells: tile.cells,
            tierColors,
            tierLabels,
            palette: heatmapPalette,
            cellRender: effectiveCellRender,
            showCellNumbers,
            hideLegend: true,
            distributionMode,
            formatRowTick,
          },
        })
        return {
          svg,
          dataUrl,
          chartData: {
            kind: "resilience" as const,
            view: "scenario" as const,
            cellEncoding: encoding,
            tileScope: "scenario" as const,
            tileLabel: tile.title,
            rows: cellsToRows(tile.cells),
          },
        }
      } catch (err) {
        console.error(
          "[ResiliencePanel] renderSoloScenarioForShare failed:",
          err,
        )
        return null
      }
    },
    [
      makeScenarioSoloMultiplesTile,
      displayByScenarioRows,
      displayByScenarioColumns,
      tierColors,
      tierLabels,
      heatmapPalette,
      effectiveCellRender,
      showCellNumbers,
      distributionMode,
      formatRowTick,
      cellsToRows,
      theme,
    ],
  )

  const captureResilience = useCallback<ResilienceCaptureFn>(async () => {
    try {
      // Small-multiples views can have up to 24 tiles. A fixed-size
      // canvas would either squish them or clip everything below the
      // fold via the live grid's `overflowY: auto`. Compute a
      // content-aware height so every tile renders into the composed
      // SVG at the same row pitch the live grid uses.
      const captureState = chartViewStateRef.current
      const dynamicHeight =
        captureState.kind === "smallMultiples"
          ? computeResiliencePanelSmallMultiplesCaptureHeight({
              tilesCount: captureState.tiles.length,
              tileAspect: captureState.tileAspect,
              rowsCount: captureState.rows.length,
            })
          : undefined
      const { svg, dataUrl } = await captureResiliencePanelOffscreen({
        state: captureState,
        view: chartViewVisualsRef.current,
        theme,
        backgroundColor: theme.palette.common.white,
        ...(dynamicHeight ? { height: dynamicHeight } : {}),
      })
      let rowsOut: ResilienceChartDataRow[]
      const tileScope: "panel" | "scenario" | "outcome" | "hydroclimate" =
        "panel"
      if (effectiveView === "scenario") {
        rowsOut = byScenarioTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
      } else if (effectiveView === "outcome") {
        rowsOut = byOutcomeTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
      } else {
        rowsOut = byHydroclimateTilesRef.current.flatMap((t) =>
          cellsToRows(t.cells).map((r) => ({
            ...r,
            rowLabel: `${t.title} / ${r.rowLabel}`,
          })),
        )
      }
      return {
        svg,
        dataUrl,
        chartData: {
          kind: "resilience",
          view: effectiveView,
          cellEncoding: cellEncodingRef.current,
          tileScope,
          rows: rowsOut,
        },
      }
    } catch (err) {
      console.error("[ResiliencePanel] captureResilience failed:", err)
      return null
    }
  }, [cellsToRows, theme, effectiveView])

  const captureResilienceTile = useCallback<ResilienceTileCaptureFn>(
    async (tileId) => {
      let tileScope: "scenario" | "outcome" | "hydroclimate"
      let tileSource: ResilienceSmallMultiplesTile[]
      let rows: ResilienceAxisItem[]
      let columns: ResilienceAxisItem[]
      if (effectiveView === "outcome") {
        tileScope = "outcome"
        tileSource = byOutcomeTilesRef.current
        rows = displayByOutcomeRows
        columns = displayByOutcomeColumns
      } else if (effectiveView === "hydroclimate") {
        tileScope = "hydroclimate"
        tileSource = byHydroclimateTilesRef.current
        rows = displayByHydroclimateRows
        columns = displayByHydroclimateColumns
      } else {
        tileScope = "scenario"
        tileSource = byScenarioTilesRef.current
        rows = displayByScenarioRows
        columns = displayByScenarioColumns
      }
      const tile = tileSource.find((t) => t.id === tileId)
      // Scenario view falls back to a synthesized solo tile when the
      // requested scenario is not on screen (the small-multiples grid
      // hides scenarios outside the current selection).
      if (!tile) {
        if (
          effectiveView === "scenario" &&
          scenarioRowIdsAll.includes(tileId)
        ) {
          return await renderSoloScenarioForShare(tileId)
        }
        return null
      }
      try {
        const { svg, dataUrl } = await captureResilienceOffscreen({
          theme,
          width: RESILIENCE_TILE_CAPTURE_WIDTH,
          height: RESILIENCE_TILE_CAPTURE_HEIGHT,
          captureKind: `resilience:tile:${tileScope}`,
          props: {
            rows,
            columns,
            cells: tile.cells,
            tierColors,
            tierLabels,
            palette: heatmapPalette,
            cellRender: effectiveCellRender,
            showCellNumbers,
            hideLegend: true,
            distributionMode,
            formatRowTick,
          },
        })
        return {
          svg,
          dataUrl,
          chartData: {
            kind: "resilience",
            view: effectiveView,
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
    [
      effectiveView,
      cellsToRows,
      renderSoloScenarioForShare,
      scenarioRowIdsAll,
      theme,
      tierColors,
      tierLabels,
      heatmapPalette,
      effectiveCellRender,
      showCellNumbers,
      distributionMode,
      formatRowTick,
      displayByScenarioRows,
      displayByScenarioColumns,
      displayByOutcomeRows,
      displayByOutcomeColumns,
      displayByHydroclimateRows,
      displayByHydroclimateColumns,
    ],
  )

  useEffect(() => {
    onCaptureReady?.(captureResilience)
  }, [captureResilience, onCaptureReady])

  useEffect(() => {
    onCaptureTileReady?.(captureResilienceTile)
  }, [captureResilienceTile, onCaptureTileReady])

  useEffect(() => {
    onCaptureScenarioSoloReady?.(renderSoloScenarioForShare)
  }, [renderSoloScenarioForShare, onCaptureScenarioSoloReady])

  // Per-tile share icon in the tile header. The button does not
  // participate in tile hover. It only fires the external `onTileShare`,
  // which resolves to `handleResilienceTileSnapshot` in `ScenarioExplorer`.
  const renderTileShareAction = useMemo(() => {
    if (!onTileShare) return undefined
    const handleTileShare = onTileShare
    function ResilienceTileShareButton(tile: ResilienceSmallMultiplesTile) {
      return (
        <Box
          component="button"
          type="button"
          className="resilience-tile-action"
          aria-label={`Save snapshot of ${tile.title}`}
          title="Save snapshot of this tile"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation()
            handleTileShare(tile.id)
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            padding: 0,
            borderRadius: "4px",
            border: "none",
            background: "transparent",
            color: theme.palette.text.primary,
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.blue.bright,
              backgroundColor: theme.palette.interaction.selectedBackground,
            },
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 1,
            },
          }}
        >
          <icons.IosShare sx={{ fontSize: "1.375rem", color: "inherit" }} />
        </Box>
      )
    }
    ResilienceTileShareButton.displayName = "ResilienceTileShareButton"
    return ResilienceTileShareButton
  }, [onTileShare, theme])

  // Snapshot of the chart-area state in the shape ResiliencePanelChartView
  // expects. Both the live render and captureResilience read this so the
  // toolbar share produces the same chart at fixed dimensions.
  // ============================================================
  // 10. Chart-view state assembly
  // ============================================================
  const chartViewState = useMemo<ResiliencePanelChartViewState>(() => {
    // Scenario names land on the column axis - needing the same
    // rotate-to-fit treatment - whenever transpose puts them there:
    // by-hydroclimate view untransposed, or by-outcome view transposed.
    const labelRotation =
      (!transposed && effectiveView === "hydroclimate") ||
      (transposed && effectiveView === "outcome")
        ? -90
        : 0
    if (hydroclimateColumns.length === 0) return { kind: "noColumns" }
    if (outcomeRowCodes.length === 0 && !outcomeEmpty) {
      return { kind: "noOutcomesSelected" }
    }
    if (outcomeEmpty) {
      return {
        kind: "outcomeEmpty",
        eyebrow: "Outcome",
        title: "No outcomes to show",
        body: "Open the outcome picker (or the Outcomes phrase in the sentence above) and pick at least one outcome to see its tile.",
      }
    }
    if (effectiveView === "scenario") {
      return {
        kind: "smallMultiples",
        view: "scenario",
        rows: displayByScenarioRows,
        columns: displayByScenarioColumns,
        tiles: displayByScenarioTiles,
        tileAspect: transposed ? "tall" : "wide",
        highlightedTileIds: highlightedTileIdsFromSidebar,
      }
    }
    if (effectiveView === "outcome") {
      return {
        kind: "smallMultiples",
        view: "outcome",
        rows: displayByOutcomeRows,
        columns: displayByOutcomeColumns,
        tiles: displayByOutcomeTiles,
        tileAspect: transposed ? "wide" : "tall",
        columnLabelRotation: labelRotation,
        highlightedRowKeys: effectiveRowHighlight,
      }
    }
    return {
      kind: "smallMultiples",
      view: "hydroclimate",
      rows: displayByHydroclimateRows,
      columns: displayByHydroclimateColumns,
      tiles: displayByHydroclimateTiles,
      tileAspect: transposed ? "tall" : "wide",
      columnLabelRotation: labelRotation,
      highlightedColKeys: highlightedColKeysFromSidebar,
    }
  }, [
    effectiveView,
    transposed,
    hydroclimateColumns.length,
    outcomeRowCodes.length,
    outcomeEmpty,
    displayByScenarioRows,
    displayByScenarioColumns,
    displayByScenarioTiles,
    displayByOutcomeRows,
    displayByOutcomeColumns,
    displayByOutcomeTiles,
    displayByHydroclimateRows,
    displayByHydroclimateColumns,
    displayByHydroclimateTiles,
    effectiveRowHighlight,
    highlightedColKeysFromSidebar,
    highlightedTileIdsFromSidebar,
  ])

  const chartViewVisuals = useMemo<
    Omit<ResiliencePanelChartViewProps, "state" | "handlers">
  >(
    () => ({
      tierColors,
      tierLabels,
      palette: heatmapPalette,
      cellRender: effectiveCellRender,
      showCellNumbers,
      formatRowTick,
      distributionMode,
    }),
    [
      tierColors,
      tierLabels,
      heatmapPalette,
      effectiveCellRender,
      showCellNumbers,
      formatRowTick,
      distributionMode,
    ],
  )

  const chartViewStateRef = useRef(chartViewState)
  useEffect(() => {
    chartViewStateRef.current = chartViewState
  }, [chartViewState])

  const chartViewVisualsRef = useRef(chartViewVisuals)
  useEffect(() => {
    chartViewVisualsRef.current = chartViewVisuals
  }, [chartViewVisuals])

  const { scrollRef, canScrollRight, checkOverflow } = useScrollRightIndicator([
    effectiveView,
  ])

  // ============================================================
  // 11. Render (error / loading / chart states)
  // ============================================================

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
    hydroclimateColumns.length > 0

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

  const liveHandlers: ResiliencePanelChartViewHandlers = {
    onCellHover: handleCellHover,
    onCellClick: isMapVisible ? handleCellClick : undefined,
    onTileHover: view === "scenario" ? handleTileHover : undefined,
    onRowKeyHover: view === "outcome" ? handleRowKeyHover : undefined,
    onColKeyHover: view === "hydroclimate" ? handleColKeyHover : undefined,
    onSquareHover: handleSquareHover,
    onSquareClick: handleSquareClick,
    renderTileActions: renderTileShareAction,
  }

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
        ref={scrollRef}
        onScroll={checkOverflow}
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            minWidth: 960,
          }}
        >
          {/* Panel-level title. Names the pivot (what the chart is) and
          spells out the specific subject it exhibits (which scenarios /
          outcomes / climates). Kept intentionally different in shape
          from the one-line sentence header so the two don't read as
          duplicates: the sentence describes how the user is currently
          configuring the chart; the title describes what the chart IS. */}
          <ResiliencePanelTitle
            view={view}
            scenarioCount={selectedScenarios.length}
            outcomeCount={resilienceVisibleOutcomes.length}
            climateCount={selectedHydroclimates.size}
          />

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
              <OutcomeChooserPanel
                title="Choose outcome rows"
                closeAriaLabel="Close choose outcome rows panel"
                selectedCodes={resilienceVisibleOutcomes}
                onToggle={toggleResilienceOutcome}
                onSetSelected={setResilienceVisibleOutcomes}
                onClose={() => setShowResilienceOutcomeSelector(false)}
                sx={{
                  left: theme.space.component.lg,
                  bottom: theme.space.component.md,
                }}
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
                <ResiliencePanelChartView
                  state={chartViewState}
                  {...chartViewVisuals}
                  handlers={liveHandlers}
                />
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
      </Box>
      <ScrollRightIndicator
        visible={canScrollRight}
        fadeColor={theme.palette.grey[100]}
      />
    </Box>
  )
}
