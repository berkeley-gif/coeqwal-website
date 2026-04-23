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
  const toggleScenario = useScenarioExplorerStore((s) => s.toggleScenario)
  const selectedScenarios = useScenarioExplorerStore((s) => s.selectedScenarios)
  const outcomeDisplayMode = useScenarioExplorerStore(
    (s) => s.outcomeDisplayMode,
  )
  const pinnedScenarioIds = useScenarioExplorerStore((s) => s.pinnedScenarioIds)
  const togglePinnedScenario = useScenarioExplorerStore(
    (s) => s.togglePinnedScenario,
  )
  const addShareItem = useScenarioExplorerStore((s) => s.addShareItem)
  const radarVisibleAxes = useScenarioExplorerStore((s) => s.radarVisibleAxes)
  const showRadarRange = useScenarioExplorerStore((s) => s.showRadarRange)
  const highlightBaseline = useScenarioExplorerStore((s) => s.highlightBaseline)
  const showDotsOnly = useScenarioExplorerStore((s) => s.showDotsOnly)
  const hydroclimate = useScenarioExplorerStore((s) => s.hydroclimate)

  const isChosen = selectedScenarios.includes(scenarioId)
  const isPinned = pinnedScenarioIds.includes(scenarioId)

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
      <Checkbox
        size="small"
        checked={isChosen}
        onChange={() => toggleScenario(scenarioId)}
        onClick={(e) => e.stopPropagation()}
        sx={{
          ...theme.scenarios.checkbox.sm,
          /** Scale from left so the visible control lines up with `contentX` (see viz `foreignObject` x). */
          transformOrigin: "0 50%",
          flexShrink: 0,
          alignSelf: "flex-start",
          mt: "1px",
        }}
      />
      {/* First row matches StrategyHeader compact (ScenarioSelectionSidebar). */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          /**
           * Partial offset for `transformOrigin: "0 50%"` (dead space in the
           * checkbox flex item); keep less negative than before so there is
           * clear space between the glyph and the short code.
           */
          marginLeft: theme.spacing(-1),
          display: "flex",
          alignItems: "center",
          gap: "4px",
          mb: "1px",
          minHeight: "16px",
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
          {scenarioId.toUpperCase()}
        </Typography>
        <InlineRowActions
          scenarioId={scenarioId}
          scenarioLabel={scenarioLabel}
          displayMode={outcomeDisplayMode}
          isPinned={isPinned}
          accentColor={accentColor}
          dense
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
