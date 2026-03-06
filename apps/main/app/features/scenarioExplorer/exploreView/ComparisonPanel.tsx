"use client"

/**
 * ComparisonPanel - Tradeoffs view with shared selection sidebar and parallel coordinates chart
 *
 * Layout:
 *   [ScenarioSelectionSidebar 240px] | [HydroclimateChooser + toggle controls + chart]
 *
 * The sidebar carries all scenario selection tools (checkboxes, GridControls,
 * SelectionBanner) wired to the shared store. The right panel renders chart
 * controls and the parallel coordinates visualization.
 */

import React, { useMemo, useState, useRef, useCallback } from "react"
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@repo/ui/mui"
import {
  VerticalParallelLinePlotPeak,
  type VerticalParallelLineData,
  type AxisLayout,
} from "@repo/viz"
import { InfoIconButton } from "@repo/ui"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import ScenarioSelectionSidebar from "../components/ScenarioSelectionSidebar"
import { HydroclimateChooser } from "../../scenarios/components"
import { formatOutcomeLabel } from "../../scenarios/components/shared"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../tooltips/TierTooltipPortal"

export default function ComparisonPanel() {
  const theme = useTheme()
  // At md (900px+) there is more horizontal than vertical space, so use the
  // standard horizontal parallel coordinates layout. Below md (tablet/phone)
  // use the vertical layout which works better in portrait orientation.
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  const {
    highlightedScenario,
    setHighlightedScenario,
    setPinnedScenarioId,
    hydroclimatePeriod,
    setHydroclimatePeriod,
    relativeToBaseline,
    setRelativeToBaseline,
    highlightBaseline,
    setHighlightBaseline,
    overlayTiers,
    setOverlayTiers,
    defineOutcome,
    setDefineOutcome,
    selectedScenarios,
  } = useScenarioExplorerStore()

  const chosenIds = useMemo(
    () => new Set(selectedScenarios),
    [selectedScenarios],
  )

  // ── Hover state ─────────────────────────────────────────────────────────
  // Chart hover is handled internally by the D3 layer (hoveredScenarioRef +
  // commitHoverIn / scheduleHoverClear). The `onLineHover` callback only
  // propagates the hovered scenario to the sidebar for row highlighting.
  //
  // Sidebar hover (row or theme badge) feeds into `highlightedIds`, which
  // the chart uses for external-source highlighting.
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [hoveredScenario, setHoveredScenarioRaw] =
    useState<VerticalParallelLineData | null>(null)

  const setHoveredScenario = useCallback(
    (scenario: VerticalParallelLineData | null) => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (scenario) {
        setHoveredScenarioRaw(scenario)
      } else {
        hoverTimerRef.current = setTimeout(
          () => setHoveredScenarioRaw(null),
          200,
        )
      }
    },
    [],
  )

  const handleSidebarHover = useCallback((ids: string[] | null) => {
    setHighlightedIds(ids ? new Set(ids) : null)
  }, [])

  // Axis layout positions reported by the chart for HTML label positioning
  const [axisLayout, setAxisLayout] = useState<AxisLayout[]>([])

  // Tooltip state for outcome info buttons
  const {
    openTooltip: activeInfoTooltip,
    anchor: tooltipAnchor,
    handleToggleWithAnchor,
    handleClose: handleTooltipClose,
    forceClose: handleTooltipForceClose,
  } = useTierTooltipState()

  const {
    data: comparisonData,
    axes,
    outcomeCodes,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    hasData,
  } = useComparisonData()

  // Map display names → outcome codes for tooltip lookups
  const axisCodeMap = useMemo(
    () => new Map(axes.map((name, i) => [name, outcomeCodes[i]])),
    [axes, outcomeCodes],
  )

  // Build scenarioId, gives color map for the sidebar's chart legend swatches
  const scenarioColors = useMemo(
    () => Object.fromEntries(scenarios.map(({ id, color }) => [id, color])),
    [scenarios],
  )

  const highlightedData = useMemo(
    () =>
      comparisonData.map((scenario) => ({
        ...scenario,
        highlighted: scenario.id === highlightedScenario,
      })),
    [comparisonData, highlightedScenario],
  )

  // Transform data to be relative to baseline when toggle is on.
  // Both values are in [-1, 1] (mapped from normalized_score in [0,1] via ns*2-1),
  // so their raw difference spans [-2, 2]. Dividing by 2 keeps the result in [-1, 1],
  // which is equivalent to (scenario_ns - baseline_ns) — the direct difference in
  // normalized scores. Zero = same as baseline; ±1 = maximum possible divergence.
  const chartData = useMemo(() => {
    if (!relativeToBaseline || !baselineScenario) return highlightedData
    return highlightedData.map((scenario) => ({
      ...scenario,
      values: Object.fromEntries(
        Object.entries(scenario.values).map(([axis, value]) => [
          axis,
          value === null
            ? null
            : (value - (baselineScenario.values[axis] ?? 0)) / 2,
        ]),
      ),
    }))
  }, [highlightedData, relativeToBaseline, baselineScenario])

  const baselineDataForChart = useMemo(() => {
    if (!baselineScenario) return undefined
    if (relativeToBaseline) {
      return {
        ...baselineScenario,
        values: Object.fromEntries(
          Object.keys(baselineScenario.values).map((key) => [key, 0]),
        ),
      }
    }
    return baselineScenario
  }, [baselineScenario, relativeToBaseline])

  const handleScenarioClick = (scenarioId: string) => {
    setHighlightedScenario(
      highlightedScenario === scenarioId ? null : scenarioId,
    )
    setPinnedScenarioId(scenarioId)
  }

  const checkboxSx = { padding: 0, margin: 0, transform: "scale(0.85)" }

  const toggleControls = (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={relativeToBaseline}
            onChange={(e) => setRelativeToBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            relative to current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={highlightBaseline}
            onChange={(e) => setHighlightBaseline(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            highlight current operations
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={defineOutcome}
            onChange={(e) => setDefineOutcome(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            define an outcome
            <br />
            (coming soon)
          </Typography>
        }
        sx={{ mr: 1.5 }}
      />
      {/* Temporarily disabled overlay tiers
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={overlayTiers}
            onChange={(e) => setOverlayTiers(e.target.checked)}
            sx={checkboxSx}
          />
        }
        label={
          <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
            overlay tiers
          </Typography>
        }
      />
      */}
    </Box>
  )

  const chartElement = (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── HTML axis labels above chart (desktop) ──────────────────── */}
      {isDesktop && axisLayout.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${axisLayout[0]?.y ?? 0}px`,
            pointerEvents: "auto",
            zIndex: 2,
          }}
        >
          {axisLayout.map((layout) => {
            const outcomeCode = axisCodeMap.get(layout.axis)
            return (
              <Box
                key={layout.axis}
                sx={{
                  position: "absolute",
                  left: `${layout.x}px`,
                  bottom: 4,
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <Typography
                  variant="outcomeLabel"
                  sx={{
                    color: theme.palette.grey[600],
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {formatOutcomeLabel(layout.axis)}
                </Typography>
                {outcomeCode && (
                  <InfoIconButton
                    isActive={activeInfoTooltip === outcomeCode}
                    onClick={(e) =>
                      handleToggleWithAnchor(outcomeCode, e.currentTarget)
                    }
                    title={`Details for ${layout.axis}`}
                  />
                )}
              </Box>
            )
          })}
        </Box>
      )}

      {/* ── HTML axis labels left of chart (mobile) ─────────────────── */}
      {!isDesktop && axisLayout.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${axisLayout[0]?.x ?? 0}px`,
            pointerEvents: "auto",
            zIndex: 2,
          }}
        >
          {axisLayout.map((layout) => {
            const outcomeCode = axisCodeMap.get(layout.axis)
            return (
              <Box
                key={layout.axis}
                sx={{
                  position: "absolute",
                  top: `${layout.y}px`,
                  right: 8,
                  transform: "translateY(-50%)",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                {outcomeCode && (
                  <InfoIconButton
                    isActive={activeInfoTooltip === outcomeCode}
                    onClick={(e) =>
                      handleToggleWithAnchor(outcomeCode, e.currentTarget)
                    }
                    title={`Details for ${layout.axis}`}
                  />
                )}
                <Typography
                  variant="outcomeLabel"
                  sx={{
                    color: theme.palette.grey[600],
                    textAlign: "right",
                    lineHeight: 1.2,
                  }}
                >
                  {formatOutcomeLabel(layout.axis)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}

      {/* ── The SVG chart ───────────────────────────────────────────── */}
      <VerticalParallelLinePlotPeak
        data={chartData}
        axes={axes}
        orientation={isDesktop ? "horizontal" : "vertical"}
        responsive={true}
        hideAxisLabels={true}
        onAxesLayout={setAxisLayout}
        margin={
          isDesktop ? { top: 80, right: 20, bottom: 20, left: 20 } : undefined
        }
        showBaseline={highlightBaseline}
        baselineData={baselineDataForChart}
        overlayTiers={overlayTiers}
        defineOutcome={defineOutcome}
        colors={{
          default: theme.palette.grey[600],
          highlighted: theme.palette.blue.darkest,
          background: theme.palette.grey[50],
        }}
        lineColors={lineColors}
        onLineHover={setHoveredScenario}
        onLineClick={(scenario) => handleScenarioClick(scenario.id)}
        chosenIds={chosenIds}
        highlightedIds={highlightedIds}
        baselineId="s0020"
      />

    </Box>
  )

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <CircularProgress size={32} />
        <Typography
          variant="body2"
          sx={{ mt: theme.space.component.lg, color: theme.palette.grey[600] }}
        >
          Loading comparison...
        </Typography>
      </Box>
    )
  }

  if (!hasData) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
        }}
      >
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          No comparison data available
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Left: shared scenario selection sidebar ─────────────────────────── */}
      <ScenarioSelectionSidebar
        scenarioColors={scenarioColors}
        hoveredScenarioId={hoveredScenario?.id ?? null}
        onRowHover={handleSidebarHover}
      />

      {/* ── Right: hydroclimate chooser + chart controls + chart ─────────────── */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Hydroclimate chooser */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.space.component.lg,
            pt: theme.space.component.sm,
            pb: theme.space.component.lg,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <HydroclimateChooser
            layout="horizontal"
            showTitle={true}
            showLabels={false}
            value={hydroclimatePeriod}
            onChange={setHydroclimatePeriod}
          />
        </Box>

        {/* Chart toggle controls */}
        <Box
          sx={{
            flexShrink: 0,
            px: theme.space.component.lg,
            pt: theme.space.component.sm,
          }}
        >
          {toggleControls}
        </Box>

        {/* Chart */}
        <Box
          sx={{
            flex: 1,
            p: theme.space.component.lg,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: theme.borderRadius.md,
              p: theme.space.component.lg,
              boxShadow: theme.shadow.subtle,
              height: "100%",
            }}
          >
            {chartElement}
          </Box>
        </Box>
      </Box>

      {/* ── Outcome info tooltip portal ─────────────────────────────── */}
      <TierTooltipPortal
        outcomeCode={activeInfoTooltip}
        anchorEl={tooltipAnchor}
        onClose={handleTooltipClose}
        onForceClose={handleTooltipForceClose}
      />
    </Box>
  )
}
