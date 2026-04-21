"use client"

/**
 * HowToReadChartModal. Renders the per-tool "How to read this chart"
 * body in a MobileModal. Content is keyed off the current exploreMode.
 *
 * Modal open state is owned by the caller (ToolToolbar) so the trigger
 * and the modal can share it without a store entry.
 */

import React from "react"
import { Box, Typography, alpha, useTheme, type Theme } from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import type { ExploreMode } from "../store"
import {
  ResilienceHowToRead,
  RadarHowToRead,
  ListHowToRead,
  ComparisonHowToRead,
  EquityHowToRead,
  DataHowToRead,
} from "./howToReadContent"

interface HowToReadChartModalProps {
  open: boolean
  onClose: () => void
  exploreMode: ExploreMode
}

const EXPLORE_MODE_READABLE_NAME: Record<ExploreMode, string> = {
  list: "the list view",
  radar: "the radar chart",
  equity: "the equity view",
  comparison: "the comparison view",
  resilience: "the resilience heatmap",
  data: "the data view",
}

function getModeMeta(mode: ExploreMode, theme: Theme) {
  switch (mode) {
    case "list":
      return {
        eyebrow: "SHORTLIST",
        summary:
          "Use the table to cut a large library of scenarios down to a handful worth carrying forward.",
        chapters: [
          "Start with the library",
          "Read the outcomes",
          "Gather a shortlist",
          "Switch the view",
        ],
        accent: theme.palette.blue.bright,
      }
    case "radar":
      return {
        eyebrow: "PORTFOLIO",
        summary:
          "Read each scenario as a shape, then compare your shortlist against the range of the full library.",
        chapters: ["Read the shape", "Use live controls"],
        accent: theme.palette.nature.forest,
      }
    case "resilience":
      return {
        eyebrow: "CLIMATE STRESS TEST",
        summary:
          "Cross outcomes with hydroclimates to see what holds, what breaks, and which risks hide behind the averages.",
        chapters: ["Scenarios", "Outcome", "More analysis"],
        accent: theme.palette.blue.dark,
      }
    case "equity":
      return {
        eyebrow: "COMING SOON",
        summary: "A distribution-first view of consistency across locations of interest.",
        chapters: ["Overview"],
        accent: theme.palette.blue.bright,
      }
    case "comparison":
      return {
        eyebrow: "RESEARCH",
        summary: "Reserved for future comparison workflows.",
        chapters: ["Overview"],
        accent: theme.palette.blue.bright,
      }
    case "data":
      return {
        eyebrow: "RESEARCH",
        summary: "Reserved for future data deep-dives.",
        chapters: ["Overview"],
        accent: theme.palette.blue.bright,
      }
    default: {
      const _never: never = mode
      return _never
    }
  }
}

function getBody(mode: ExploreMode) {
  switch (mode) {
    case "resilience":
      return <ResilienceHowToRead />
    case "radar":
      return <RadarHowToRead />
    case "list":
      return <ListHowToRead />
    case "comparison":
      return <ComparisonHowToRead />
    case "equity":
      return <EquityHowToRead />
    case "data":
      return <DataHowToRead />
    default: {
      const _exhaustive: never = mode
      return _exhaustive
    }
  }
}

export function HowToReadChartModal({
  open,
  onClose,
  exploreMode,
}: HowToReadChartModalProps) {
  const theme = useTheme()
  const title = `How to read ${EXPLORE_MODE_READABLE_NAME[exploreMode]}`
  const meta = getModeMeta(exploreMode, theme)

  return (
    <MobileModal
      open={open}
      onClose={onClose}
      title={title}
      titleId="how-to-read-chart-title"
      maxWidth="min(1180px, 96vw)"
      maxHeight="95vh"
      height="95vh"
      zIndex={theme.zIndex.floating}
      contentAriaLabel={title}
      subHeader={
        <Box
          sx={{
            px: theme.space.section.sm,
            py: theme.space.section.sm,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: `linear-gradient(135deg, ${alpha(meta.accent, 0.14)} 0%, ${alpha(
              theme.palette.common.white,
              0.96,
            )} 78%)`,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.15fr) minmax(320px, 0.85fr)" },
              gap: theme.space.section.sm,
              alignItems: "start",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  mb: theme.space.component.xs,
                  color: theme.palette.grey[700],
                  letterSpacing: "0.14em",
                }}
              >
                {meta.eyebrow}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  maxWidth: 640,
                  color: theme.palette.text.primary,
                }}
              >
                {meta.summary}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs:
                    meta.chapters.length > 1
                      ? "repeat(2, minmax(0, 1fr))"
                      : "minmax(0, 1fr)",
                  sm: `repeat(${meta.chapters.length}, minmax(0, 1fr))`,
                },
                gap: theme.space.component.xs,
              }}
            >
              {meta.chapters.map((chapter, index) => (
                <Box
                  key={chapter}
                  sx={{
                    minWidth: 0,
                    p: theme.space.component.sm,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor: theme.background.whiteOverlay[95],
                    border: `1px solid ${alpha(meta.accent, 0.18)}`,
                  }}
                >
                  <Typography
                    variant="smallSectionLabel"
                    sx={{
                      display: "block",
                      mb: 0.25,
                      color: theme.palette.grey[700],
                    }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                  <Typography
                    variant="compactCaption"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    {chapter}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      }
    >
      {getBody(exploreMode)}
    </MobileModal>
  )
}

export default HowToReadChartModal
