"use client"

/**
 * RadarPanel - Radar chart view for scenario comparison.
 *
 * Wraps the @repo/viz RadarPlot component with store-driven data
 * via the shared useComparisonData hook. Supports hover coordination
 * with the sidebar and other panels. Sidebar `highlightedIds` append
 * scenarios to the chart so their traces render even when not selected.
 */

import React, { useMemo, useState, useRef, useCallback, useEffect } from "react"
import { createRoot, type Root } from "react-dom/client"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Checkbox,
  InfoOutlinedIcon,
} from "@repo/ui/mui"
import {
  RadarPlot,
  mergeRadarAxisLabelDetailStyle,
  type RadarPlotAxisLabelDetailStyle,
  type RadarAxisLabelDetailChromeOptions,
} from "@repo/viz"
import { ChartToast, ClickTooltip, TooltipCloseButton } from "@repo/ui"
import { useComparisonData } from "../hooks/useComparisonData"
import { useScenarioExplorerStore } from "../store"
import type { ShareItem } from "../store"
import ToolIntroStrip from "../components/ToolIntroStrip"
import { useScenarioList } from "../../scenarios/hooks"
import { useOutcomeMapAction } from "../../map/hooks"
import {
  getOutcomeName,
  getOutcomeCode,
  getOutcomeDefinition,
  OUTCOME_DEFINITIONS,
  OUTCOME_CODE_ORDER,
  NOD_SOD_OUTCOME_CODES,
  NOD_SOD_NAMES,
  OUTCOME_REGIONAL_VARIANTS,
  type OutcomeCode,
  type NodSodCode,
} from "../../../content/outcomes"
import {
  captureSvgToBlob,
  inlineStyles,
  rasterizeSvgClone,
} from "../dataExplorer/utils/exportUtils"
import { InlineToggleChip } from "../components/InlineToggleChip"
import { RadarAxisDetailScenarioControlsRoot } from "./RadarAxisDetailScenarioControls"
import ToolEmptyState from "../components/ToolEmptyState"

export type SingleScenarioCaptureFn = (scenarioId: string) => Promise<{
  dataUrl: string
  color: string
  chartData: Record<string, unknown>
} | null>

interface RadarPanelProps {
  highlightedIds?: Set<string> | null
  onOutcomeHover?: (
    info: { scenarioId: string; outcome: string; tierValue: number } | null,
  ) => void
  /** Notifies parent of the current scenarioId → color mapping for the radar chart */
  onScenarioColors?: (colors: Record<string, string>) => void
  /** Exposes a capture function to the parent so it can trigger radar capture */
  onCaptureReady?: (capture: () => Promise<void>) => void
  /** Exposes a single-scenario capture function for sidebar share */
  onSingleCaptureReady?: (capture: SingleScenarioCaptureFn) => void
}

export default function RadarPanel({
  highlightedIds = null,
  onOutcomeHover,
  onScenarioColors,
  onCaptureReady,
  onSingleCaptureReady,
}: RadarPanelProps) {
  const theme = useTheme()

  const radarAxisLabelDetailStyle =
    useMemo((): RadarPlotAxisLabelDetailStyle => {
      const axisTypo = theme.typography.axisLabel

      return mergeRadarAxisLabelDetailStyle({
        fontFamily: axisTypo.fontFamily as string,
        scenarioFontSize: axisTypo.fontSize as string,
        scenarioFontWeight: Number(axisTypo.fontWeight),
        scenarioLetterSpacing: axisTypo.letterSpacing as string,
        tierFontSize: theme.typography.compactCaption.fontSize as string,
        tierFontWeight: Number(theme.typography.compactCaption.fontWeight),
        panelFill: theme.palette.common.white,
        panelStroke: "none",
        scenarioFill: "#193D6B",
        tierFill: "#193D6B",
        axisTitleFill: "#193D6B",
        scenarioControlsRowHeightPx: 26,
        scenarioControlsRowGapPx: 4,
      })
    }, [theme])

  const {
    selectedScenarios,
    toggleScenario,
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
    setRadarShowAll,
    showAxisSelector,
    setShowAxisSelector,
    hydroclimate,
  } = useScenarioExplorerStore()

  const addShareItem = useScenarioExplorerStore((s) => s.addShareItem)

  const { getThemeForScenario, getDisplayName } = useScenarioList()
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

  // Measured bounding boxes of each axis label group in the SVG, keyed by
  // axis display name. Used to place the info icon flush against the
  // rendered text rather than guessing from the anchor point. Re-measured
  // whenever the chart re-renders (new axisPositions array).
  const [axisLabelRects, setAxisLabelRects] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({})

  useEffect(() => {
    const svg = radarSvgRef.current
    if (!svg || axisPositions.length === 0) {
      setAxisLabelRects({})
      return
    }
    const rects: Record<
      string,
      { x: number; y: number; width: number; height: number }
    > = {}
    svg.querySelectorAll<SVGGElement>("g.axis-label").forEach((g) => {
      const axis = g.getAttribute("data-axis")
      if (!axis) return
      // For two-line curated labels the group contains two <text> title
      // elements; the last appended one is the bottom line. We want the
      // icon to land after the last word of that last line, so we measure
      // the last <text class="axis-label-title"> specifically rather than
      // the whole group's bbox (which would center across both lines and
      // right-align to the widest line).
      const titles = g.querySelectorAll<SVGTextElement>("text.axis-label-title")
      const last = titles[titles.length - 1]
      if (!last) return
      try {
        const bb = last.getBBox()
        if (bb.width > 0 && bb.height > 0) {
          rects[axis] = {
            x: bb.x,
            y: bb.y,
            width: bb.width,
            height: bb.height,
          }
        }
      } catch {
        // getBBox can throw on detached nodes; ignore and skip.
      }
    })
    setAxisLabelRects(rects)
  }, [axisPositions])

  // Which axis label's info popover is currently open (by display name).
  // Only one open at a time; clicking another closes the previous.
  const [openInfoAxis, setOpenInfoAxis] = useState<string | null>(null)
  const closeInfoTooltip = useCallback(() => setOpenInfoAxis(null), [])

  // Map an axis display name back to its outcome code, handling both the
  // aggregate outcomes (OUTCOME_NAMES) and the regional NOD/SOD codes
  // (NOD_SOD_NAMES). Returns the code string or undefined.
  const axisDisplayNameToCode = useCallback(
    (displayName: string): string | undefined => {
      const primary = getOutcomeCode(displayName)
      if (primary) return primary
      const nodSodEntry = (
        Object.entries(NOD_SOD_NAMES) as [NodSodCode, string][]
      ).find(([, name]) => name === displayName)
      return nodSodEntry?.[0]
    },
    [],
  )

  // Reverse lookup from a NOD/SOD code to its parent aggregate outcome,
  // so regional spokes can fall back to the parent outcome's definition
  // (we don't carry separate NOD/SOD definition copy on the radar).
  const nodSodToParent = useMemo(() => {
    const map = new Map<NodSodCode, OutcomeCode>()
    for (const [parent, variants] of Object.entries(
      OUTCOME_REGIONAL_VARIANTS,
    ) as [OutcomeCode, [NodSodCode, NodSodCode]][]) {
      const [nod, sod] = variants
      map.set(nod, parent)
      map.set(sod, parent)
    }
    return map
  }, [])

  // Resolve an axis display name to its definition text. For NOD/SOD spokes,
  // we intentionally show the parent outcome's definition (no regional
  // variants of the copy today). Returns undefined if no definition exists.
  const resolveAxisDefinition = useCallback(
    (displayName: string): string | undefined => {
      const code = axisDisplayNameToCode(displayName)
      if (!code) return undefined
      const parent = nodSodToParent.get(code as NodSodCode)
      if (parent) return OUTCOME_DEFINITIONS[parent]
      return getOutcomeDefinition(code)
    },
    [axisDisplayNameToCode, nodSodToParent],
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

  /** Stable palette index aligned with `comparisonData`. */
  const scenarioColorById = useMemo(() => {
    const m = new Map<string, string>()
    comparisonData.forEach((d, i) => {
      m.set(d.id, lineColors[i] ?? "#666666")
    })
    return m
  }, [comparisonData, lineColors])

  const filteredData = useMemo(() => {
    let base: typeof comparisonData
    if (radarShowAll) base = comparisonData
    else if (selectedScenarios.length === 0) base = []
    else base = comparisonData.filter((d) => selectedSet.has(d.id))

    if (highlightedIds == null || highlightedIds.size === 0) return base

    const seen = new Set(base.map((d) => d.id))
    const merged = [...base]
    for (const id of highlightedIds) {
      if (seen.has(id)) continue
      const row = comparisonData.find((d) => d.id === id)
      if (row) {
        merged.push(row)
        seen.add(id)
      }
    }
    return merged
  }, [
    comparisonData,
    selectedSet,
    selectedScenarios.length,
    radarShowAll,
    highlightedIds,
  ])

  const filteredLineColors = useMemo(
    () => filteredData.map((d) => scenarioColorById.get(d.id) ?? "#666666"),
    [filteredData, scenarioColorById],
  )

  const scenarioColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    filteredData.forEach((d, i) => {
      map[d.id] = filteredLineColors[i] ?? "#666666"
    })
    return map
  }, [filteredData, filteredLineColors])

  useEffect(() => {
    onScenarioColors?.(scenarioColorMap)
  }, [scenarioColorMap, onScenarioColors])

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

  // Radar capture function - exposed to parent via onCaptureReady
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
      if (!radarSvgRef.current) return null

      const alreadyVisible =
        radarShowAll || selectedScenarios.includes(scenarioId)
      let didToggle = false

      if (!alreadyVisible) {
        const wrapper = chartWrapperRef.current
        if (wrapper) wrapper.style.opacity = "0"
        toggleScenario(scenarioId)
        didToggle = true
        const deadline = Date.now() + 2000
        await new Promise<void>((resolve) => {
          const check = () => {
            const svg = radarSvgRef.current
            if (
              svg?.querySelector(`path[data-path-id="${scenarioId}"]`) ||
              Date.now() > deadline
            ) {
              resolve()
            } else {
              requestAnimationFrame(check)
            }
          }
          requestAnimationFrame(check)
        })
      }

      try {
        const svg = radarSvgRef.current
        if (!svg) return null

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

        const allData = comparisonData
        const allColors = lineColors
        const idx = allData.findIndex((d) => d.id === scenarioId)
        const color = idx >= 0 ? (allColors[idx] ?? "#666666") : "#666666"

        const scenarioEntry = allData.find((d) => d.id === scenarioId)
        const chartData: Record<string, unknown> = scenarioEntry
          ? { [scenarioId]: scenarioEntry.values }
          : {}

        return { dataUrl, color, chartData }
      } catch (err) {
        console.error("[RadarPanel] captureSingleScenarioRadar failed:", err)
        return null
      } finally {
        if (didToggle) {
          toggleScenario(scenarioId)
        }
        const wrapper = chartWrapperRef.current
        if (wrapper) wrapper.style.opacity = ""
      }
    },
    [
      comparisonData,
      lineColors,
      selectedScenarios,
      radarShowAll,
      toggleScenario,
    ],
  )

  useEffect(() => {
    onSingleCaptureReady?.(captureSingleScenarioRadar)
  }, [captureSingleScenarioRadar, onSingleCaptureReady])

  const axisDetailChromeRootsRef = useRef(new Map<HTMLDivElement, Root>())

  const axisLabelDetailChrome =
    useMemo((): RadarAxisLabelDetailChromeOptions => {
      return {
        onBeforeSvgDomClear() {
          const map = axisDetailChromeRootsRef.current
          for (const root of map.values()) {
            root.unmount()
          }
          map.clear()
        },
        onScenarioControlsMount(host, payload) {
          const map = axisDetailChromeRootsRef.current
          let root = map.get(host)
          if (!root) {
            root = createRoot(host)
            map.set(host, root)
          }
          const scenarioLabel = getDisplayName(payload.scenarioId)
          const lineColor = scenarioColorMap[payload.scenarioId] ?? "#666666"
          const accentColor = lineColor || theme.palette.blue.bright

          root.render(
            <RadarAxisDetailScenarioControlsRoot
              theme={theme}
              scenarioId={payload.scenarioId}
              scenarioLabel={scenarioLabel}
              lineColor={lineColor}
              accentColor={accentColor}
              chromePaddingLeftPx={payload.chromePaddingLeftPx}
              captureSingle={captureSingleScenarioRadar}
            />,
          )
        },
        onScenarioControlsUnmount(host) {
          const r = axisDetailChromeRootsRef.current.get(host)
          r?.unmount()
          axisDetailChromeRootsRef.current.delete(host)
        },
      }
    }, [theme, getDisplayName, scenarioColorMap, captureSingleScenarioRadar])

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

  // Show instructive empty state when there's nothing to render: no
  // selected scenarios and the user hasn't opted into "show all".
  // Hover-highlighted rows alone (from the sidebar) don't count because
  // they disappear on mouseleave; we want stable, selected scenarios.
  if (selectedScenarios.length === 0 && !radarShowAll) {
    return (
      <ToolEmptyState
        mode="radar"
        title="Pick scenarios to compare as portfolios"
        body="The radar chart reads each scenario as a shape across the outcomes that matter to you. Select two or more scenarios to see their shapes overlap."
        detail="Tip: turn on 'show all scenarios' in the controls above to sweep the whole library at once."
      />
    )
  }

  const hasRadarTraceData = filteredData.length > 0

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
      <ToolIntroStrip
        mode="radar"
        title="Compare scenarios as shapes, not rows"
        summary="Each polygon is one scenario. Axes are the outcomes you care about. Look at the overall shape: a balanced portfolio reads round, a lopsided one shows spikes and pinches."
        bullets={[
          {
            label: "Closer to the center is better.",
            body: "Same tier idea as the list: tier 1 hugs the center, tier 4 sits near the edge.",
          },
          {
            label: "Compare shapes, not just numbers.",
            body: "Where one scenario bulges another may pinch. That is the trade-off.",
          },
          {
            label: "Use the climate toggle.",
            body: "The same scenarios can read very differently under wet, dry, or warm futures.",
          },
        ]}
        tourStep={1}
      />
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
            <TooltipCloseButton
              onClick={() => setShowAxisSelector(false)}
              ariaLabel="Close choose outcome axes panel"
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
              Choose outcome axes
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
            // Nudge chart + in-SVG axis detail up so bottom hovers clear the viewport
            transform: "translateY(-10px)",
          }}
        >
          <RadarPlot
            data={filteredData}
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
            axisLabelDetailStyle={radarAxisLabelDetailStyle}
            axisLabelDetailChrome={axisLabelDetailChrome}
          />

          {/* Per-axis info icons with click-to-open definition popover.
              Positioned using the same pixel coordinates the RadarPlot
              reports via onAxisPositions (SVG width/height are set to the
              container's pixel size, so SVG user units == DOM pixels here,
              and this overlay shares the same bounds and transform as the
              chart wrapper). */}
          {axisPositions.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              {axisPositions.map(({ axis, x, y }) => {
                const definition = resolveAxisDefinition(axis)
                if (!definition) return null

                // Always place the icon inline after the last word of the
                // label (i.e. flush against the right edge of the rendered
                // text), vertically centered. When we haven't measured the
                // label's bbox yet, fall back to a rough offset from the
                // anchor point so the icon still appears on first paint.
                const rect = axisLabelRects[axis]
                const GAP = 3
                const iconLeft = rect ? rect.x + rect.width + GAP : x + GAP
                const iconTop = rect ? rect.y + rect.height / 2 : y

                const isOpen = openInfoAxis === axis

                return (
                  <Box
                    key={axis}
                    sx={{
                      position: "absolute",
                      left: iconLeft,
                      top: iconTop,
                      transform: "translate(0, -50%)",
                      pointerEvents: "auto",
                      lineHeight: 0,
                    }}
                  >
                    <ClickTooltip
                      open={isOpen}
                      onClose={closeInfoTooltip}
                      placement="top"
                      maxWidth="320px"
                      content={
                        <Box sx={{ pr: theme.space.component.md }}>
                          <Typography
                            variant="compactSubtitle"
                            sx={{
                              fontWeight: 700,
                              display: "block",
                              mb: theme.space.component.sm,
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
                    >
                      {/* span wrapper: gives MUI Tooltip a native element it
                          can attach its ref and extra ARIA props to. */}
                      <span style={{ display: "inline-flex" }}>
                        <Box
                          component="button"
                          type="button"
                          aria-label={`About ${axis}`}
                          aria-expanded={isOpen}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            setOpenInfoAxis(isOpen ? null : axis)
                          }}
                          sx={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px",
                            borderRadius: "50%",
                            color: isOpen
                              ? theme.palette.primary.main
                              : theme.palette.text.primary,
                            transition:
                              "color 120ms ease, background-color 120ms ease",
                            "&:hover": {
                              color: theme.palette.primary.main,
                            },
                            "&:focus-visible": {
                              outline: `2px solid ${theme.palette.primary.main}`,
                              outlineOffset: "1px",
                            },
                          }}
                        >
                          <InfoOutlinedIcon
                            sx={{ fontSize: 14, display: "block" }}
                          />
                        </Box>
                      </span>
                    </ClickTooltip>
                  </Box>
                )
              })}
            </Box>
          )}
        </Box>

        {!hasRadarTraceData && !isLoading && (
          <ChartToast maxWidth={480}>
            <Box
              sx={{
                pointerEvents: "auto",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <Box component="span">
                Select scenarios on the left to see them on the chart, or use
              </Box>
              <InlineToggleChip
                label="show all scenarios"
                active={radarShowAll}
                onClick={() => setRadarShowAll(!radarShowAll)}
                onDarkBackground
              />
              <Box component="span">in the chart controls above.</Box>
            </Box>
          </ChartToast>
        )}

        {hasRadarTraceData && !isLoading && visibleAxisNames.length <= 2 && (
          <ChartToast maxWidth={440}>
            <Box
              sx={{
                pointerEvents: "auto",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              <Box component="span">To show data, use</Box>
              <InlineToggleChip
                label="choose outcome axes"
                active={showAxisSelector}
                onClick={() => setShowAxisSelector(!showAxisSelector)}
                onDarkBackground
              />
              <Box component="span">in the chart controls above.</Box>
            </Box>
          </ChartToast>
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
