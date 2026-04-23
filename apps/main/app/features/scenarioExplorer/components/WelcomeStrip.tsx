"use client"

/**
 * WelcomeStrip. Inline first-visit orientation rendered above the
 * active tool. Frames how to read the list view and what to do with
 * it. The List -> Radar -> Distribution -> Resilience -> Share flow
 * is intentionally not duplicated here; it lives in ExploreSubNav.
 *
 * Clicking "Got it" hides the strip for the current session only.
 *
 * Mounted inside UnifiedToolLayout, only on the List view.
 */

import React from "react"
import { Box, Typography, Button, useTheme, alpha } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"

export default function WelcomeStrip() {
  const theme = useTheme()

  const welcomeDismissedPermanently = useScenarioExplorerStore(
    (s) => s.welcomeDismissedPermanently,
  )
  const welcomeDismissedThisSession = useScenarioExplorerStore(
    (s) => s.welcomeDismissedThisSession,
  )
  const dismissWelcome = useScenarioExplorerStore((s) => s.dismissWelcome)

  if (welcomeDismissedPermanently || welcomeDismissedThisSession) return null

  const handleDismiss = () => {
    dismissWelcome(false)
  }

  return (
    <Box
      role="region"
      aria-label="Welcome to the scenario explorer"
      sx={{
        flexShrink: 0,
        px: 2,
        py: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.blue.bright,
          0.06,
        )} 0%, ${theme.palette.background.paper} 70%)`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "center" },
          gap: { xs: 1.5, lg: 2.5 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: "0.9375rem",
              fontWeight: 600,
              color: theme.palette.text.primary,
              lineHeight: 1.3,
              mb: 0.25,
            }}
          >
            Compare scenarios for California water
          </Typography>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              color: theme.palette.text.primary,
              lineHeight: 1.45,
            }}
          >
            Each row is a scenario, a plan for managing California Central
            Valley water. Pick a few that look interesting and keep reading,
            comparing, and curating. Check the boxes next to the scenarios
            you want to collect into a group that fits your goals.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
            justifyContent: { xs: "flex-end", lg: "flex-end" },
            pt: { xs: 0, lg: 0.25 },
          }}
        >
          <Button
            size="small"
            variant="contained"
            onClick={handleDismiss}
            sx={{
              textTransform: "none",
              fontSize: "0.8125rem",
              px: 1.5,
            }}
          >
            Got it
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
