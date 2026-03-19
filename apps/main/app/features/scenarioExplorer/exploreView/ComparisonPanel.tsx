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

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react"
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
  BaselineScatter,
  TierHeatmap,
  BumpChart,
  TierSankey,
  type VerticalParallelLineData,
  type AxisLayout,
} from "@repo/viz"
import { InfoIconButton, InfoTooltip } from "@repo/ui"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import ScenarioSelectionSidebar from "../components/ScenarioSelectionSidebar"
import { HydroclimateChooser } from "../../scenarios/components"
import { formatOutcomeLabel } from "../../scenarios/components/shared"
import { getOutcomeName } from "../../../content/outcomes"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../tooltips/TierTooltipPortal"

type ChartMode = "parallel" | "scatter" | "bump" | "heatmap" | "sankey"

const CHART_MODES: { key: ChartMode; label: string }[] = [
  { key: "parallel", label: "Parallel" },
  { key: "scatter", label: "Scatter" },
  { key: "bump", label: "Bump" },
  { key: "heatmap", label: "Heatmap" },
  { key: "sankey", label: "Sankey" },
]

export default function ComparisonPanel() {
  const theme = useTheme()
  // At md (900px+) there is more horizontal than vertical space, so use the
  // standard horizontal parallel coordinates layout. Below md (tablet/phone)
  // use the vertical layout which works better in portrait orientation.
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  const [chartMode, setChartMode] = useState<ChartMode>("parallel")

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
    setOverlayTiers: _setOverlayTiers,
    defineOutcome,
    setDefineOutcome,
    selectedScenarios,
    toggleScenario,
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

  // Prevent browser text-selection anywhere inside the chart area.
  // Native mousedown.preventDefault is the standards-compliant way to do this
  // and is fully compatible with D3 drag (see d3/d3-drag#9).
  const chartWrapperRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = chartWrapperRef.current
    if (!el) return
    const prevent = (e: MouseEvent) => e.preventDefault()
    el.addEventListener("mousedown", prevent)
    return () => el.removeEventListener("mousedown", prevent)
  }, [])

  const {
    data: comparisonData,
    axes,
    outcomeCodes,
    lineColors,
    scenarios,
    baselineScenario,
    isLoading,
    hasData,
    heatmapCells,
    bumpRankings,
    getAllSankeyData,
    getWeightedSankeyData,
    multiValueOutcomeCodes,
  } = useComparisonData()

  // Sankey outcome selector state
  const [sankeyOutcome, setSankeyOutcome] = useState<string>("")
  const [sankeyShowDistribution, setSankeyShowDistribution] = useState(false)

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

  // Scatter: exclude baseline (it lies on the diagonal and adds no information)
  const scatterData = useMemo(
    () => highlightedData.filter((s) => s.id !== "s0020"),
    [highlightedData],
  )
  const scatterLineColors = useMemo(() => {
    const colorMap = new Map(scenarios.map((s) => [s.id, s.color]))
    return scatterData.map((d) => colorMap.get(d.id) || "#666666")
  }, [scatterData, scenarios])

  // Heatmap: scenario names and IDs in display order
  const heatmapScenarioIds = useMemo(
    () => scenarios.map((s) => s.id),
    [scenarios],
  )
  const heatmapScenarioNames = useMemo(
    () => scenarios.map((s) => s.name),
    [scenarios],
  )
  const heatmapOutcomeNames = useMemo(
    () => outcomeCodes.map(getOutcomeName),
    [outcomeCodes],
  )
  const heatmapLineColors = useMemo(
    () => scenarios.map((s) => s.color),
    [scenarios],
  )

  // Bump: scenario list for BumpChart
  const bumpScenarios = useMemo(
    () => scenarios.map((s) => ({ id: s.id, name: s.name, color: s.color })),
    [scenarios],
  )

  // Sankey: auto-select first multi-value outcome when available
  const effectiveSankeyOutcome = useMemo(() => {
    if (sankeyOutcome && multiValueOutcomeCodes.includes(sankeyOutcome as never))
      return sankeyOutcome
    return multiValueOutcomeCodes[0] || ""
  }, [sankeyOutcome, multiValueOutcomeCodes])

  const sankeyData = useMemo(
    () =>
      sankeyShowDistribution
        ? getAllSankeyData(effectiveSankeyOutcome)
        : getWeightedSankeyData(effectiveSankeyOutcome),
    [getAllSankeyData, getWeightedSankeyData, effectiveSankeyOutcome, sankeyShowDistribution],
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

  const chartModeSelector = (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {CHART_MODES.map(({ key, label }) => (
        <Typography
          key={key}
          component="span"
          variant="compactCaption"
          onClick={() => setChartMode(key)}
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            cursor: "pointer",
            fontWeight: chartMode === key ? 600 : 400,
            bgcolor:
              chartMode === key ? theme.palette.grey[200] : "transparent",
            color:
              chartMode === key
                ? theme.palette.grey[900]
                : theme.palette.grey[500],
            border: "1px solid",
            borderColor:
              chartMode === key ? theme.palette.grey[300] : "transparent",
            "&:hover": {
              bgcolor:
                chartMode === key
                  ? theme.palette.grey[200]
                  : theme.palette.grey[100],
            },
            transition: "all 0.15s ease",
            userSelect: "none",
          }}
        >
          {label}
        </Typography>
      ))}
    </Box>
  )

  const toggleControls = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {chartModeSelector}
      {chartMode === "parallel" && (
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
        </Box>
      )}
      {chartMode === "sankey" && multiValueOutcomeCodes.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="compactCaption" sx={{ color: theme.palette.grey[600] }}>
            Outcome:
          </Typography>
          <Box
            component="select"
            value={effectiveSankeyOutcome}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSankeyOutcome(e.target.value)
            }
            sx={{
              fontSize: "0.75rem",
              border: `1px solid ${theme.palette.grey[300]}`,
              borderRadius: 1,
              px: 1,
              py: 0.25,
              background: theme.palette.background.paper,
              color: theme.palette.grey[800],
              outline: "none",
              cursor: "pointer",
              "&:focus": { borderColor: theme.palette.grey[500] },
            }}
          >
            {multiValueOutcomeCodes.map((code) => (
              <option key={code} value={code}>
                {getOutcomeName(code)}
              </option>
            ))}
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={sankeyShowDistribution}
                onChange={(e) => setSankeyShowDistribution(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show locational distribution
              </Typography>
            }
            sx={{ ml: 1 }}
          />
        </Box>
      )}
    </Box>
  )

  const sharedChartColors = {
    default: theme.palette.grey[600],
    highlighted: theme.palette.blue.darkest,
    background: theme.palette.grey[50],
  }

  const chartElement = (
    <Box
      ref={chartWrapperRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* ── HTML axis labels above chart (desktop, parallel only) ──── */}
      {chartMode === "parallel" && isDesktop && axisLayout.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: `${axisLayout[0]?.y ?? 0}px`,
            pointerEvents: "none",
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
                  bottom: 16,
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
                  <Box sx={{ pointerEvents: "auto" }}>
                    <InfoIconButton
                      isActive={activeInfoTooltip === outcomeCode}
                      onClick={(e) =>
                        handleToggleWithAnchor(outcomeCode, e.currentTarget)
                      }
                      title={`Details for ${layout.axis}`}
                    />
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      {/* ── HTML axis labels left of chart (mobile, parallel only) ── */}
      {chartMode === "parallel" && !isDesktop && axisLayout.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${axisLayout[0]?.x ?? 0}px`,
            pointerEvents: "none",
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
                  <Box sx={{ pointerEvents: "auto" }}>
                    <InfoIconButton
                      isActive={activeInfoTooltip === outcomeCode}
                      onClick={(e) =>
                        handleToggleWithAnchor(outcomeCode, e.currentTarget)
                      }
                      title={`Details for ${layout.axis}`}
                    />
                  </Box>
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

      {/* ── Charts ─────────────────────────────────────────────────── */}
      {chartMode === "parallel" && (
        <VerticalParallelLinePlotPeak
          data={chartData}
          axes={axes}
          orientation={isDesktop ? "horizontal" : "vertical"}
          responsive={true}
          hideAxisLabels={true}
          onAxesLayout={setAxisLayout}
          margin={
            isDesktop
              ? { top: 80, right: 20, bottom: 20, left: 20 }
              : undefined
          }
          showBaseline={highlightBaseline}
          baselineData={baselineDataForChart}
          overlayTiers={overlayTiers}
          defineOutcome={defineOutcome}
          colors={sharedChartColors}
          lineColors={lineColors}
          onLineHover={setHoveredScenario}
          onLineClick={(scenario) => handleScenarioClick(scenario.id)}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          baselineId="s0020"
        />
      )}

      {chartMode === "scatter" && (
        <BaselineScatter
          data={scatterData}
          axes={axes}
          baselineData={baselineScenario ?? undefined}
          responsive
          colors={sharedChartColors}
          lineColors={scatterLineColors}
          onLineHover={setHoveredScenario}
          onLineClick={(scenario) => handleScenarioClick(scenario.id)}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
        />
      )}

      {chartMode === "bump" && (
        <BumpChart
          rankings={bumpRankings}
          scenarios={bumpScenarios}
          responsive
          onScenarioHover={(id) => {
            if (id) {
              const found = comparisonData.find((d) => d.id === id)
              setHoveredScenario(found ?? null)
            } else {
              setHoveredScenario(null)
            }
          }}
          onScenarioClick={handleScenarioClick}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
        />
      )}

      {chartMode === "heatmap" && (
        <TierHeatmap
          cells={heatmapCells}
          scenarioIds={heatmapScenarioIds}
          scenarioNames={heatmapScenarioNames}
          outcomeNames={heatmapOutcomeNames}
          responsive
          lineColors={heatmapLineColors}
          onCellHover={(cell) => {
            if (cell) {
              const found = comparisonData.find(
                (d) => d.id === cell.scenarioId,
              )
              setHoveredScenario(found ?? null)
            } else {
              setHoveredScenario(null)
            }
          }}
          onCellClick={(cell) => handleScenarioClick(cell.scenarioId)}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
        />
      )}

      {chartMode === "sankey" && (
        <TierSankey
          data={sankeyData}
          outcomeName={getOutcomeName(effectiveSankeyOutcome)}
          tierColors={theme.palette.tiers}
          responsive
          onScenarioHover={(id) => {
            if (id) {
              const found = sankeyData.find((d) => d.scenarioId === id)
              if (found) {
                setHoveredScenario({
                  id: found.scenarioId,
                  name: found.scenarioName,
                  values: {},
                  highlighted: false,
                })
              }
            } else {
              setHoveredScenario(null)
            }
          }}
          onScenarioClick={toggleScenario}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
        />
      )}

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
        {/* Hydroclimate chooser + methodology link */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
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
          <InfoTooltip
            placement="bottom"
            description={
              <Box
                sx={{ maxWidth: 340, fontSize: "0.82rem", lineHeight: 1.55 }}
              >
                <p style={{ margin: "0 0 8px" }}>
                  Each line represents a scenario scored across nine outcome
                  categories. Each category contains indicators that experts
                  have classified into four tiers (Tier 1 = best, Tier 4 =
                  worst).
                </p>
                <p style={{ margin: "0 0 8px" }}>
                  The position on each axis is a normalized weighted average of
                  those tier assignments. The weighted score is:
                </p>
                <p
                  style={{
                    margin: "0 0 4px",
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                  }}
                >
                  W = (1p₁ + 2p₂ + 3p₃ + 4p₄) / (p₁ + p₂ + p₃ + p₄)
                </p>
                <p style={{ margin: "0 0 8px", fontSize: "0.78rem" }}>
                  where p<sub>i</sub> is the proportion of indicators in Tier i.
                </p>
                <p style={{ margin: "0 0 4px" }}>
                  This is then normalized to a 0-1 scale:
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontFamily: "monospace",
                    fontSize: "0.78rem",
                  }}
                >
                  S = (4 - W) / 3
                </p>
                <p style={{ margin: 0 }}>
                  S = 1 means all indicators are in Tier 1. S = 0 means all
                  indicators are in Tier 4. Higher is better.
                </p>
              </Box>
            }
          >
            <Typography
              variant="caption"
              sx={{
                ml: "auto",
                flexShrink: 0,
                cursor: "pointer",
                color: theme.palette.grey[500],
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textUnderlineOffset: 3,
                "&:hover": { color: theme.palette.grey[800] },
              }}
            >
              Methodology
            </Typography>
          </InfoTooltip>
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
        zIndex={theme.zIndex.tooltipAboveModal}
      />
    </Box>
  )
}
