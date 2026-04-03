"use client"

/**
 * ComparisonPanel - Tradeoffs view with shared selection sidebar and parallel coordinates chart
 *
 * The sidebar carries all scenario selection tools (checkboxes, GridControls,
 * SelectionBanner) wired to the shared store. The right panel renders chart
 * controls and the parallel coordinates visualization.
 */

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  startTransition,
} from "react"
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Switch,
} from "@repo/ui/mui"
import {
  VerticalParallelLinePlotPeak,
  ParityPlot,
  DeviationPlot,
  RadarPlot,
  TierHeatmap,
  TierSankey,
  type VerticalParallelLineData,
  type AxisLayout,
} from "@repo/viz"
import { InfoIconButton } from "@repo/ui"
import {
  useComparisonData,
  SANKEY_ALL_OUTCOMES,
} from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import { formatOutcomeLabel } from "../../scenarios/components/shared"
import { getOutcomeName } from "../../../content/outcomes"
import { useScenarioList } from "../../scenarios/hooks"
import { useTierTooltipState } from "../../tooltips/useTierTooltipState"
import { TierTooltipPortal } from "../../tooltips/TierTooltipPortal"

type ChartMode =
  | "radar"
  | "parallel"
  | "parity"
  | "deviation"
  | "heatmap"
  | "sankey"

const CHART_MODES: { key: ChartMode; label: string }[] = [
  { key: "radar", label: "Radar" },
  { key: "parallel", label: "Parallel" },
  { key: "parity", label: "Parity" },
  { key: "deviation", label: "Column" },
  { key: "heatmap", label: "Heatmap" },
  { key: "sankey", label: "Sankey" },
]

interface ComparisonPanelProps {
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
}

export default function ComparisonPanel({
  highlightedIds = null,
  onScenarioHover,
}: ComparisonPanelProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"))

  const [chartMode, setChartMode] = useState<ChartMode>("radar")

  const {
    highlightedScenario,
    pinnedScenarioIds,
    togglePinnedScenario,
    relativeToBaseline,
    setRelativeToBaseline,
    highlightBaseline,
    setHighlightBaseline,
    overlayTiers,
    defineOutcome,
    setDefineOutcome,
    selectedScenarios,
    toggleScenario,
    selectScenarios,
    outcomeDisplayMode,
    setOutcomeDisplayMode,
  } = useScenarioExplorerStore()

  const { getThemeForScenario } = useScenarioList()

  const chosenIds = useMemo(
    () => new Set(selectedScenarios),
    [selectedScenarios],
  )

  const pinnedSet = useMemo(
    () => new Set(pinnedScenarioIds),
    [pinnedScenarioIds],
  )

  // Chart hover feeds into hoveredScenario (debounced) -> onScenarioHover.
  // External highlights arrive via highlightedIds prop from the layout shell.
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHoveredIdRef = useRef<string | null>(null)

  const [hoveredScenario, setHoveredScenarioRaw] =
    useState<VerticalParallelLineData | null>(null)

  const setHoveredScenario = useCallback(
    (scenario: VerticalParallelLineData | null) => {
      const nextId = scenario?.id ?? null
      if (nextId === lastHoveredIdRef.current) return
      lastHoveredIdRef.current = nextId

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      if (scenario) {
        startTransition(() => setHoveredScenarioRaw(scenario))
      } else {
        hoverTimerRef.current = setTimeout(
          () => startTransition(() => setHoveredScenarioRaw(null)),
          200,
        )
      }
    },
    [],
  )

  // Propagate chart hover to parent for sidebar highlighting
  useEffect(() => {
    onScenarioHover?.(hoveredScenario?.id ?? null)
  }, [hoveredScenario, onScenarioHover])

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
    historicalBaselineScores,
    isLoading,
    hasData,
    heatmapCells,
    getAllSankeyData,
    getWeightedSankeyData,
    sankeyGroups,
    multiValueOutcomeCodes,
    morphGeneration,
    allScenariosData,
    hcRangeData,
  } = useComparisonData()

  // Sankey outcome selector state
  const [sankeyOutcome, setSankeyOutcome] = useState<string>("")
  const [sankeyShowDistribution, setSankeyShowDistribution] = useState(false)

  const [parityConnectLines, setParityConnectLines] = useState(false)
  const [parityOutcomeLabels, setParityOutcomeLabels] = useState(true)
  const [paritySpreadDots, setParitySpreadDots] = useState(false)
  const [parityThemeGrouping, setParityThemeGrouping] = useState(false)

  const [radarHighlightBaseline, setRadarHighlightBaseline] = useState(true)
  const [radarShowPath, setRadarShowPath] = useState(true)
  const [radarShowAllPaths, setRadarShowAllPaths] = useState(false)
  const [radarShowTierZones, setRadarShowTierZones] = useState(true)
  const [radarDimUnpinned, setRadarDimUnpinned] = useState(false)
  const [radarShowDistribution, setRadarShowDistribution] = useState(false)

  const [deviationShowStaircase, setDeviationShowStaircase] = useState(false)
  const [deviationShowPath, setDeviationShowPath] = useState(false)
  const [deviationShowAllPaths, setDeviationShowAllPaths] = useState(false)
  const [deviationShowTierZones, setDeviationShowTierZones] = useState(true)
  const [deviationDimUnpinned, setDeviationDimUnpinned] = useState(false)
  const [deviationShowDistribution, setDeviationShowDistribution] =
    useState(false)
  const [deviationShowHCRange, setDeviationShowHCRange] = useState(false)
  const [deviationShowBaselineFill, setDeviationShowBaselineFill] =
    useState(true)
  const deviationClimateMode = "off" as const
  const deviationMorphShowComp = false

  // Map display names -> outcome codes for tooltip lookups
  const axisCodeMap = useMemo(
    () => new Map(axes.map((name, i) => [name, outcomeCodes[i]])),
    [axes, outcomeCodes],
  )

  const TIER_KEY_TO_NUM: Record<string, number> = {
    tier1: 1,
    tier2: 2,
    tier3: 3,
    tier4: 4,
  }

  const distributionData = useMemo(() => {
    if (!allScenariosData || pinnedScenarioIds.length === 0) return undefined
    const result: Record<
      string,
      Record<string, { tier: number; count: number; normalized: number }[]>
    > = {}
    for (const id of pinnedScenarioIds) {
      const scenarioTiers = allScenariosData[id]?.tiers
      if (!scenarioTiers) continue
      const outcomeMap: Record<
        string,
        { tier: number; count: number; normalized: number }[]
      > = {}
      outcomeCodes.forEach((code, i) => {
        const tierInfo = scenarioTiers[code]
        const displayName = axes[i]
        if (!tierInfo || !displayName) return
        if (tierInfo.type === "multi_value" && tierInfo.data) {
          outcomeMap[displayName] = tierInfo.data
            .filter((d) => d.value > 0)
            .map((d) => ({
              tier: TIER_KEY_TO_NUM[d.tier] ?? 4,
              count: Math.round(d.value),
              normalized: d.normalized,
            }))
        } else if (tierInfo.type === "single_value" && tierInfo.level) {
          outcomeMap[displayName] = [
            { tier: tierInfo.level, count: 1, normalized: 1 },
          ]
        }
      })
      result[id] = outcomeMap
    }
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allScenariosData, pinnedScenarioIds, outcomeCodes, axes])

  const highlightedData = useMemo(
    () =>
      comparisonData.map((scenario) => ({
        ...scenario,
        highlighted: scenario.id === highlightedScenario,
      })),
    [comparisonData, highlightedScenario],
  )

  // Exclude baseline (it lies on the diagonal and adds no information)
  const parityData = useMemo(
    () => highlightedData.filter((s) => s.id !== "s0020"),
    [highlightedData],
  )
  const parityLineColors = useMemo(() => {
    const colorMap = new Map(scenarios.map((s) => [s.id, s.color]))
    return parityData.map((d) => colorMap.get(d.id) || "#666666")
  }, [parityData, scenarios])

  const scenarioThemeMap = useMemo(() => {
    const map: Record<string, string> = {}
    parityData.forEach((s) => {
      map[s.id] = getThemeForScenario(s.id)
    })
    return map
  }, [parityData, getThemeForScenario])

  // Deviation plot: sort outcome columns by historical baseline tier score
  // so columns stay stable when switching hydroclimate periods.
  // Winter-run salmon is pinned to the last position.
  const salmonLabel = getOutcomeName("WRC_SALMON_AB")
  const deviationSortedAxes = useMemo(() => {
    if (!historicalBaselineScores) return axes
    return [...axes].sort((a, b) => {
      if (a === salmonLabel) return 1
      if (b === salmonLabel) return -1
      const va = historicalBaselineScores[a] ?? 0
      const vb = historicalBaselineScores[b] ?? 0
      return vb - va
    })
  }, [axes, historicalBaselineScores, salmonLabel])

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

  // Sankey: default to first multi-value outcome (Community water deliveries)
  const effectiveSankeyOutcome = useMemo(() => {
    if (
      sankeyOutcome &&
      sankeyOutcome !== SANKEY_ALL_OUTCOMES &&
      multiValueOutcomeCodes.includes(sankeyOutcome as never)
    )
      return sankeyOutcome
    return multiValueOutcomeCodes[0] ?? SANKEY_ALL_OUTCOMES
  }, [sankeyOutcome, multiValueOutcomeCodes])

  const sankeyData = useMemo(
    () =>
      sankeyShowDistribution
        ? getAllSankeyData(effectiveSankeyOutcome)
        : getWeightedSankeyData(effectiveSankeyOutcome),
    [
      getAllSankeyData,
      getWeightedSankeyData,
      effectiveSankeyOutcome,
      sankeyShowDistribution,
    ],
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

  const handleChartLineClick = useCallback(
    (_scenario: VerticalParallelLineData) => {
      // Pinning is handled by onPinnedToggle prop on the chart
    },
    [],
  )

  const handleBrushFilter = useCallback(
    (filteredOutIds: string[]) => {
      if (filteredOutIds.length === 0) return
      const filteredOutSet = new Set(filteredOutIds)
      const remaining = selectedScenarios.filter(
        (id) => !filteredOutSet.has(id),
      )
      if (remaining.length !== selectedScenarios.length) {
        selectScenarios(remaining)
      }
    },
    [selectedScenarios, selectScenarios],
  )

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {chartModeSelector}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            }}
          >
            Distributions
          </Typography>
          <Switch
            size="small"
            checked={outcomeDisplayMode === "distribution"}
            onChange={(_, checked) =>
              setOutcomeDisplayMode(checked ? "distribution" : "summary")
            }
            sx={{ ml: -0.5 }}
          />
        </Box>
      </Box>
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
      {chartMode === "parity" && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={parityConnectLines}
                onChange={(e) => setParityConnectLines(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                connect lines
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={parityOutcomeLabels}
                onChange={(e) => setParityOutcomeLabels(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                outcome labels
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={paritySpreadDots}
                onChange={(e) => setParitySpreadDots(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                spread dots
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={parityThemeGrouping}
                onChange={(e) => setParityThemeGrouping(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                theme grouping
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
        </Box>
      )}
      {chartMode === "radar" && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarHighlightBaseline}
                onChange={(e) => setRadarHighlightBaseline(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                highlight baseline
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarShowPath}
                onChange={(e) => setRadarShowPath(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                scenario path on hover
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarShowAllPaths}
                onChange={(e) => setRadarShowAllPaths(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show all paths
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarShowTierZones}
                onChange={(e) => setRadarShowTierZones(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                tier zones
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarDimUnpinned}
                disabled={pinnedScenarioIds.length === 0}
                onChange={(e) => setRadarDimUnpinned(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                focus pinned
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={radarShowDistribution}
                disabled={pinnedScenarioIds.length === 0}
                onChange={(e) => setRadarShowDistribution(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show distributions
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
        </Box>
      )}
      {chartMode === "deviation" && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            alignItems: "center",
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowStaircase}
                onChange={(e) => setDeviationShowStaircase(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                baseline staircase
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowPath}
                onChange={(e) => setDeviationShowPath(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                scenario path on hover
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowAllPaths}
                onChange={(e) => setDeviationShowAllPaths(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show all paths
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowTierZones}
                onChange={(e) => setDeviationShowTierZones(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                tier zones
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationDimUnpinned}
                disabled={pinnedScenarioIds.length === 0}
                onChange={(e) => setDeviationDimUnpinned(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                focus pinned
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowDistribution}
                disabled={pinnedScenarioIds.length === 0}
                onChange={(e) => setDeviationShowDistribution(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show distributions
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowHCRange}
                onChange={(e) => setDeviationShowHCRange(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                HC range
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={deviationShowBaselineFill}
                onChange={(e) => setDeviationShowBaselineFill(e.target.checked)}
                sx={checkboxSx}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                baseline fill
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          {/* Legend */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              ml: "auto",
              pl: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <svg
                width="18"
                height="14"
                viewBox="0 0 18 14"
                style={{ display: "block" }}
              >
                <line
                  x1="1"
                  y1="2"
                  x2="1"
                  y2="12"
                  stroke="#2d3748"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <line
                  x1="17"
                  y1="2"
                  x2="17"
                  y2="12"
                  stroke="#2d3748"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.7"
                />
                <line
                  x1="1"
                  y1="7"
                  x2="17"
                  y2="7"
                  stroke="#2d3748"
                  strokeWidth="2"
                  strokeLinecap="square"
                  opacity="0.7"
                />
              </svg>
              <Typography
                variant="compactCaption"
                sx={{
                  color: theme.palette.grey[600],
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Baseline
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                style={{ display: "block" }}
              >
                <circle
                  cx="7"
                  cy="7"
                  r="5"
                  fill="#546e7a"
                  stroke="#546e7a"
                  strokeWidth="1.5"
                  fillOpacity="0.8"
                />
              </svg>
              <Typography
                variant="compactCaption"
                sx={{
                  color: theme.palette.grey[600],
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Scenario
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      {chartMode === "sankey" && multiValueOutcomeCodes.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[600] }}
          >
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
          {effectiveSankeyOutcome &&
            effectiveSankeyOutcome !== SANKEY_ALL_OUTCOMES && (
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={sankeyShowDistribution}
                    onChange={(e) =>
                      setSankeyShowDistribution(e.target.checked)
                    }
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
            )}
        </Box>
      )}
    </Box>
  )

  const chartSharedGrey600 = theme.palette.grey[600]
  const chartSharedGrey50 = theme.palette.grey[50]
  const chartSharedBlueDarkest = theme.palette.blue.darkest

  // Primitive color deps — theme.palette.grey is a new object ref each render;
  // unstable sharedChartColors was retriggering chart D3 redraws on sidebar hover.
  const sharedChartColors = useMemo(
    () => ({
      default: chartSharedGrey600,
      highlighted: chartSharedBlueDarkest,
      background: chartSharedGrey50,
    }),
    [chartSharedGrey600, chartSharedGrey50, chartSharedBlueDarkest],
  )

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
      {/* Axis labels above chart (desktop parallel only) */}
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

      {/* Axis labels left of chart (mobile parallel only) */}
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

      {chartMode === "parallel" && (
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
          colors={sharedChartColors}
          lineColors={lineColors}
          onLineHover={setHoveredScenario}
          onLineClick={handleChartLineClick}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          baselineId="s0020"
          showTierLabels={true}
          relativeMode={relativeToBaseline}
          baselineAbsoluteValues={baselineScenario?.values}
          onBrushFilter={handleBrushFilter}
          morphGeneration={morphGeneration}
        />
      )}

      {chartMode === "parity" && (
        <ParityPlot
          data={parityData}
          axes={axes}
          baselineData={baselineScenario ?? undefined}
          responsive
          colors={sharedChartColors}
          lineColors={parityLineColors}
          onLineHover={setHoveredScenario}
          onLineClick={handleChartLineClick}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          showConnectLines={parityConnectLines}
          showOutcomeLabels={parityOutcomeLabels}
          showSpreadDots={paritySpreadDots}
          scenarioThemes={scenarioThemeMap}
          showThemeGrouping={parityThemeGrouping}
          morphGeneration={morphGeneration}
        />
      )}

      {chartMode === "radar" && (
        <RadarPlot
          data={parityData}
          axes={deviationSortedAxes}
          baselineData={baselineScenario ?? undefined}
          responsive
          colors={sharedChartColors}
          lineColors={parityLineColors}
          onLineHover={setHoveredScenario}
          onLineClick={handleChartLineClick}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          highlightBaseline={radarHighlightBaseline}
          showScenarioPath={radarShowPath}
          showAllPaths={radarShowAllPaths}
          showTierZones={radarShowTierZones}
          scenarioThemes={scenarioThemeMap}
          morphGeneration={morphGeneration}
          pinnedScenarioIds={pinnedSet}
          onPinnedToggle={togglePinnedScenario}
          dimUnpinned={radarDimUnpinned}
          showDistribution={radarShowDistribution}
          distributionData={distributionData}
        />
      )}

      {chartMode === "deviation" && (
        <DeviationPlot
          data={parityData}
          axes={deviationSortedAxes}
          baselineData={baselineScenario ?? undefined}
          responsive
          colors={sharedChartColors}
          lineColors={parityLineColors}
          onLineHover={setHoveredScenario}
          onLineClick={handleChartLineClick}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          showBaselineStaircase={deviationShowStaircase}
          showScenarioPath={deviationShowPath}
          showAllPaths={deviationShowAllPaths}
          showTierZones={deviationShowTierZones}
          showDifferenceGlyphs={false}
          showThemeRings={false}
          climateMode={deviationClimateMode}
          morphShowComparison={deviationMorphShowComp}
          scenarioThemes={scenarioThemeMap}
          morphGeneration={morphGeneration}
          pinnedScenarioIds={pinnedSet}
          onPinnedToggle={togglePinnedScenario}
          dimUnpinned={deviationDimUnpinned}
          showDistribution={deviationShowDistribution}
          distributionData={distributionData}
          showHCRange={deviationShowHCRange}
          hcRangeData={hcRangeData}
          showBaselineFill={deviationShowBaselineFill}
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
              const found = comparisonData.find((d) => d.id === cell.scenarioId)
              setHoveredScenario(found ?? null)
            } else {
              setHoveredScenario(null)
            }
          }}
          onCellClick={(cell) => togglePinnedScenario(cell.scenarioId)}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          morphGeneration={morphGeneration}
        />
      )}

      {chartMode === "sankey" && (
        <TierSankey
          data={sankeyData}
          outcomeName={
            effectiveSankeyOutcome === SANKEY_ALL_OUTCOMES
              ? "All Outcomes"
              : getOutcomeName(effectiveSankeyOutcome)
          }
          tierColors={theme.palette.tiers}
          groups={
            effectiveSankeyOutcome === SANKEY_ALL_OUTCOMES
              ? sankeyGroups
              : undefined
          }
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
          morphGeneration={morphGeneration}
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
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
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
          px: theme.space.component.lg,
          pt: theme.space.component.xs,
          pb: theme.space.component.sm,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            px: theme.space.component.lg,
            pt: theme.space.component.sm,
            pb: theme.space.component.lg,
            boxShadow: theme.shadow.subtle,
            height: "100%",
          }}
        >
          {chartElement}
        </Box>
      </Box>

      {/* Outcome info tooltip portal */}
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
