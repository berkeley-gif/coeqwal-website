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
import { InlineRowActions } from "../list/grid"
import { useWorkspaceSlice, useRadarSlice } from "../../../store"

export type RadarAxisDetailCaptureFn = (scenarioId: string) => Promise<{
  svg: string
  dataUrl: string
  color: string
  chartData: Record<string, unknown>
} | null>

function RadarAxisDetailScenarioControlsInner({
  scenarioId,
  scenarioLabel,
  lineColor,
  accentColor,
  chromePaddingLeftPx,
  captureSingle,
}: {
  scenarioId: string
  scenarioLabel: string
  lineColor: string
  accentColor: string
  /** From viz: aligns checkbox with LTR start of SVG scenario title for any `text-anchor`. */
  chromePaddingLeftPx: number
  captureSingle: RadarAxisDetailCaptureFn
}) {
  const theme = useTheme()
  const toggleScenario = useWorkspaceSlice((s) => s.toggleScenario)
  const selectedScenarios = useWorkspaceSlice((s) => s.selectedScenarios)
  const outcomeDisplayMode = useWorkspaceSlice((s) => s.outcomeDisplayMode)
  const addShareItem = useWorkspaceSlice((s) => s.addShareItem)
  const showTierZones = useWorkspaceSlice((s) => s.showTierZones)
  const highlightBaseline = useWorkspaceSlice((s) => s.highlightBaseline)
  const hydroclimate = useWorkspaceSlice((s) => s.hydroclimate)
  const radarVisibleAxes = useRadarSlice((s) => s.radarVisibleAxes)
  const showRadarRange = useRadarSlice((s) => s.showRadarRange)
  const showDotsOnly = useRadarSlice((s) => s.showDotsOnly)

  const isChosen = selectedScenarios.includes(scenarioId)

  /** Right inset: matches `panelPaddingX` in viz detail style. */
  const panelPadX = 9

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        height: "100%",
        boxSizing: "border-box",
        pl: `${chromePaddingLeftPx}px`,
        pr: `${panelPadX}px`,
        py: 0,
      }}
    >
      <Typography
        component="span"
        sx={{
          flex: "0 1 auto",
          minWidth: 0,
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          color: theme.palette.grey[600],
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: "0.6875rem",
          lineHeight: 1,
        }}
      >
        Outcome Score:
      </Typography>
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
  chromePaddingLeftPx,
  captureSingle,
}: {
  theme: Theme
  scenarioId: string
  scenarioLabel: string
  lineColor: string
  accentColor: string
  chromePaddingLeftPx: number
  captureSingle: RadarAxisDetailCaptureFn
}) {
  return (
    <ThemeProvider theme={theme}>
      <RadarAxisDetailScenarioControlsInner
        scenarioId={scenarioId}
        scenarioLabel={scenarioLabel}
        lineColor={lineColor}
        accentColor={accentColor}
        chromePaddingLeftPx={chromePaddingLeftPx}
        captureSingle={captureSingle}
      />
    </ThemeProvider>
  )
}
