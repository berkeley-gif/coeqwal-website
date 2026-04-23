"use client"

/**
 * ToolJourneyStrip. Thin header rendered above each tool panel that
 * turns four sibling tabs into a coherent curation loop:
 *
 *   [Purpose line]                          [Next: Now try <X>]
 *
 * The purpose sentence comes from journey.ts per ExploreMode. The
 * Next nudge is a suggestion only; all tool tabs remain reachable
 * via ExploreSubNav.
 */

import React from "react"
import { Box, Typography, useTheme, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore, type ExploreMode } from "../store"
import { getJourneyStage } from "../journey"
import { useTabNavigation } from "../../../hooks/useTabNavigation"

interface ToolJourneyStripProps {
  mode: ExploreMode
}

export default function ToolJourneyStrip({ mode }: ToolJourneyStripProps) {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()
  const stage = getJourneyStage(mode)
  const setExploreMode = useScenarioExplorerStore((s) => s.setExploreMode)
  const setShowShareDrawer = useScenarioExplorerStore(
    (s) => s.setShowShareDrawer,
  )

  if (!stage) return null

  const handleNext = () => {
    if (stage.nextMode) {
      setExploreMode(stage.nextMode)
    } else if (stage.nextLabel === "Open Share") {
      // Final stage of the curation loop: surface the Share drawer to
      // remind the user of what they've collected, then send them to
      // the Share tab if they want to review it end-to-end.
      setShowShareDrawer(true)
      navigateToTab("share")
    }
  }

  const hasNextAction =
    stage.nextMode !== null || stage.nextLabel === "Open Share"

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 1.5,
        py: 0.5,
        minHeight: 36,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        flexWrap: "wrap",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", gap: 1, alignItems: "baseline" }}>
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: 400,
            color: theme.palette.text.secondary,
            lineHeight: 1.3,
          }}
        >
          {stage.purpose}
        </Typography>
      </Box>

      {hasNextAction && (
        <Box
          component="button"
          type="button"
          onClick={handleNext}
          title={stage.nextRationale}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            px: 1.25,
            py: 0.5,
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "0.8125rem",
            fontWeight: 500,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            color: theme.palette.blue.bright,
            background: "transparent",
            transition: "all 150ms ease",
            "&:hover": {
              background: theme.palette.interaction.selectedBackground,
            },
          }}
        >
          {stage.nextLabel}
          <icons.ArrowForward sx={{ fontSize: "1rem" }} />
        </Box>
      )}
    </Box>
  )
}
