"use client"

/**
 * RadarPanel - Radar chart view for scenario comparison.
 *
 * Wraps the @repo/viz RadarPlot component with store-driven data
 * via the shared useComparisonData hook. Supports hover coordination
 * with the sidebar and other panels.
 */

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  startTransition,
} from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { RadarPlot, type VerticalParallelLineData } from "@repo/viz"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import { useOutcomeMapAction } from "../../map/hooks"
import { getOutcomeName } from "../../../content/outcomes"

interface RadarPanelProps {
  highlightedIds?: Set<string> | null
  onScenarioHover?: (scenarioId: string | null) => void
}

export default function RadarPanel({
  highlightedIds = null,
  onScenarioHover,
}: RadarPanelProps) {
  const theme = useTheme()

  const {
    highlightedScenario,
    setHighlightedScenario,
    togglePinnedScenario,
    selectedScenarios,
    highlightBaseline,
    showTierZones,
    dimUnpinned,
    pinnedScenarioIds,
    radarVisibleAxes,
    showRadarRange,
    showDotsOnly,
  } = useScenarioExplorerStore()

  const { getThemeForScenario } = useScenarioList()
  const { showOutcomeOnMap, activeOutcome } = useOutcomeMapAction()

  const activeMapDot = useMemo(
    () =>
      activeOutcome
        ? {
            axis: getOutcomeName(activeOutcome.outcomeCode),
            scenarioId:
              activeOutcome.siblingGroupId ?? activeOutcome.scenarioId,
          }
        : null,
    [activeOutcome],
  )

  const chosenIds = useMemo(
    () => new Set(selectedScenarios),
    [selectedScenarios],
  )

  const pinnedSet = useMemo(
    () => new Set(pinnedScenarioIds),
    [pinnedScenarioIds],
  )

  // Hover state with debounce (same pattern as ComparisonPanel)
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

  useEffect(() => {
    onScenarioHover?.(hoveredScenario?.id ?? null)
  }, [hoveredScenario, onScenarioHover])

  // Prevent browser text-selection inside the chart area
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
    axisRange,
    lineColors,
    baselineScenario,
    isLoading,
    hasData,
    morphGeneration,
  } = useComparisonData()

  const scenarioThemes = useMemo(() => {
    const map: Record<string, string> = {}
    comparisonData.forEach((d) => {
      map[d.id] = getThemeForScenario(d.id) ?? "unthemed"
    })
    return map
  }, [comparisonData, getThemeForScenario])

  const visibleAxisNames = useMemo(() => {
    const nameSet = new Set(radarVisibleAxes.map(getOutcomeName))
    return axes.filter((a) => nameSet.has(a))
  }, [axes, radarVisibleAxes])

  const highlightedData = useMemo(
    () =>
      comparisonData.map((scenario) => ({
        ...scenario,
        highlighted: scenario.id === highlightedScenario,
      })),
    [comparisonData, highlightedScenario],
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
          gap: 2,
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading radar data...
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
          px: theme.space.component.lg,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select scenarios to view the radar chart.
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={chartWrapperRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: theme.space.component.lg,
        }}
      >
        <RadarPlot
          data={highlightedData}
          axes={visibleAxisNames}
          responsive
          lineColors={lineColors}
          baselineData={baselineScenario ?? undefined}
          highlightBaseline={highlightBaseline}
          chosenIds={chosenIds}
          highlightedIds={highlightedIds}
          scenarioThemes={scenarioThemes}
          morphGeneration={morphGeneration}
          pinnedScenarioIds={pinnedSet}
          onPinnedToggle={togglePinnedScenario}
          onDotClick={(scenarioId, axis) => showOutcomeOnMap(axis, scenarioId)}
          activeMapDot={activeMapDot}
          dimUnpinned={dimUnpinned}
          axisRange={showRadarRange ? axisRange : undefined}
          showTierZones={showTierZones}
          showAllPaths
          showDotsOnly={showDotsOnly}
          onLineHover={setHoveredScenario}
          onLineClick={(d) => {
            setHighlightedScenario(highlightedScenario === d.id ? null : d.id)
          }}
        />
      </Box>
    </Box>
  )
}
