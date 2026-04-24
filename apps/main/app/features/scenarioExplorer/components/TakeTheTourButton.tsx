"use client"

/**
 * TakeTheTourButton. Small inline link-style button that starts the
 * per-tool tour for the active explore mode. Used in the
 * [ToolJourneyStrip.tsx] title row so the play icon and "Take the
 * tour" label read as a single action.
 *
 * Renders nothing for explore modes that do not have a tour
 * (Distribution and other research-only views), so callers can drop
 * it in unconditionally.
 */

import React from "react"
import { Box, Typography, useTheme, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import type { TourTool } from "../tour/types"

// Demo gate: only the List tour has polished popper copy right now, so
// we temporarily hide the entry point on Radar and Resilience. The
// underlying tours (content, anchors, runner) are intact. Re-add
// "radar" and "resilience" to this set once their popper content is
// filled out.
const TOUR_TOOLS = new Set<TourTool>(["list"])
function isTourTool(mode: string): mode is TourTool {
  return TOUR_TOOLS.has(mode as TourTool)
}

export default function TakeTheTourButton() {
  const theme = useTheme()
  const exploreMode = useScenarioExplorerStore((s) => s.exploreMode)
  const startToolTour = useScenarioExplorerStore((s) => s.startToolTour)

  if (!isTourTool(exploreMode)) return null

  return (
    <Box
      component="button"
      type="button"
      onClick={() => startToolTour(exploreMode)}
      aria-label="Take the tour for this chart"
      title="Take the tour for this chart"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.4,
        px: 0.6,
        py: 0,
        ml: 1,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        background: "transparent",
        color: theme.palette.blue.bright,
        verticalAlign: "middle",
        transition: "background-color 120ms",
        "&:hover": {
          background: theme.palette.interaction.selectedBackground,
        },
      }}
    >
      <icons.PlayCircleOutline
        sx={(t) => ({
          // Match label cap height: dashboard text is 0.875rem; keep
          // the glyph optically aligned with the cap line without
          // baseline hacks on the text span.
          fontSize: t.typography.dashboard.fontSize,
          lineHeight: 0,
          display: "block",
        })}
      />
      <Typography
        variant="dashboard"
        component="span"
        sx={{
          fontWeight: 500,
          whiteSpace: "nowrap",
          color: "inherit",
          lineHeight: 1.3,
        }}
      >
        Take the tour
      </Typography>
    </Box>
  )
}
