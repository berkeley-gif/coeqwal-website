"use client"

/**
 * WelcomeStrip. Inline first-visit orientation rendered above the
 * active tool. Frames the full curation loop as a single journey:
 *
 *   List -> Radar -> Distribution -> Resilience -> Share
 *
 * Each step is clickable and navigates to that tool (or opens the
 * Share tab for the final step), so the strip doubles as a shortcut.
 *
 * Dismissal is two-state: clicking "Got it" hides it for the session
 * only; clicking "Got it" with the "Don't show again" checkbox ticked
 * persists the dismissal across sessions.
 *
 * Mounted inside UnifiedToolLayout so it appears wherever the user
 * first lands, not just on the List.
 */

import React, { useState } from "react"
import {
  Box,
  Typography,
  Button,
  Checkbox,
  useTheme,
  alpha,
  icons,
  ViewListIcon,
  AdjustIcon,
  AppsIcon,
  GridOnIcon,
} from "@repo/ui/mui"
import { useScenarioExplorerStore, type ExploreMode } from "../store"
import { useTabNavigation } from "../../../hooks/useTabNavigation"

interface FlowStep {
  /** Null means the Share tab rather than an explore mode. */
  mode: ExploreMode | null
  label: string
  purpose: string
  icon: React.ReactNode
}

// Mirrors the visible (non-research) steps in ExploreSubNav so the
// strip reads as the same journey the user sees in the dark sub-nav
// above. Keep label + purpose copy in lockstep with that file.
const FLOW: FlowStep[] = [
  {
    mode: "list",
    label: "List",
    purpose: "Shortlist scenarios",
    icon: <ViewListIcon sx={{ fontSize: "1.1rem" }} />,
  },
  {
    mode: "radar",
    label: "Radar",
    purpose: "Compare shapes",
    icon: <AdjustIcon sx={{ fontSize: "1.1rem" }} />,
  },
  {
    mode: "equity",
    label: "Distribution",
    purpose: "See who benefits",
    icon: <AppsIcon sx={{ fontSize: "1.1rem" }} />,
  },
  {
    mode: "resilience",
    label: "Resilience",
    purpose: "Stress-test",
    icon: <GridOnIcon sx={{ fontSize: "1.1rem" }} />,
  },
  {
    mode: null,
    label: "Share",
    purpose: "Save charts + notes",
    icon: <icons.IosShare sx={{ fontSize: "1.1rem" }} />,
  },
]

export default function WelcomeStrip() {
  const theme = useTheme()
  const { navigateToTab } = useTabNavigation()

  const welcomeDismissedPermanently = useScenarioExplorerStore(
    (s) => s.welcomeDismissedPermanently,
  )
  const welcomeDismissedThisSession = useScenarioExplorerStore(
    (s) => s.welcomeDismissedThisSession,
  )
  const dismissWelcome = useScenarioExplorerStore((s) => s.dismissWelcome)
  const setExploreMode = useScenarioExplorerStore((s) => s.setExploreMode)
  const exploreMode = useScenarioExplorerStore((s) => s.exploreMode)

  const [dontShowAgain, setDontShowAgain] = useState(false)

  if (welcomeDismissedPermanently || welcomeDismissedThisSession) return null

  const handleStepClick = (step: FlowStep) => {
    if (step.mode) {
      setExploreMode(step.mode)
    } else {
      navigateToTab("share")
    }
  }

  const handleDismiss = () => {
    dismissWelcome(dontShowAgain)
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
        <Box sx={{ minWidth: 0, maxWidth: 420 }}>
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
            Each row is a scenario, a plan for managing California Central Valley
            water. Pick a few that look interesting and keep reading,
            comparing, and curating. Check the boxes next to the scenarios
            you want to collect into a group that fits your goals.
          </Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            flexWrap: "wrap",
          }}
        >
          {FLOW.map((step, i) => {
            const isActive = step.mode !== null && step.mode === exploreMode
            return (
              <React.Fragment key={step.label}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => handleStepClick(step)}
                  aria-label={`${step.label}: ${step.purpose}`}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 0.9,
                    py: 0.4,
                    border: `1px solid ${
                      isActive
                        ? theme.palette.blue.bright
                        : theme.palette.divider
                    }`,
                    borderRadius: "12px",
                    background: isActive
                      ? alpha(theme.palette.blue.bright, 0.1)
                      : theme.palette.background.paper,
                    color: isActive
                      ? theme.palette.blue.bright
                      : theme.palette.text.primary,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    lineHeight: 1.1,
                    "&:hover": {
                      borderColor: theme.palette.blue.bright,
                      background: alpha(theme.palette.blue.bright, 0.08),
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      color: isActive
                        ? theme.palette.blue.bright
                        : theme.palette.grey[700],
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: 1.1,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.8125rem",
                        fontWeight: isActive ? 700 : 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {step.label}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.6875rem",
                        fontWeight: 400,
                        whiteSpace: "nowrap",
                        color: isActive
                          ? theme.palette.blue.bright
                          : theme.palette.grey[700],
                      }}
                    >
                      {step.purpose}
                    </Box>
                  </Box>
                </Box>
                {i < FLOW.length - 1 && (
                  <icons.ChevronRight
                    aria-hidden
                    sx={{
                      fontSize: "1rem",
                      color: theme.palette.text.disabled,
                      flexShrink: 0,
                    }}
                  />
                )}
              </React.Fragment>
            )
          })}
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            justifyContent: { xs: "space-between", lg: "flex-end" },
          }}
        >
          <Box
            component="label"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            <Checkbox
              size="small"
              checked={dontShowAgain}
              onChange={(_, checked) => setDontShowAgain(checked)}
              sx={{ p: 0.25 }}
            />
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.grey[700],
                fontSize: "0.75rem",
              }}
            >
              Don&rsquo;t show again
            </Typography>
          </Box>
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
