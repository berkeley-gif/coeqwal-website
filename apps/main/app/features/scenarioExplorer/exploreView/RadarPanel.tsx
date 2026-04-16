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
} from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Checkbox,
} from "@repo/ui/mui"
import { RadarPlot } from "@repo/viz"
import { ChartToast, InfoIconButton } from "@repo/ui"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import type { ShareItem } from "../store"
import { useScenarioList } from "../../scenarios/hooks"
import { useOutcomeMapAction } from "../../map/hooks"
import {
  getOutcomeName,
  getOutcomeCode,
  getOutcomeDefinition,
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  OUTCOME_REGIONAL_VARIANTS,
  type OutcomeCode,
} from "../../../content/outcomes"
import {
  captureSvgToBlob,
  inlineStyles,
  rasterizeSvgClone,
} from "../dataExplorer/utils/exportUtils"

export type SingleScenarioCaptureFn = (
  scenarioId: string,
) => Promise<{
  dataUrl: string
  color: string
  chartData: Record<string, unknown>
} | null>

interface RadarPanelProps {
  highlightedIds?: Set<string> | null
  onOutcomeHover?: (
    info: { scenarioId: string; outcome: string; tierValue: number } | null,
  ) => void
  /** Exposes a capture function to the parent so it can trigger radar capture */
  onCaptureReady?: (capture: () => Promise<void>) => void
  /** Exposes a single-scenario capture function for sidebar share */
  onSingleCaptureReady?: (capture: SingleScenarioCaptureFn) => void
}

export default function RadarPanel({
  highlightedIds = null,
  onOutcomeHover,
  onCaptureReady,
  onSingleCaptureReady,
}: RadarPanelProps) {
  const theme = useTheme()

  const {
    highlightedScenario,
    setHighlightedScenario,
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
    radarShowAll,
    showAxisSelector,
    hydroclimate,
  } = useScenarioExplorerStore()

  const addShareItem = useScenarioExplorerStore((s) => s.addShareItem)

  const { getThemeForScenario } = useScenarioList()
  const { showOutcomeOnMap, activeOutcome } = useOutcomeMapAction()

  const radarSvgRef = useRef<SVGSVGElement | null>(null)
  const handleSvgRef = useCallback((svg: SVGSVGElement | null) => {
    radarSvgRef.current = svg
  }, [])

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

  const handleDotHover = useCallback(
    (info: { scenarioId: string; axis: string; tierValue: number } | null) => {
      onOutcomeHover?.(
        info
          ? {
              scenarioId: info.scenarioId,
              outcome: info.axis,
              tierValue: info.tierValue,
            }
          : null,
      )
    },
    [onOutcomeHover],
  )

  const [axisPositions, setAxisPositions] = useState<
    { axis: string; x: number; y: number; anchor: "start" | "end" | "middle" }[]
  >([])

  const handleAxisPositions = useCallback(
    (
      positions: {
        axis: string
        x: number
        y: number
        anchor: "start" | "end" | "middle"
      }[],
    ) => {
      setAxisPositions(positions)
    },
    [],
  )

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

  const selectedSet = useMemo(
    () => new Set(selectedScenarios),
    [selectedScenarios],
  )

  const filteredData = useMemo(() => {
    if (radarShowAll) return comparisonData
    if (selectedScenarios.length === 0) return []
    return comparisonData.filter((d) => selectedSet.has(d.id))
  }, [comparisonData, selectedSet, selectedScenarios.length, radarShowAll])

  const filteredLineColors = useMemo(() => {
    if (radarShowAll) return lineColors
    if (selectedScenarios.length === 0) return []
    return comparisonData
      .map((d, i) => ({ id: d.id, color: lineColors[i] ?? "#666666" }))
      .filter(({ id }) => selectedSet.has(id))
      .map(({ color }) => color)
  }, [
    comparisonData,
    lineColors,
    selectedSet,
    selectedScenarios.length,
    radarShowAll,
  ])

  const scenarioThemes = useMemo(() => {
    const map: Record<string, string> = {}
    filteredData.forEach((d) => {
      map[d.id] = getThemeForScenario(d.id) ?? "unthemed"
    })
    return map
  }, [filteredData, getThemeForScenario])

  const visibleAxisNames = useMemo(() => {
    const nameSet = new Set(radarVisibleAxes.map(getOutcomeName))
    return axes.filter((a) => nameSet.has(a))
  }, [axes, radarVisibleAxes])

  // Radar capture function — exposed to parent via onCaptureReady
  const captureRadar = useCallback(async () => {
    const svg = radarSvgRef.current
    if (!svg) {
      console.warn("[RadarPanel] captureRadar: SVG ref is null")
      return
    }
    try {
      const { dataUrl } = await captureSvgToBlob(svg)
      const scenarioIds = filteredData.map((d) => d.id)

      const item: ShareItem = {
        id: crypto.randomUUID(),
        type: "radar",
        scenarioIds,
        scenarioColors: [...filteredLineColors],
        axes: [...radarVisibleAxes],
        showRange: showRadarRange,
        highlightBaseline,
        showDotsOnly: showDotsOnly,
        hydroclimate,
        cachedImageDataUrl: dataUrl,
        cachedChartData: Object.fromEntries(
          filteredData.map((d) => [d.id, d.values]),
        ),
      }
      addShareItem(item)
    } catch (err) {
      console.error("[RadarPanel] captureRadar failed:", err)
    }
  }, [
    filteredData,
    filteredLineColors,
    radarVisibleAxes,
    showRadarRange,
    highlightBaseline,
    showDotsOnly,
    hydroclimate,
    addShareItem,
  ])

  useEffect(() => {
    onCaptureReady?.(captureRadar)
  }, [captureRadar, onCaptureReady])

  const captureSingleScenarioRadar: SingleScenarioCaptureFn = useCallback(
    async (scenarioId) => {
      const svg = radarSvgRef.current
      if (!svg) return null

      try {
        const clone = svg.cloneNode(true) as SVGSVGElement
        inlineStyles(clone, svg)

        clone
          .querySelectorAll<SVGPathElement>("path[data-path-id]")
          .forEach((p) => {
            if (p.getAttribute("data-path-id") !== scenarioId) p.remove()
          })
        clone
          .querySelectorAll<SVGCircleElement>("circle.radar-dot")
          .forEach((d) => {
            if (d.getAttribute("data-scenario-id") !== scenarioId) d.remove()
          })

        const rect = svg.getBoundingClientRect()
        const w = rect.width || svg.clientWidth || 600
        const h = rect.height || svg.clientHeight || 600
        const { dataUrl } = await rasterizeSvgClone(clone, w, h)

        const idx = filteredData.findIndex((d) => d.id === scenarioId)
        const color =
          idx >= 0 ? (filteredLineColors[idx] ?? "#666666") : "#666666"

        const scenarioEntry = comparisonData.find(
          (d) => d.id === scenarioId,
        )
        const chartData: Record<string, unknown> = scenarioEntry
          ? { [scenarioId]: scenarioEntry.values }
          : {}

        return { dataUrl, color, chartData }
      } catch (err) {
        console.error("[RadarPanel] captureSingleScenarioRadar failed:", err)
        return null
      }
    },
    [comparisonData, filteredData, filteredLineColors],
  )

  useEffect(() => {
    onSingleCaptureReady?.(captureSingleScenarioRadar)
  }, [captureSingleScenarioRadar, onSingleCaptureReady])

  const highlightedData = useMemo(
    () =>
      filteredData.map((scenario) => ({
        ...scenario,
        highlighted: scenario.id === highlightedScenario,
      })),
    [filteredData, highlightedScenario],
  )

  const axesSet = useMemo(() => new Set(radarVisibleAxes), [radarVisibleAxes])

  const allKeySelected = OUTCOME_CODE_ORDER.every((c) => axesSet.has(c))
  const someKeySelected =
    !allKeySelected && OUTCOME_CODE_ORDER.some((c) => axesSet.has(c))

  const allRegionalSelected = NOD_SOD_OUTCOME_CODES.every((c) => axesSet.has(c))
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

  const noScenariosSelected = selectedScenarios.length === 0 && !radarShowAll
  const noAxesChosen = visibleAxisNames.length === 0

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
            lineColors={filteredLineColors}
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
            dimUnselected={radarShowAll && selectedScenarios.length > 0}
            tooltipLeftOffset={showAxisSelector ? 220 : 0}
            enableTooltip={false}
            svgRefCallback={handleSvgRef}
            onDotHover={handleDotHover}
            onAxisPositions={handleAxisPositions}
            onLineClick={(d) => {
              setHighlightedScenario(highlightedScenario === d.id ? null : d.id)
            }}
          />
        </Box>

        {/* TODO: Info icon overlay — one per axis label (disabled pending refinement)
        {axisPositions.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {axisPositions.map(({ axis, x, y, anchor }) => {
              const code = getOutcomeCode(axis)
              const definition = code
                ? getOutcomeDefinition(code)
                : undefined
              if (!definition) return null

              const offsetX =
                anchor === "start" ? 6 : anchor === "end" ? -6 : 0
              const offsetY = anchor === "middle" ? 14 : 0
              const translate =
                anchor === "start"
                  ? "translate(0, -50%)"
                  : anchor === "end"
                    ? "translate(-100%, -50%)"
                    : "translate(-50%, 0)"

              return (
                <Box
                  key={axis}
                  sx={{
                    position: "absolute",
                    left: x + offsetX,
                    top: y + offsetY,
                    transform: translate,
                    pointerEvents: "auto",
                  }}
                >
                  <InfoIconButton
                    variant="inline"
                    placement="top"
                    tooltipContent={
                      <Box sx={{ maxWidth: 260 }}>
                        <Typography
                          variant="compactSubtitle"
                          sx={{
                            fontWeight: 600,
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          {axis}
                        </Typography>
                        <Typography
                          variant="compactCaption"
                          sx={{ display: "block" }}
                        >
                          {definition}
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              )
            })}
          </Box>
        )}
        */}

        {noScenariosSelected && !isLoading && (
          <ChartToast>
            Select scenarios on the left to see them on the chart, or check show
            all scenarios, above
          </ChartToast>
        )}

        {!noScenariosSelected && noAxesChosen && !isLoading && (
          <ChartToast maxWidth={340}>Choose axes to show data</ChartToast>
        )}
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
