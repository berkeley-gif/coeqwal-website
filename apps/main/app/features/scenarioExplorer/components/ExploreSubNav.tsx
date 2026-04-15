"use client"

/**
 * ExploreSubNav - Secondary navigation for the Explore tab.
 *
 * Renders the "Get started / Go to tools" primary sub-tabs and, when in
 * explorer mode, the tool sub-tabs (List, Radar chart, etc.).
 *
 * This component lives outside TabPanels in the page shell so it can
 * participate in the sticky stacking alongside SmoothTabs, independent
 * of the panel's overflow behavior.
 */

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  PlayArrowIcon,
  ViewListIcon,
  ExploreIcon,
  AdjustIcon,
  AppsIcon,
  CompareArrowsIcon,
  InsightsIcon,
} from "@repo/ui/mui"
import {
  useScenarioExplorerStore,
  type MainView,
  type ExploreMode,
} from "../store"
import { useTabs } from "../../../context/Tabs"

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

const TOOL_TABS: {
  mode: ExploreMode
  icon: React.ReactNode
  label: string
  research?: boolean
}[] = [
  {
    mode: "list",
    icon: <ViewListIcon sx={{ fontSize: "1.25rem" }} />,
    label: "List",
  },
  {
    mode: "radar",
    icon: <AdjustIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Radar chart",
  },
  {
    mode: "comparison",
    icon: <CompareArrowsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Scenario comparison",
    research: true,
  },
  {
    mode: "equity",
    icon: <AppsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Distribution comparison",
  },
  {
    mode: "data",
    icon: <InsightsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Data in depth",
  },
]

export default function ExploreSubNav() {
  const theme = useTheme()
  const { state, subNavRef } = useTabs()
  const { activeTab } = state

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

  return (
    <Box
      ref={subNavRef}
      role="tablist"
      aria-label="Explore section tabs"
      sx={{
        position: "sticky",
        top: theme.layout.collapsedHeaderHeight + theme.layout.collapsedTabHeight,
        zIndex: theme.zIndex.appBar,
        flexShrink: 0,
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: theme.layout.collapsedTabHeight,
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
              background: active ? "rgba(255,255,255,0.2)" : "transparent",
              color: theme.palette.common.white,
              transition: "background-color 0.15s",
              "&:hover": { background: "rgba(255,255,255,0.15)" },
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

      {mainView === "explorer" && (
        <>
          <Box
            sx={{
              width: "1px",
              height: 20,
              backgroundColor: "rgba(255,255,255,0.35)",
              flexShrink: 0,
              mx: 0.5,
            }}
          />
          <Typography
            component="span"
            sx={{
              fontFamily: theme.typography.tabLabelDocked.fontFamily,
              fontSize: "0.9375rem",
              fontWeight: 500,
              lineHeight: 1,
              whiteSpace: "nowrap",
              color: theme.palette.text.secondary,
              letterSpacing: "0.01em",
              px: 0.5,
            }}
          >
            Select scenarios using key outcomes:
          </Typography>
          {TOOL_TABS.filter((tab) => !tab.research || showResearchTools).map(
            ({ mode, icon, label }) => {
              const active = exploreMode === mode
              return (
                <React.Fragment key={mode}>
                  {mode === "data" && (
                    <Typography
                      component="span"
                      sx={{
                        fontFamily:
                          theme.typography.tabLabelDocked.fontFamily,
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        lineHeight: 1,
                        letterSpacing: "0.01em",
                        whiteSpace: "nowrap",
                        color: theme.palette.text.secondary,
                        px: 0.5,
                      }}
                    >
                      View data for selected scenarios:
                    </Typography>
                  )}
                  <Box
                    component="button"
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setExploreMode(mode)}
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
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
                      color: theme.palette.common.white,
                      transition: "background-color 0.15s",
                      "&:hover": { background: "rgba(255,255,255,0.15)" },
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
                </React.Fragment>
              )
            },
          )}
        </>
      )}
    </Box>
  )
}
