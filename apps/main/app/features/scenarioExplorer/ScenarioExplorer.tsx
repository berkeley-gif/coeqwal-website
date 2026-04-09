"use client"

/**
 * ScenarioExplorer. Main scenario exploration interface.
 *
 * Top-level navigation: Get Started | Go to tools
 *
 * All explore modes route through UnifiedToolLayout:
 *   - List mode: no sidebar, ToolToolbar with grid-aligned search/chips
 *   - Other modes: ScenarioSelectionSidebar + ToolToolbar + chart controls
 */

import React, { useState, useCallback, useMemo } from "react"
import {
  Box,
  Typography,
  useTheme,
  PlayArrowIcon,
  ViewListIcon,
  ExploreIcon,
  AdjustIcon,
  AppsIcon,
  InsightsIcon,
  Checkbox,
  FormControlLabel,
} from "@repo/ui/mui"
import GetStartedView from "./getStarted/GetStartedView"
import UnifiedToolLayout from "./components/UnifiedToolLayout"
import ToolToolbar from "./components/ToolToolbar"
import ChartControlsBar from "./components/ChartControlsBar"
import ScenarioSelectionSidebar from "./components/ScenarioSelectionSidebar"
import ShareDrawer from "./components/ShareDrawer"
// import SelectionBanner from "./components/SelectionBanner"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import {
  ComparisonPanel,
  EquityPanel,
  ResiliencePanel,
  RadarPanel,
} from "./exploreView"
import ListView from "./exploreView/ListView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import {
  useScenarioExplorerStore,
  type MainView,
  type ExploreMode,
} from "./store"
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
    icon: <ExploreIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Go to tools",
  },
]

const TOOL_TABS: { mode: ExploreMode; icon: React.ReactNode; label: string }[] =
  [
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

const CHECKBOX_SX = { padding: 0, margin: 0, transform: "scale(0.85)" } as const

export default function ScenarioExplorer() {
  const theme = useTheme()
  const { mainView, setMainView, exploreMode, setExploreMode, showMap } =
    useScenarioExplorerStore()
  const mapMode = useMapMode()

  usePrefetchTiers()

  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  const needsTransparentBg =
    isGetStartedMapMode || (mainView === "explorer" && showMap)

  // Hover coordination (for sidebar ↔ tool panels in non-list modes)
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

  const {
    highlightBaseline,
    setHighlightBaseline,
    showTierZones,
    setShowTierZones,
    dimUnpinned,
    setDimUnpinned,
  } = useScenarioExplorerStore()

  const chartControls = useMemo(() => {
    if (exploreMode === "radar") {
      return (
        <ChartControlsBar>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={highlightBaseline}
                onChange={(e) => setHighlightBaseline(e.target.checked)}
                sx={CHECKBOX_SX}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                highlight current operations
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showTierZones}
                onChange={(e) => setShowTierZones(e.target.checked)}
                sx={CHECKBOX_SX}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                show tier zones
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={dimUnpinned}
                onChange={(e) => setDimUnpinned(e.target.checked)}
                sx={CHECKBOX_SX}
              />
            }
            label={
              <Typography variant="compactCaption" sx={{ ml: 0.5 }}>
                dim unpinned
              </Typography>
            }
            sx={{ mr: 1.5 }}
          />
        </ChartControlsBar>
      )
    }
    return null
  }, [
    exploreMode,
    highlightBaseline,
    setHighlightBaseline,
    showTierZones,
    setShowTierZones,
    dimUnpinned,
    setDimUnpinned,
  ])

  const isListMode = mainView === "explorer" && exploreMode === "list"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        pointerEvents: isGetStartedMapMode ? "none" : "auto",
        ...(isGetStartedMapMode ? {} : { height: "100%", overflow: "hidden" }),
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
          width: "100%",
          height: theme.layout.collapsedTabHeight,
          background: theme.palette.tabPanels.explore,
          fontFamily: theme.typography.nav.fontFamily,
          fontSize: theme.typography.nav.fontSize,
          letterSpacing: theme.typography.nav.letterSpacing,
          lineHeight: 1,
          color: theme.palette.common.white,
          textShadow: "none",
          filter: "none",
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
            {TOOL_TABS.map(({ mode, icon, label }) => {
              const active = exploreMode === mode
              return (
                <Box
                  key={mode}
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
          </>
        )}
      </Box>

      {/* Content area */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          ...(isGetStartedMapMode
            ? {}
            : { overflow: "hidden", pointerEvents: "auto" }),
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            ...(isGetStartedMapMode
              ? {}
              : { overflow: "hidden", pointerEvents: "auto" }),
          }}
        >
          {mainView === "get-started" && <GetStartedView />}

          {mainView === "explorer" && (
            <Box sx={{ flex: 1, overflow: "hidden" }}>
              <UnifiedToolLayout
                sidebar={
                  isListMode ? undefined : (
                    <ScenarioSelectionSidebar
                      hoveredScenarioId={hoveredScenarioId}
                      onRowHover={handleSidebarRowHover}
                    />
                  )
                }
                toolbar={<ToolToolbar gridAligned={isListMode} />}
                chartControls={isListMode ? undefined : chartControls}
              >
                {isListMode && (
                  <ListView
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "radar" && (
                  <RadarPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "equity" && <EquityPanel />}
                {exploreMode === "comparison" && (
                  <ComparisonPanel
                    highlightedIds={highlightedIds}
                    onScenarioHover={handleToolScenarioHover}
                  />
                )}
                {exploreMode === "resilience" && <ResiliencePanel />}
                {exploreMode === "data" && <DataExplorerView />}
              </UnifiedToolLayout>
            </Box>
          )}
        </Box>
      </Box>

      <KeyboardShortcuts />
      {mainView === "explorer" && <ShareDrawer />}
    </Box>
  )
}
