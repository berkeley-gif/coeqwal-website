"use client"

/**
 * ScenarioExplorer.Main scenario exploration interface.
 *
 * Top-level navigation: Get Started | Go to tools
 *
 * When mainView === "explorer", renders UnifiedToolLayout with:
 *   - Persistent sidebar (ScenarioSelectionSidebar)
 *   - Shared toolbar (ToolToolbar)
 *   - Swappable tool content (Grid / Tradeoffs / Equity / Resilience)
 *   - Optional map panel (toggled from toolbar)
 */

import React, { useState, useCallback } from "react"
import {
  Box,
  Typography,
  useTheme,
  PlayArrowIcon,
  ViewListIcon,
} from "@repo/ui/mui"
import GetStartedView from "./getStarted/GetStartedView"
import UnifiedToolLayout from "./components/UnifiedToolLayout"
import ToolToolbar from "./components/ToolToolbar"
import ScenarioSelectionSidebar from "./components/ScenarioSelectionSidebar"
import ShareDrawer from "./components/ShareDrawer"
// import SelectionBanner from "./components/SelectionBanner"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { ComparisonPanel, EquityPanel, ResiliencePanel } from "./exploreView"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import { useScenarioExplorerStore, type MainView } from "./store"
import { useMapMode } from "../map/store"
import { usePrefetchTiers } from "./hooks/usePrefetchTiers"

// Top-level navigation tabs

const MAIN_VIEWS: { view: MainView; icon: React.ReactNode; label: string }[] = [
  {
    view: "get-started",
    icon: <PlayArrowIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Get started",
  },
  {
    view: "explorer",
    icon: <ViewListIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Go to tools",
  },
]

// Component

export default function ScenarioExplorer() {
  const theme = useTheme()
  const { mainView, setMainView, exploreMode, showMap } =
    useScenarioExplorerStore()
  const mapMode = useMapMode()

  usePrefetchTiers()

  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  const needsTransparentBg =
    isGetStartedMapMode || (mainView === "explorer" && showMap)

  // Hover coordination
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null)
  const [hoveredScenarioId, setHoveredScenarioId] = useState<string | null>(
    null,
  )

  const handleSidebarRowHover = useCallback((ids: string[] | null) => {
    setHighlightedIds(ids ? new Set(ids) : null)
  }, [])

  const handleToolScenarioHover = useCallback((scenarioId: string | null) => {
    setHoveredScenarioId(scenarioId)
  }, [])

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        pointerEvents: isGetStartedMapMode ? "none" : "auto",
      }}
    >
      {/* Tab navigation */}
      <Box
        role="tablist"
        aria-label="Explore section tabs"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: theme.zIndex.pageContent,
          flexShrink: 0,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-evenly",
          width: "100%",
          height: theme.layout.collapsedTabHeight,
          background: theme.palette.tabPanels.explore,
          ...theme.typography.nav,
          lineHeight: 1,
          color: theme.palette.common.white,
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
                textShadow: "none",
                transition: "background-color 0.15s",
                "&:hover": { background: "rgba(255,255,255,0.15)" },
              }}
            >
              {icon}
              <Typography
                component="span"
                variant="subtitle2"
                sx={{
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                  color: "inherit",
                  textShadow: "none",
                }}
              >
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      {/* Content area */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          pointerEvents: isGetStartedMapMode ? "none" : "auto",
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          {mainView === "get-started" && <GetStartedView />}

          {mainView === "explorer" && (
            <>
              {/* <SelectionBanner /> */}
              <Box sx={{ flex: 1, overflow: "hidden" }}>
                <UnifiedToolLayout
                  sidebar={
                    <ScenarioSelectionSidebar
                      hoveredScenarioId={hoveredScenarioId}
                      onRowHover={handleSidebarRowHover}
                    />
                  }
                  toolbar={<ToolToolbar />}
                >
                  {exploreMode === "list" && (
                    <ListView
                      highlightedIds={highlightedIds}
                      onScenarioHover={handleToolScenarioHover}
                    />
                  )}
                  {exploreMode === "comparison" && (
                    <ComparisonPanel
                      highlightedIds={highlightedIds}
                      onScenarioHover={handleToolScenarioHover}
                    />
                  )}
                  {exploreMode === "equity" && <EquityPanel />}
                  {exploreMode === "resilience" && <ResiliencePanel />}
                  {exploreMode === "data" && <DataExplorerView />}
                </UnifiedToolLayout>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && <ShareDrawer />}
    </Box>
  )
}
