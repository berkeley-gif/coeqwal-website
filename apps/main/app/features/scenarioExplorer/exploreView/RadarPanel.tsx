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
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Checkbox,
} from "@repo/ui/mui"
import { RadarPlot, type VerticalParallelLineData } from "@repo/viz"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import { useOutcomeMapAction } from "../../map/hooks"
import {
  getOutcomeName,
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  OUTCOME_REGIONAL_VARIANTS,
  type OutcomeCode,
} from "../../../content/outcomes"

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
    setRadarVisibleAxes,
    toggleRadarAxis,
    showRadarRange,
    showDotsOnly,
    radarSelectedOnly,
    showAxisSelector,
    hydroclimate,
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

  const axesSet = useMemo(() => new Set(radarVisibleAxes), [radarVisibleAxes])

  const allKeySelected = OUTCOME_CODE_ORDER.every((c) => axesSet.has(c))
  const someKeySelected =
    !allKeySelected && OUTCOME_CODE_ORDER.some((c) => axesSet.has(c))

  const allRegionalSelected = NOD_SOD_OUTCOME_CODES.every((c) =>
    axesSet.has(c),
  )
  const someRegionalSelected =
    !allRegionalSelected && NOD_SOD_OUTCOME_CODES.some((c) => axesSet.has(c))

  const toggleGroup = useCallback(
    (codes: readonly string[], allOn: boolean) => {
      if (allOn) {
        const remaining = radarVisibleAxes.filter((c) => !codes.includes(c))
        setRadarVisibleAxes(remaining)
      } else {
        const merged = [...radarVisibleAxes]
        for (const c of codes) {
          if (!merged.includes(c)) merged.push(c)
        }
        setRadarVisibleAxes(merged)
      }
    },
    [radarVisibleAxes, setRadarVisibleAxes],
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

  const hasRegionalAxis = NOD_SOD_OUTCOME_CODES.some((c) => axesSet.has(c))
  const [nodSodSnackOpen, setNodSodSnackOpen] = useState(false)
  const prevHydroRef = useRef(hydroclimate)

  useEffect(() => {
    if (prevHydroRef.current !== hydroclimate) {
      prevHydroRef.current = hydroclimate
      if (hydroclimate !== "historical" && hasRegionalAxis) {
        setNodSodSnackOpen(true)
        const timer = setTimeout(() => setNodSodSnackOpen(false), 4000)
        return () => clearTimeout(timer)
      }
    }
  }, [hydroclimate, hasRegionalAxis])

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
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading radar data...
        </Typography>
      </Box>
    )
  }

  if (!hasData && !radarSelectedOnly) {
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
        position: "relative",
      }}
    >
      <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
        {showAxisSelector && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 220,
              zIndex: 2,
              overflowY: "scroll",
              borderRight: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.background.paper,
              py: 1.5,
              px: 1,
            }}
          >
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
              }}
            >
              Choose axes
            </Typography>
            <AxisRow
              label="All key outcomes"
              checked={allKeySelected}
              indeterminate={someKeySelected}
              bold
              onClick={() => toggleGroup(OUTCOME_CODE_ORDER, allKeySelected)}
              sx={checkboxSx}
            />
            <AxisRow
              label="All regional outcomes"
              checked={allRegionalSelected}
              indeterminate={someRegionalSelected}
              bold
              onClick={() =>
                toggleGroup(NOD_SOD_OUTCOME_CODES, allRegionalSelected)
              }
              sx={checkboxSx}
            />

            <Box
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                my: 1,
              }}
            />

            {/* Outcomes with regional variants */}
            {withRegional.map((code) => {
              const variants = OUTCOME_REGIONAL_VARIANTS[code as OutcomeCode]!
              return (
                <Box key={code} sx={{ mb: 0.75 }}>
                  <AxisRow
                    label={getOutcomeName(code)}
                    checked={axesSet.has(code)}
                    bold
                    onClick={() => toggleRadarAxis(code)}
                    sx={checkboxSx}
                  />
                  {variants.map((vCode) => (
                    <AxisRow
                      key={vCode}
                      label={
                        vCode.startsWith("NOD")
                          ? "North of Delta"
                          : "South of Delta"
                      }
                      checked={axesSet.has(vCode)}
                      indent
                      onClick={() => toggleRadarAxis(vCode)}
                      sx={checkboxSx}
                    />
                  ))}
                </Box>
              )
            })}

            <Box
              sx={{
                borderBottom: `1px solid ${theme.palette.divider}`,
                my: 1,
              }}
            />

            {/* Outcomes without regional variants */}
            {withoutRegional.map((code) => (
              <AxisRow
                key={code}
                label={getOutcomeName(code)}
                checked={axesSet.has(code)}
                bold
                onClick={() => toggleRadarAxis(code)}
                sx={checkboxSx}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 0,
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
            onDotClick={(scenarioId, axis) =>
              showOutcomeOnMap(axis, scenarioId)
            }
            activeMapDot={activeMapDot}
            dimUnpinned={dimUnpinned}
            axisRange={showRadarRange ? axisRange : undefined}
            showTierZones={showTierZones}
            showAllPaths
            showDotsOnly={showDotsOnly}
            dimUnselected={radarSelectedOnly}
            onLineHover={setHoveredScenario}
            onLineClick={(d) => {
              setHighlightedScenario(
                highlightedScenario === d.id ? null : d.id,
              )
            }}
          />
        </Box>
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

      {nodSodSnackOpen && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            bgcolor: theme.palette.grey[800],
            color: theme.palette.common.white,
            fontSize: "0.85rem",
            fontWeight: 500,
            borderRadius: theme.borderRadius.sm,
            px: 2,
            py: 1,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          NOD/SOD alternative hydroclimates not loaded yet
        </Box>
      )}
    </Box>
  )
}

function AxisRow({
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
