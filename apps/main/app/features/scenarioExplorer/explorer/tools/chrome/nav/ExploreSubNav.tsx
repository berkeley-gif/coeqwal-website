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
  useTheme,
  alpha,
  HomeIcon,
  ArrowForwardIcon,
  BarChartIcon,
  AdjustIcon,
  AppsIcon,
  GridOnIcon,
  InsightsIcon,
} from "@repo/ui/mui"
import { useWorkspaceSlice, type ExploreMode } from "../../../store"
import { useTabs } from "../../../../../../context/Tabs"
import { useTabNavigation } from "../../../../../../hooks/useTabNavigation"

/**
 * Flow map steps for the curation loop (List -> Radar -> Distribution ->
 * Resilience -> Share) so the sub-nav reads as one journey, not a disconnected tab bar.
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
  showTrailingArrow?: boolean
}

const FLOW: FlowStep[] = [
  {
    mode: "list",
    icon: <HomeIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Home",
    purpose: "Select your scenarios",
    showTrailingArrow: true,
  },
  {
    mode: "bar",
    icon: <BarChartIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Bar",
    purpose: "Compare outcomes side by side",
  },
  {
    mode: "radar",
    icon: <AdjustIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Radar",
    purpose: "Compare tradeoffs",
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
    mode: "data",
    icon: <InsightsIcon sx={{ fontSize: "1.1rem" }} />,
    label: "Data in depth",
    purpose: "Explore underlying data",
  },
]

export default function ExploreSubNav() {
  const theme = useTheme()
  const { state, subNavRef } = useTabs()
  const { activeTab } = state
  const { navigateToTab } = useTabNavigation()

  const { exploreMode, setExploreMode } = useWorkspaceSlice()

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
        py: 4
      }}
    >
      {/* Buttons to the different tools */}
      {FLOW.filter((step) => !step.research || showResearchTools).map(
        (step) => {
          const isShare = step.mode === null
          const active = step.mode !== null && exploreMode === step.mode
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
                  border: step.showTrailingArrow
                    ? "none"
                    : `1px solid ${alpha(
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
              {step.showTrailingArrow && (
                <Box
                  component="span"
                  aria-hidden="true"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    color: alpha(theme.palette.common.white, 0.6),
                  }}
                >
                  <ArrowForwardIcon sx={{ fontSize: "1.1rem" }} />
                </Box>
              )}
            </React.Fragment>
          )
        },
      )}
    </Box>
  )
}
