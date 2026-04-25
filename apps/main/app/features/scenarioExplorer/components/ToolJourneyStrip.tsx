"use client"

/**
 * ToolJourneyStrip. Title row rendered at the very top of each tool
 * panel, directly under the Explore secondary nav and above the
 * shared toolbar. Layout:
 *
 *   [Chart name]  [purpose]  [Take the tour]
 *
 * The chart name on the left doubles as the panel title (e.g.
 * "Radar chart", "Resilience heatmap"). The Take the tour link sits
 * after the purpose for tour-enabled modes. The purpose sentence comes
 * from journey.ts. Users switch tools via ExploreSubNav.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import type { ExploreMode } from "../store"
import { getExploreModeViewName, getJourneyStage } from "../journey"
import TakeTheTourButton from "./TakeTheTourButton"

interface ToolJourneyStripProps {
  mode: ExploreMode
}

export default function ToolJourneyStrip({ mode }: ToolJourneyStripProps) {
  const theme = useTheme()
  const stage = getJourneyStage(mode)
  const viewName = getExploreModeViewName(mode)

  if (!stage) return null

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        // Match [ToolToolbar.tsx] and other tool rows: list grid uses
        // theme.space.tool.px. Keep this strip on the same horizontal
        // rhythm as the "Scenario library" block.
        px: theme.space.tool.px,
        py: 0.5,
        minHeight: 44,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        flexWrap: "wrap",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "baseline",
          gap: 1.25,
          flexWrap: "wrap",
        }}
      >
        <Typography
          component="h2"
          variant="h6"
          sx={{
            color: theme.palette.text.primary,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
          }}
        >
          {viewName}
        </Typography>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 0.25,
            minWidth: 0,
          }}
        >
          <Typography
            variant="dashboard"
            sx={{
              fontWeight: 400,
              color: theme.palette.text.primary,
              lineHeight: 1.3,
            }}
          >
            {stage.purpose}
          </Typography>
          <TakeTheTourButton />
        </Box>
      </Box>
    </Box>
  )
}
