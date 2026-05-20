"use client"

/**
 * TakeTheTourButton. Small inline link-style button that starts the
 * per-tool tour for the active explore mode. Used in the
 * `ToolJourneyStrip` title row so the play icon and "Take the tour"
 * label read as a single action.
 *
 * Lives next to the runner because it is the entry point that flips
 * the runner on. Renders nothing for explore modes that do not have a
 * tour, so callers can drop it in unconditionally. The "do we have a
 * tour for this mode?" check is `hasTourFor` from `tour/registry.ts`,
 * so adding a tour to a new tool flips this button on automatically.
 */

import React from "react"
import { Box, Typography, useTheme, icons } from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../../store"
import { hasTourFor } from "../registry"

export default function TakeTheTourButton() {
  const theme = useTheme()
  const exploreMode = useWorkspaceSlice((s) => s.exploreMode)
  const startToolTour = useWorkspaceSlice((s) => s.startToolTour)

  if (!hasTourFor(exploreMode)) return null

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
          // Match label cap height: dashboard text is 0.875rem. Keep
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
