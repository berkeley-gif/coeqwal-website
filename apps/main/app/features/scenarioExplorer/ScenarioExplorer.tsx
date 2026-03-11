"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 *
 */

import React, { useState } from "react"
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
  icons,
  ViewListIcon,
  MapIcon,
  CompareArrowsIcon,
  AppsIcon,
  AutorenewIcon,
  InsightsIcon,
  PlayArrowIcon,
} from "@repo/ui/mui"
import { MobileModal } from "@repo/ui"
import ListPanel from "./exploreView"
import { ComparisonPanel, EquityPanel, ResiliencePanel } from "./exploreView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import GetStartedView from "./getStarted/GetStartedView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { ViewModeControls } from "./components/ViewModeControls"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { useScenarioExplorerStore, type ExploreMode } from "./store"
import { useMapMode } from "../map/store"
import { SIDEBAR_WIDTH } from "./components/ScenarioSelectionSidebar"

// px value of theme.space.section.sm (= 3 * 8px = 24px) used in the modal
// title row. The divider must be placed at SIDEBAR_WIDTH - TITLE_ROW_PX so it
// lands directly above the sidebar/chart border in the content area below.
const TITLE_ROW_PX = 24

// ─── View mode button definitions ────────────────────────────────────────────

const VIEW_MODES: {
  mode: ExploreMode | "data" | "get-started"
  icon: React.ReactNode
  label: string
}[] = [
  {
    mode: "get-started",
    icon: <PlayArrowIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Get started",
  },
  {
    mode: "list",
    icon: <ViewListIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Scenario list",
  },
  {
    mode: "map",
    icon: <MapIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Map tool",
  },
  {
    mode: "comparison",
    icon: <CompareArrowsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Tradeoffs tool",
  },
  {
    mode: "equity",
    icon: <AppsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Equity tool",
  },
  {
    mode: "resilience",
    icon: <AutorenewIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Resilience tool",
  },
  {
    mode: "data",
    icon: <InsightsIcon sx={{ fontSize: "1.25rem" }} />,
    label: "Explore data in depth",
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScenarioExplorerNew() {
  const theme = useTheme()

  const { mainView, setMainView, exploreMode, setExploreMode } =
    useScenarioExplorerStore()
  const mapMode = useMapMode()

  const [isListExpanded, setIsListExpanded] = useState(false)

  // Map explore mode: panel retracts to 50%, map fills right half
  const isMapExploreMode = mainView === "explorer" && exploreMode === "map"
  // Get-started map mode: full-width but transparent so persistent map shows through
  const isGetStartedMapMode =
    mainView === "get-started" && mapMode === "get-started"
  // Either mode needs the outer container to be transparent
  const needsTransparentBg = isMapExploreMode || isGetStartedMapMode

  // Analysis modal is open when an analysis mode is active
  const isAnalysisMode =
    mainView === "explorer" &&
    (exploreMode === "comparison" ||
      exploreMode === "equity" ||
      exploreMode === "resilience")

  const closeAnalysisModal = () => setExploreMode("list")

  return (
    <Box
      sx={{
        height: "100%",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: needsTransparentBg ? "none" : "auto",
      }}
    >
      {/* ── Tab navigation ─────────────────────────────────────────────────── */}
      <Box
        component="div"
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
        {VIEW_MODES.map(({ mode, icon, label }) => {
          const isTopLevel = mode === "data" || mode === "get-started"
          const active = isTopLevel
            ? mainView === mode
            : exploreMode === mode && mainView === "explorer"
          return (
            <Box
              key={mode}
              component="button"
              onClick={() => {
                if (isTopLevel) {
                  setMainView(mode as "data" | "get-started")
                } else {
                  setMainView("explorer")
                  setExploreMode(mode as ExploreMode)
                }
              }}
              aria-pressed={active}
              aria-label={label}
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
                "&:hover": {
                  background: "rgba(255,255,255,0.15)",
                },
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

      {/* ── Content area (always full-width list + map behind) ─────────────── */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Content column — full-width normally, retracts to left half in map mode */}
        <Box
          sx={{
            width: isMapExploreMode ? "50%" : "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: isMapExploreMode
              ? theme.palette.explore.background
              : "transparent",
            pointerEvents: "auto",
            transition: "width 0.3s ease",
          }}
        >
          {mainView !== "get-started" && <SelectionBanner />}

          {/* Search toolbar (explorer view only) */}
          {mainView === "explorer" && (
            <Box
              sx={{
                flexShrink: 0,
                backgroundColor: theme.palette.background.paper,
                pointerEvents: "auto",
              }}
            >
              <SearchBar
                placeholder="Search scenarios by name or description"
                leftContent={
                  <Tooltip title="Expand" arrow>
                    <IconButton
                      size="small"
                      onClick={() => setIsListExpanded(true)}
                      sx={{
                        color: theme.palette.grey[500],
                        "&:hover": {
                          color: theme.palette.grey[700],
                          backgroundColor: "rgba(0,0,0,0.04)",
                        },
                      }}
                    >
                      <icons.OpenInFull sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                }
                rightContent={<ViewModeControls />}
              />
            </Box>
          )}

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            {mainView === "explorer" && (
              <ListPanel
                isExpanded={isListExpanded}
                onCloseExpand={() => setIsListExpanded(false)}
                modalToolbar={
                  <>
                    <SelectionBanner />
                    <SearchBar
                      placeholder="Search scenarios by name or description"
                      rightContent={<ViewModeControls />}
                    />
                  </>
                }
              />
            )}
            {mainView === "get-started" && <GetStartedView />}
            {mainView === "data" && (
              <DataExplorerView
                onNavigateToExplorer={() => setMainView("explorer")}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* ── Analysis view modal ─────────────────────────────────────────────── */}
      <MobileModal
        open={isAnalysisMode}
        onClose={closeAnalysisModal}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              mr: -1,
            }}
          >
            {/* Tool name — fixed width aligns the divider with the sidebar border */}
            <Box sx={{ width: SIDEBAR_WIDTH - TITLE_ROW_PX, flexShrink: 0 }}>
              <Typography
                variant="overline"
                sx={{ color: theme.palette.text.primary }}
              >
                {exploreMode === "comparison"
                  ? "Tradeoffs tool"
                  : exploreMode === "equity"
                    ? "Equity tool"
                    : "Resilience tool"}
              </Typography>
            </Box>

            {/* Vertical divider — lands above the sidebar/chart border */}
            <Divider orientation="vertical" flexItem sx={{ mr: 1 }} />

            {/* View mode buttons — same style as the "Filter scenarios" nav */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                flex: 1,
                overflow: "hidden",
              }}
            >
              {VIEW_MODES.filter(
                (v) => v.mode !== "data" && v.mode !== "get-started",
              ).map(({ mode, icon, label }) => {
                const active = exploreMode === mode
                return (
                  <Box
                    key={mode}
                    component="button"
                    onClick={() => setExploreMode(mode as ExploreMode)}
                    aria-pressed={active}
                    aria-label={label}
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
                        ? theme.palette.interaction.selectedBackground
                        : "transparent",
                      color: active
                        ? theme.palette.blue.bright
                        : theme.palette.blue.darkest,
                      opacity: active ? 1 : 0.55,
                      textShadow: "none",
                      transition: "opacity 0.15s, background-color 0.15s",
                      "&:hover": {
                        opacity: 1,
                        background:
                          theme.palette.interaction.selectedBackground,
                      },
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
                        textShadow: "none",
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        }
        denseTitle
        noPadding
        noContentScroll
        subHeader={<SelectionBanner />}
        maxWidth="90vw"
        maxHeight="90vh"
        height="90vh"
      >
        {exploreMode === "comparison" && <ComparisonPanel />}
        {exploreMode === "equity" && <EquityPanel />}
        {exploreMode === "resilience" && <ResiliencePanel />}
      </MobileModal>

      {/* Global keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </Box>
  )
}
