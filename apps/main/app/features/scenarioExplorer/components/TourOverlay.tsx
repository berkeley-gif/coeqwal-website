"use client"

/**
 * TourOverlay. Opt-in four-step walkthrough of the scenario explorer
 * tools (list, radar, equity, resilience) followed by a Share prompt.
 *
 * The overlay is rendered as a fixed card anchored to the bottom-center
 * of the viewport. Each step advances `tour.step` in the store and also
 * switches `exploreMode` so the relevant tool is visible behind the
 * card. The tour is strictly additive: the user can dismiss at any
 * time, and all tools remain reachable through ExploreSubNav.
 */

import React, { useEffect } from "react"
import { Box, Typography, Button, useTheme, icons } from "@repo/ui/mui"
import { useScenarioExplorerStore, type ExploreMode } from "../store"
import { useTabNavigation } from "../../../hooks/useTabNavigation"

interface TourStep {
  mode: ExploreMode | null
  title: string
  body: string
}

const TOUR_STEPS: TourStep[] = [
  {
    mode: "list",
    title: "1. Start with the List",
    body: "Each row is a scenario, a preset plan for managing California water. Pick a few that look interesting to keep reading, comparing, and sharing.",
  },
  {
    mode: "radar",
    title: "2. Compare on the Radar",
    body: "See your selected scenarios across every outcome at once. Each axis is one goal; farther out usually means a better result for that goal.",
  },
  {
    mode: "equity",
    title: "3. Zoom in with Distribution",
    body: "Pick a single scenario and see how its outcomes are spread across places. Useful for checking who benefits and who does not.",
  },
  {
    mode: "resilience",
    title: "4. Stress-test with Resilience",
    body: "Look across the whole library under different climate futures. Warmer cells mean outcomes that hold up more often.",
  },
  {
    mode: null,
    title: "Build your story",
    body: "When a chart answers part of your question, click the share icon on it. The Share tab lets you combine saved charts into a story with your own notes.",
  },
]

export default function TourOverlay() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()
  const tour = useScenarioExplorerStore((s) => s.tour)
  const endTour = useScenarioExplorerStore((s) => s.endTour)
  const setTourStep = useScenarioExplorerStore((s) => s.setTourStep)
  const setExploreMode = useScenarioExplorerStore((s) => s.setExploreMode)
  const setShowShareDrawer = useScenarioExplorerStore(
    (s) => s.setShowShareDrawer,
  )

  const step = TOUR_STEPS[tour.step]

  useEffect(() => {
    if (!tour.active) return
    if (step?.mode) {
      setExploreMode(step.mode)
    }
  }, [tour.active, tour.step, step, setExploreMode])

  if (!tour.active || !step) return null

  const isLast = tour.step === TOUR_STEPS.length - 1
  const isFirst = tour.step === 0

  const handleNext = () => {
    if (isLast) {
      endTour()
      setShowShareDrawer(true)
      navigateToTab("share")
    } else {
      setTourStep(tour.step + 1)
    }
  }

  const handleBack = () => {
    if (!isFirst) setTourStep(tour.step - 1)
  }

  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.12)",
          pointerEvents: "none",
          zIndex: theme.zIndex.modal - 1,
        }}
      />
      <Box
        role="dialog"
        aria-label="Scenario explorer tour"
        sx={{
          position: "fixed",
          left: "50%",
          bottom: 32,
          transform: "translateX(-50%)",
          zIndex: theme.zIndex.modal,
          width: "min(520px, calc(100vw - 32px))",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          boxShadow: theme.shadows[8],
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            Tour {tour.step + 1} of {TOUR_STEPS.length}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Box
            component="button"
            type="button"
            onClick={endTour}
            aria-label="Close tour"
            sx={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: theme.palette.text.secondary,
              display: "inline-flex",
              alignItems: "center",
              p: 0.25,
              "&:hover": { color: theme.palette.text.primary },
            }}
          >
            <icons.Close sx={{ fontSize: "1.1rem" }} />
          </Box>
        </Box>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: "1rem",
            color: theme.palette.text.primary,
          }}
        >
          {step.title}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: theme.palette.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {step.body}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 0.5,
          }}
        >
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {TOUR_STEPS.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor:
                    i === tour.step
                      ? theme.palette.blue.bright
                      : theme.palette.grey[300],
                }}
              />
            ))}
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            onClick={endTour}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
            }}
          >
            Skip
          </Button>
          {!isFirst && (
            <Button
              size="small"
              onClick={handleBack}
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            onClick={handleNext}
            sx={{ textTransform: "none" }}
          >
            {isLast ? "Open Share" : "Next"}
          </Button>
        </Box>
      </Box>
    </>
  )
}
