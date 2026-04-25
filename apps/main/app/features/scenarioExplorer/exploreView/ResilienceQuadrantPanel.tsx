"use client"

/**
 * ResilienceQuadrantPanel
 *
 * Top-level "quadrant" view for the resilience tool. Plots climate
 * sensitivity (X) against operational leverage (Y) in two modes:
 *
 *   - `quadrantUnit === "outcome"`: one dot per outcome (aggregate over
 *     sibling groups, derived from useResilienceMatrix).
 *   - `quadrantUnit === "loi"`: one dot per location-of-interest for a
 *     single chosen outcome, backed by useResilienceLoiSensitivity.
 *
 * Aggregate scope can narrow the denominator (all 24 sibling groups vs
 * the user's selected subset). Clicking an outcome dot jumps to the
 * per-outcome heatmap. Clicking an LOI dot (or bin) focuses the map on
 * the underlying outcome for the currently focused scenario.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  startTransition,
} from "react"
import { Box, CircularProgress, Typography, useTheme } from "@repo/ui/mui"
import {
  ResilienceQuadrant,
  type ResilienceQuadrantDatum,
  type ResilienceQuadrantPalette,
} from "@repo/viz"
import { useScenarioExplorerStore } from "../store"
import {
  useResilienceMatrix,
  type ResilienceHydroclimate,
} from "../hooks/useResilienceMatrix"
import { useResilienceLoiSensitivity } from "../hooks/useResilienceLoiSensitivity"
import { useOutcomeMapAction } from "../../map/hooks"
import {
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  getOutcomeName,
  type OutcomeCode,
} from "../../../content/outcomes"
import { hydroclimateOptions } from "../../../content/scenarios"
import { PRIMARY_SCENARIO_BASELINE_ID } from "../utils/scenarioIdSort"
import type { ResilienceControlsState } from "./ResiliencePanel"
import { captureElementToBlob } from "../dataExplorer/utils/exportUtils"

/**
 * Flat, CSV-friendly payload produced when the Leverage quadrant is
 * snapshotted into the Share drawer. One row per dot (outcome or LOI)
 * with the raw x/y coordinates used by `ResilienceQuadrant`. Share
 * consumers treat it as opaque data. The CSV exporter is the only
 * reader that walks the row shape today.
 */
export interface ResilienceQuadrantChartData {
  kind: "resilience"
  view: "quadrant"
  cellEncoding: "quadrant"
  tileScope: "quadrant"
  tileLabel?: string
  xLabel: string
  yLabel: string
  rows: Array<{
    id: string
    label: string
    x: number | null
    y: number | null
    tierAtRefHc: number | null
    secondary?: string
  }>
}

export interface ResilienceQuadrantCaptureResult {
  dataUrl: string
  chartData: ResilienceQuadrantChartData
}

export type ResilienceQuadrantCaptureFn =
  () => Promise<ResilienceQuadrantCaptureResult | null>

const HISTORICAL_HC: ResilienceHydroclimate = "historical"
const CLIMATE_REF_HC: ResilienceHydroclimate = "cc95"

const HYDROCLIMATE_LABELS: Record<string, string> = Object.fromEntries(
  hydroclimateOptions.map((h) => [h.value, h.label]),
)

const NOD_SOD_SET = new Set<string>(NOD_SOD_OUTCOME_CODES)

interface ResilienceQuadrantPanelProps {
  controls: ResilienceControlsState
  onControlsChange: (next: Partial<ResilienceControlsState>) => void
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
  /**
   * Invoked once after mount with a function that captures the
   * quadrant chart as PNG + flat dot data. Follows the same
   * `onCaptureReady` pattern as RadarPanel / ResiliencePanel so the
   * parent can trigger snapshots from a shared toolbar button.
   */
  onCaptureReady?: (capture: ResilienceQuadrantCaptureFn) => void
}

export default function ResilienceQuadrantPanel({
  controls,
  onControlsChange,
  highlightedIds: _highlightedIds,
  onScenarioHover,
  onCaptureReady,
}: ResilienceQuadrantPanelProps) {
  const theme = useTheme()
  const { quadrantUnit, quadrantOutcome, aggregateScope } = controls

  const { selectedScenarios } = useScenarioExplorerStore()
  // Scenario used for LOI-level map focus. Prefer the user's first
  // sidebar selection. Fall back to the baseline so "show on map" still
  // works when nothing is pinned.
  const loiMapScenarioId = selectedScenarios[0] ?? PRIMARY_SCENARIO_BASELINE_ID
  const setHighlightedScenario = useScenarioExplorerStore(
    (s) => s.setHighlightedScenario,
  )

  const {
    scenarioIds,
    getCell,
    isLoading: matrixLoading,
    error: matrixError,
  } = useResilienceMatrix()

  const { showOutcomeOnMap, isMapVisible } = useOutcomeMapAction()

  // Effective scope: either all sibling groups or the user's selection.
  const scopeScenarioIds = useMemo<readonly string[]>(() => {
    if (aggregateScope === "selected" && selectedScenarios.length > 0) {
      return selectedScenarios
    }
    return scenarioIds
  }, [aggregateScope, selectedScenarios, scenarioIds])

  const loiOutcomeCode =
    quadrantUnit === "loi" &&
    quadrantOutcome &&
    !NOD_SOD_SET.has(quadrantOutcome)
      ? quadrantOutcome
      : null

  const loiSensitivity = useResilienceLoiSensitivity({
    outcomeCode: loiOutcomeCode,
    climateRefHc: CLIMATE_REF_HC,
    opsRefHc: CLIMATE_REF_HC,
    scopeScenarioIds,
  })

  // Tier colors from theme for the dot fill.
  const tier1 = theme.palette.tiers.tier1
  const tier2 = theme.palette.tiers.tier2
  const tier3 = theme.palette.tiers.tier3
  const tier4 = theme.palette.tiers.tier4
  const tierColors = useMemo(
    () => [tier1, tier2, tier3, tier4] as const,
    [tier1, tier2, tier3, tier4],
  )

  const textPrimary = theme.palette.text.primary
  const grey300 = theme.palette.grey[300]
  const grey400 = theme.palette.grey[400]
  const grey500 = theme.palette.grey[500]
  const grey600 = theme.palette.grey[600]
  const grey700 = theme.palette.grey[700]
  const grey100 = theme.palette.grey[100]
  const commonWhite = theme.palette.common.white

  const quadrantPalette = useMemo<ResilienceQuadrantPalette>(
    () => ({
      text: textPrimary,
      textMuted: grey700,
      hoverStroke: textPrimary,
      unavailableFill: grey100,
      unavailableStroke: grey400,
      axisLine: grey500,
      gridLine: grey300,
      quadrantLabel: grey500,
      tooltipBg: commonWhite,
      tooltipBorder: grey300,
      tooltipShadow: `0 2px 8px ${grey600}1F`,
      onDarkTier: commonWhite,
      onLightTier: textPrimary,
    }),
    [
      textPrimary,
      grey100,
      grey300,
      grey400,
      grey500,
      grey600,
      grey700,
      commonWhite,
    ],
  )

  // Build outcome-level data using useResilienceMatrix. For each outcome:
  //   climateSensitivity = mean over scope of (continuousValue[cc95] -
  //                        continuousValue[historical]).
  //   opsLeverage        = max - min of continuousValue[cc95] across scope.
  //   tierAtRefHc        = mean tier at cc95 across scope.
  const outcomeData = useMemo<ResilienceQuadrantDatum[]>(() => {
    const rows: ResilienceQuadrantDatum[] = []
    for (const code of OUTCOME_CODE_ORDER as readonly OutcomeCode[]) {
      const climateDeltas: number[] = []
      const opsValues: number[] = []
      const tierValues: number[] = []
      for (const sid of scopeScenarioIds) {
        const ref = getCell(sid, code, CLIMATE_REF_HC)
        const hist = getCell(sid, code, HISTORICAL_HC)
        if (
          ref?.available &&
          hist?.available &&
          ref.continuousValue != null &&
          hist.continuousValue != null
        ) {
          climateDeltas.push(ref.continuousValue - hist.continuousValue)
        }
        if (ref?.available && ref.continuousValue != null) {
          opsValues.push(ref.continuousValue)
          tierValues.push(ref.continuousValue)
        }
      }
      const climateDelta =
        climateDeltas.length > 0
          ? climateDeltas.reduce((a, b) => a + b, 0) / climateDeltas.length
          : null
      const opsLeverage =
        opsValues.length >= 2
          ? Math.max(...opsValues) - Math.min(...opsValues)
          : opsValues.length === 1
            ? 0
            : null
      const tierAtRefHc =
        tierValues.length > 0
          ? tierValues.reduce((a, b) => a + b, 0) / tierValues.length
          : null
      rows.push({
        id: code,
        label: getOutcomeName(code),
        x: climateDelta,
        y: opsLeverage,
        tierAtRefHc,
        secondary: code,
      })
    }
    return rows
  }, [scopeScenarioIds, getCell])

  // LOI-level data from the sensitivity hook.
  const loiData = useMemo<ResilienceQuadrantDatum[]>(() => {
    if (quadrantUnit !== "loi" || !loiOutcomeCode) return []
    return loiSensitivity.rows.map((r) => ({
      id: r.loiId,
      label: r.label,
      x: r.climateDelta,
      y: r.opsRange,
      tierAtRefHc: r.tierAtRefHc,
      secondary: r.locationType,
    }))
  }, [quadrantUnit, loiOutcomeCode, loiSensitivity.rows])

  // Hover coordination (match ResiliencePanel's debounced pattern).
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

  const handleDotHover = useCallback(
    (_: ResilienceQuadrantDatum | null) => {
      // Quadrant dots aggregate across scenarios, so there is no single
      // scenario to highlight in the sidebar. We still drop any prior
      // highlight to avoid stale state.
      notifyHover(null)
    },
    [notifyHover],
  )

  const handleOutcomeClick = useCallback(
    (_d: ResilienceQuadrantDatum) => {
      // Outcome-mode click: jump to the by-outcome heatmap for this outcome.
      onControlsChange({ view: "outcome" })
    },
    [onControlsChange],
  )

  const handleLoiClick = useCallback(
    (_d: ResilienceQuadrantDatum) => {
      // Best-effort map coordination: show the current outcome layer for
      // the focused scenario. A dedicated focusLocation action doesn't
      // exist yet, so we degrade to the same behavior as a heatmap cell
      // click.
      if (!isMapVisible) return
      if (!loiOutcomeCode || !loiMapScenarioId) return
      showOutcomeOnMap(loiOutcomeCode, loiMapScenarioId)
    },
    [isMapVisible, loiOutcomeCode, loiMapScenarioId, showOutcomeOnMap],
  )

  // Render.
  const climateRefLabel = HYDROCLIMATE_LABELS[CLIMATE_REF_HC] ?? CLIMATE_REF_HC

  const titleForUnit =
    quadrantUnit === "loi"
      ? "Climate sensitivity vs operational leverage (by location)"
      : "Climate sensitivity vs operational leverage (by outcome)"

  // Snapshot capture for the Share drawer. Same pattern as
  // ResiliencePanel: capture the scatter chart container, then build a
  // flat row table derived from the dots currently on screen. The
  // chart data shape is distinct from the heatmap's cell shape but
  // rides on the same `resilience` ShareItem variant via `tileScope:
  // "quadrant"`.
  const chartWrapperRef = useRef<HTMLDivElement | null>(null)

  const quadrantUnitRef = useRef(quadrantUnit)
  useEffect(() => {
    quadrantUnitRef.current = quadrantUnit
  }, [quadrantUnit])

  const outcomeDataRef = useRef(outcomeData)
  useEffect(() => {
    outcomeDataRef.current = outcomeData
  }, [outcomeData])

  const loiDataRef = useRef(loiData)
  useEffect(() => {
    loiDataRef.current = loiData
  }, [loiData])

  const loiOutcomeCodeRef = useRef(loiOutcomeCode)
  useEffect(() => {
    loiOutcomeCodeRef.current = loiOutcomeCode
  }, [loiOutcomeCode])

  const climateRefLabelRef = useRef(climateRefLabel)
  useEffect(() => {
    climateRefLabelRef.current = climateRefLabel
  }, [climateRefLabel])

  const captureQuadrant = useCallback<ResilienceQuadrantCaptureFn>(async () => {
    const el = chartWrapperRef.current
    if (!el) return null
    try {
      const { dataUrl } = await captureElementToBlob(el)
      const unit = quadrantUnitRef.current
      const source =
        unit === "loi" ? loiDataRef.current : outcomeDataRef.current
      const yLabel = `Operational leverage (range at ${climateRefLabelRef.current})`
      const xLabel = `Climate sensitivity (${climateRefLabelRef.current} - historical)`
      const loiCode = loiOutcomeCodeRef.current
      const tileLabel =
        unit === "loi" && loiCode
          ? `By location - ${getOutcomeName(loiCode as OutcomeCode)}`
          : "By outcome"
      return {
        dataUrl,
        chartData: {
          kind: "resilience",
          view: "quadrant",
          cellEncoding: "quadrant",
          tileScope: "quadrant",
          tileLabel,
          xLabel,
          yLabel,
          rows: source.map((d) => ({
            id: d.id,
            label: d.label,
            x: d.x,
            y: d.y,
            tierAtRefHc: d.tierAtRefHc,
            secondary:
              typeof d.secondary === "string" ? d.secondary : undefined,
          })),
        },
      }
    } catch (err) {
      console.error("[ResilienceQuadrantPanel] captureQuadrant failed:", err)
      return null
    }
  }, [])

  useEffect(() => {
    onCaptureReady?.(captureQuadrant)
  }, [captureQuadrant, onCaptureReady])

  const subjectLabel = useMemo(() => {
    const n = scopeScenarioIds.length
    const all = scenarioIds.length
    if (n === all) return `All ${all} scenarios`
    if (n === 1) return "1 selected scenario"
    return `${n} selected scenarios`
  }, [scopeScenarioIds.length, scenarioIds.length])

  const isLoiLoading = quadrantUnit === "loi" && loiSensitivity.isLoading
  const hasMatrixData = scenarioIds.length > 0

  if (matrixError) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: 3,
          backgroundColor: theme.palette.grey[100],
        }}
      >
        <Typography variant="body2" color="error">
          {matrixError}
        </Typography>
      </Box>
    )
  }

  if (matrixLoading && !hasMatrixData) {
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

  const showLoiEmptyState = quadrantUnit === "loi" && !loiOutcomeCode
  const showSelectedEmptyState =
    aggregateScope === "selected" && selectedScenarios.length === 0

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
          alignItems: "baseline",
          gap: 2,
        }}
      >
        <Typography
          variant="dashboard"
          sx={{ fontWeight: 600, color: theme.palette.text.primary }}
        >
          {titleForUnit}
        </Typography>
        <Typography
          variant="compactCaption"
          sx={{ color: theme.palette.text.secondary }}
        >
          {subjectLabel}
          {quadrantUnit === "loi" && loiOutcomeCode
            ? ` - ${getOutcomeName(loiOutcomeCode)}`
            : ""}
        </Typography>
      </Box>

      <Box
        ref={chartWrapperRef}
        sx={{
          flex: 1,
          minHeight: 0,
          px: theme.space.component.lg,
          pb: theme.space.component.md,
        }}
      >
        {showSelectedEmptyState ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Select one or more scenarios in the sidebar to aggregate over, or
              switch Scope to &ldquo;all scenarios&rdquo;.
            </Typography>
          </Box>
        ) : showLoiEmptyState ? (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Pick an outcome in the chart controls to drill into its locations
              of interest.
            </Typography>
          </Box>
        ) : (
          <ResilienceQuadrant
            unit={quadrantUnit}
            data={quadrantUnit === "loi" ? loiData : outcomeData}
            tierColors={tierColors}
            palette={quadrantPalette}
            climateRefHcLabel={climateRefLabel}
            onDotHover={handleDotHover}
            onDotClick={
              quadrantUnit === "loi" ? handleLoiClick : handleOutcomeClick
            }
          />
        )}
      </Box>

      {isLoiLoading && (
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
