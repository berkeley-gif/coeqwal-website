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
 * per-outcome heatmap; clicking an LOI dot (or bin) focuses the map on
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
}

export default function ResilienceQuadrantPanel({
  controls,
  onControlsChange,
  highlightedIds: _highlightedIds,
  onScenarioHover,
}: ResilienceQuadrantPanelProps) {
  const theme = useTheme()
  const { quadrantUnit, quadrantOutcome, aggregateScope } = controls

  const { selectedScenarios } = useScenarioExplorerStore()
  // Scenario used for LOI-level map focus. Prefer the user's first
  // sidebar selection; fall back to the baseline so "show on map" still
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
    (d: ResilienceQuadrantDatum) => {
      // Outcome-mode click: jump to the by-outcome heatmap and expand
      // this outcome's tile to full size. `expandedTileId` overrides
      // the grid render path (see ResiliencePanel) so the user lands
      // directly in the focused view.
      onControlsChange({ view: "outcome", expandedTileId: d.id })
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
