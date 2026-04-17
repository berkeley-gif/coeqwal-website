"use client"

import React from "react"
import {
  Box,
  Checkbox,
  Typography,
  useTheme,
  type Theme,
  ThemeProvider,
} from "@repo/ui/mui"
import { InlineRowActions } from "../strategyGrid"
import { useScenarioExplorerStore } from "../store"

export type RadarAxisDetailCaptureFn = (scenarioId: string) => Promise<{
  dataUrl: string
  color: string
  chartData: Record<string, unknown>
} | null>

function RadarAxisDetailScenarioControlsInner({
  scenarioId,
  scenarioLabel,
  lineColor,
  accentColor,
  captureSingle,
}: {
  scenarioId: string
  scenarioLabel: string
  lineColor: string
  accentColor: string
  captureSingle: RadarAxisDetailCaptureFn
}) {
  const theme = useTheme()
  const toggleScenario = useScenarioExplorerStore((s) => s.toggleScenario)
  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )
  const pinnedScenarioIds = useScenarioExplorerStore(
    (s) => s.pinnedScenarioIds,
  )
  const togglePinnedScenario = useScenarioExplorerStore(
    (s) => s.togglePinnedScenario,
  )
  const addShareItem = useScenarioExplorerStore((s) => s.addShareItem)
  const radarVisibleAxes = useScenarioExplorerStore((s) => s.radarVisibleAxes)
  const showRadarRange = useScenarioExplorerStore((s) => s.showRadarRange)
  const highlightBaseline = useScenarioExplorerStore(
    (s) => s.highlightBaseline,
  )
  const showDotsOnly = useScenarioExplorerStore((s) => s.showDotsOnly)
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)

  const isChosen = selectedScenarios.includes(scenarioId)
  const isPinned = pinnedScenarioIds.includes(scenarioId)

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        height: "100%",
        boxSizing: "border-box",
        pl: 0.25,
        pr: 0.5,
      }}
    >
      <Checkbox
        size="small"
        checked={isChosen}
        onChange={() => toggleScenario(scenarioId)}
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...theme.scenarios.checkbox.sm,
          flexShrink: 0,
          alignSelf: "center",
          mt: "1px",
        }}
      />
      <Typography
        component="span"
        sx={{
          flex: 1,
          minWidth: 0,
          color: theme.palette.grey[600],
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: "0.6875rem",
          lineHeight: 1,
        }}
      >
        {scenarioId.toUpperCase()}
      </Typography>
      <InlineRowActions
        scenarioId={scenarioId}
        scenarioLabel={scenarioLabel}
        displayMode={outcomeDisplayMode as "summary" | "distribution"}
        isPinned={isPinned}
        accentColor={accentColor}
        hidePinning
        shareIconNudgeTop="-2px"
        onShare={async () => {
          const result = await captureSingle(scenarioId)
          addShareItem({
            id: crypto.randomUUID(),
            type: "radar",
            scenarioIds: [scenarioId],
            scenarioColors: result ? [result.color] : [lineColor],
            axes: [...radarVisibleAxes],
            showRange: showRadarRange,
            highlightBaseline,
            showDotsOnly,
            hydroclimate,
            cachedImageDataUrl: result?.dataUrl,
            cachedChartData: result?.chartData,
          })
        }}
        togglePinnedScenario={togglePinnedScenario}
      />
    </Box>
  )
}

/** Root for createRoot: includes ThemeProvider so MUI hooks work inside SVG foreignObject. */
export function RadarAxisDetailScenarioControlsRoot({
  theme,
  scenarioId,
  scenarioLabel,
  lineColor,
  accentColor,
  captureSingle,
}: {
  theme: Theme
  scenarioId: string
  scenarioLabel: string
  lineColor: string
  accentColor: string
  captureSingle: RadarAxisDetailCaptureFn
}) {
  return (
    <ThemeProvider theme={theme}>
      <RadarAxisDetailScenarioControlsInner
        scenarioId={scenarioId}
        scenarioLabel={scenarioLabel}
        lineColor={lineColor}
        accentColor={accentColor}
        captureSingle={captureSingle}
      />
    </ThemeProvider>
  )
}
