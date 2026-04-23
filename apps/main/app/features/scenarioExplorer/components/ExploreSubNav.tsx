"use client"

/**
 * ExploreSubNav - Secondary navigation for the Explore tab.
 *
 * Renders the "Get started / Go to tools" primary sub-tabs and, when in
 * explorer mode, the tool sub-tabs (List, Radar chart, etc.).
 *
 * Rendered inside SmoothTabs as a normal flow child of the sticky
 * container, so it stays pinned without its own sticky positioning.
 */

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  alpha,
  PlayArrowIcon,
  ViewListIcon,
  ExploreIcon,
  AdjustIcon,
  AppsIcon,
  GridOnIcon,
  CompareArrowsIcon,
  icons,
} from "@repo/ui/mui"
import {
  useScenarioExplorerStore,
  type MainView,
  type ExploreMode,
} from "../store"
import { useTabs } from "../../../context/Tabs"
import { useTabNavigation } from "../../../hooks/useTabNavigation"

const MAIN_VIEWS: { view: MainView; icon: React.ReactNode; label: string }[] = [
  {
    view: "get-started",
    icon: <PlayArrowIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Get started",
  },
  {
    view: "explorer",
    icon: <ExploreIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Go to tools",
  },
]

/**
 * Flow map steps. Mirrors the WelcomeStrip's depiction of the curation
 * loop (List -> Radar -> Distribution -> Resilience -> Share) so that
 * the sub-nav reads as the same journey, not a disconnected tab bar.
 *
 * `mode: null` means the final Share step, which switches top-level tab.
 * `research: true` means hidden unless the user toggles research tools.
 */
type FlowStep = {
  mode: ExploreMode | null
  icon: React.ReactNode
  label: string
  purpose: string
  research?: boolean
}

const FLOW: FlowStep[] = [
  {
    mode: "list",
    icon: <ViewListIcon sx={{ fontSize: "1.1rem" }} />,
    label: "List",
    purpose: "Shortlist scenarios",
  },
  {
    mode: "radar",
    icon: <AdjustIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Radar",
    purpose: "Compare tradeoffs",
  },
  {
    mode: "comparison",
    icon: <CompareArrowsIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Comparison",
    purpose: "Side by side",
    research: true,
  },
  {
    mode: "equity",
    icon: <AppsIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Distribution",
    purpose: "See who benefits",
  },
  {
    mode: "resilience",
    icon: <GridOnIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Resilience",
    purpose: "Stress-test",
  },
  {
    mode: null,
    icon: <icons.IosShare sx={{ fontSize: "1.1rem" }} />,
    label: "Share",
    purpose: "Save charts + notes",
  },
]

export default function ExploreSubNav() {
  const theme = useTheme()
  const { state, subNavRef } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()

  const { mainView, setMainView, exploreMode, setExploreMode } =
    useScenarioExplorerStore()

  // Research-only tools hidden by default, toggled with "A" key
  const [showResearchTools, setShowResearchTools] = useState(false)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return
      if (e.key === "a" || e.key === "A") {
        if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          setShowResearchTools((v) => !v)
        }
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  if (activeTab !== "explore") return null

  const navHeight = theme.layout.collapsedTabHeight

  return (
    <Box
      ref={subNavRef}
      role="tablist"
      aria-label="Explore section tabs"
      sx={{
        flexShrink: 0,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: navHeight,
        background: theme.palette.tabPanels.explore,
        lineHeight: 1,
        color: theme.palette.common.white,
        justifyContent: "center",
        gap: 1,
      }}
    >
      {MAIN_VIEWS.map(({ view, icon, label }) => {
        const active = mainView === view
        return (
          <Box
            key={view}
            component="button"
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMainView(view)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.25,
              py: 0.5,
              border: "none",
              borderRadius: theme.borderRadius.sm ?? "4px",
              cursor: "pointer",
              background: active
                ? alpha(theme.palette.common.white, 0.2)
                : "transparent",
              color: theme.palette.common.white,
              transition: "background-color 0.15s",
              "&:hover": {
                background: alpha(theme.palette.common.white, 0.15),
              },
            }}
          >
            {icon}
            <Typography
              component="span"
              variant="dashboard"
              sx={{
                fontWeight: active ? 600 : 500,
                lineHeight: 1,
                whiteSpace: "nowrap",
                color: theme.palette.text.secondary,
              }}
            >
              {label}
            </Typography>
          </Box>
        )
      })}

      {/* Grid container: 0fr collapses to zero width, 1fr reveals. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: mainView === "explorer" ? "1fr" : "0fr",
          transition: "grid-template-columns 0.35s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 1,
            minWidth: 0,
            opacity: mainView === "explorer" ? 1 : 0,
            transition:
              mainView === "explorer" ? "opacity 0.25s 0.15s" : "opacity 0.15s",
          }}
        >
          <Box
            sx={{
              width: "1px",
              height: 20,
              backgroundColor: alpha(theme.palette.common.white, 0.35),
              flexShrink: 0,
              mx: 0.5,
            }}
          />

          {/* Flow map. Same curation journey as the WelcomeStrip, adapted
              to the dark sub-nav background: pills carry label + purpose,
              separated by chevrons. Clicking Share jumps to the top-level
              Share tab; all others switch exploreMode. */}
          {FLOW.filter((step) => !step.research || showResearchTools).map(
            (step, i, visibleFlow) => {
              const isShare = step.mode === null
              const active =
                step.mode !== null && exploreMode === step.mode
              const handleClick = () => {
                if (isShare) {
                  navigateToTab("share")
                } else if (step.mode) {
                  setExploreMode(step.mode)
                }
              }
              return (
                <React.Fragment key={step.label}>
                  <Box
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={handleClick}
                    title={`${step.label}: ${step.purpose}`}
                    aria-label={`${step.label}: ${step.purpose}`}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.6,
                      px: 0.9,
                      py: 0.4,
                      border: `1px solid ${alpha(
                        theme.palette.common.white,
                        active ? 0.7 : 0.3,
                      )}`,
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: active
                        ? alpha(theme.palette.common.white, 0.18)
                        : "transparent",
                      color: theme.palette.common.white,
                      transition: "all 120ms ease",
                      lineHeight: 1.1,
                      "&:hover": {
                        background: alpha(theme.palette.common.white, 0.12),
                        borderColor: alpha(theme.palette.common.white, 0.6),
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        color: theme.palette.common.white,
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
                          fontWeight: active ? 700 : 600,
                          color: theme.palette.common.white,
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
                          color: alpha(theme.palette.common.white, 0.8),
                          whiteSpace: "nowrap",
                        }}
                      >
                        {step.purpose}
                      </Box>
                    </Box>
                  </Box>
                  {i < visibleFlow.length - 1 && (
                    <icons.ChevronRight
                      aria-hidden
                      sx={{
                        fontSize: "1rem",
                        color: alpha(theme.palette.common.white, 0.5),
                        flexShrink: 0,
                      }}
                    />
                  )}
                </React.Fragment>
              )
            },
          )}

        </Box>
      </Box>
    </Box>
  )
}
