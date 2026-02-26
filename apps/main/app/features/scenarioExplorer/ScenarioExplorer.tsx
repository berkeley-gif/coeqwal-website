"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 *
 * Layout: Tabs span full width at top. Below tabs, a flex row splits into
 * left column (banner, search, content) and right column (comparison chart
 * or map). The right column spans full height below tabs when active.
 */

import React, { useState } from "react"
import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
  icons,
  ViewListIcon,
  CompareArrowsIcon,
  AppsIcon,
} from "@repo/ui/mui"
import Image from "next/image"
import ListPanel from "./exploreView"
import { ComparisonPanel, EquityPanel } from "./exploreView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { ViewModeControls } from "./components/ViewModeControls"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { useScenarioExplorerStore, type ExploreMode } from "./store"

export default function ScenarioExplorerNew() {
  const theme = useTheme()

  // Get state and actions from store
  const { mainView, setMainView, exploreMode, setExploreMode } =
    useScenarioExplorerStore()

  // Local UI state (modal open/close is component-specific)
  const [isListExpanded, setIsListExpanded] = useState(false)

  // Layout helpers
  const needsTransparentBg =
    mainView === "explorer" &&
    (exploreMode === "map" || exploreMode === "equity")
  const needsSplit = mainView === "explorer" && exploreMode !== "list"
  // Equity mode has panel on left, map on right (opposite of other split modes)
  const isEquityMode = mainView === "explorer" && exploreMode === "equity"

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
      {/* Tab navigation — styled to match main SmoothTabs (Learn/Explore/Share) */}
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
          width: "100%",
        }}
      >
        {/* "Choose scenarios" tab with inline view mode icons */}
        {/* Uses div (not button) because it contains clickable icon children */}
        <Box
          role="tab"
          aria-selected={mainView === "explorer"}
          tabIndex={mainView === "explorer" ? 0 : -1}
          onClick={() => setMainView("explorer")}
          sx={{
            flex: 1,
            position: "relative",
            padding: "8px 20px",
            border: "none",
            background: theme.palette.explore.background,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 600,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            textTransform: "capitalize",
            color: theme.palette.blue.darkest,
            transition: "opacity 0.15s ease",
            opacity: mainView === "explorer" ? 1 : 0.7,
            "&:hover": {
              opacity: 1,
            },
          }}
        >
          Choose scenarios
          {/* View mode icons — only when this tab is selected */}
          {mainView === "explorer" && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                {
                  mode: "list" as ExploreMode,
                  icon: <ViewListIcon sx={{ fontSize: "1.2rem" }} />,
                  tip: "List view",
                },
                {
                  mode: "map" as ExploreMode,
                  icon: (
                    <Image
                      src="/images/icons/map.svg"
                      alt="Map view"
                      width={18}
                      height={18}
                      style={{ opacity: exploreMode === "map" ? 1 : 0.5 }}
                    />
                  ),
                  tip: "Map view",
                },
                {
                  mode: "comparison" as ExploreMode,
                  icon: <CompareArrowsIcon sx={{ fontSize: "1.2rem" }} />,
                  tip: "Comparison view",
                },
                {
                  mode: "equity" as ExploreMode,
                  icon: <AppsIcon sx={{ fontSize: "1.2rem" }} />,
                  tip: "Equity tool",
                },
              ].map(({ mode, icon, tip }) => (
                <Tooltip key={mode} title={tip} arrow>
                  <Box
                    component="span"
                    role="button"
                    tabIndex={0}
                    aria-label={tip}
                    onClick={() => setExploreMode(mode)}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      cursor: "pointer",
                      color:
                        exploreMode === mode
                          ? theme.palette.blue.bright
                          : theme.palette.blue.darkest,
                      opacity: exploreMode === mode ? 1 : 0.5,
                      backgroundColor:
                        exploreMode === mode
                          ? theme.palette.interaction.selectedBackground
                          : theme.palette.common.white,
                      transition: "opacity 0.15s, background-color 0.15s",
                      "&:hover": {
                        opacity: 1,
                        backgroundColor:
                          theme.palette.interaction.selectedBackground,
                      },
                    }}
                  >
                    {icon}
                  </Box>
                </Tooltip>
              ))}
            </Box>
          )}
        </Box>

        {/* "Explore data in depth" tab */}
        <Box
          component="button"
          role="tab"
          aria-selected={mainView === "data"}
          tabIndex={mainView === "data" ? 0 : -1}
          onClick={() => setMainView("data")}
          sx={{
            flex: 1,
            position: "relative",
            padding: "8px 20px",
            border: "none",
            background: theme.palette.share.background,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: 600,
            fontSize: "1.3rem",
            lineHeight: 1.1,
            textTransform: "capitalize",
            color: theme.palette.blue.darkest,
            transition: "opacity 0.15s ease",
            opacity: mainView === "data" ? 1 : 0.7,
            "&:hover": {
              opacity: 1,
            },
          }}
        >
          Explore data in depth
        </Box>
      </Box>

      {/* Below tabs: flex row with left/right columns */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Left column — comparison panel, equity panel, or empty for map */}
        <Box
          sx={{
            // Equity mode: 2/3 width, other split modes: 50%
            width: isEquityMode ? "66.67%" : needsSplit ? "50%" : "0%",
            transition: theme.transition.layout,
            overflow: "hidden",
            backgroundColor:
              exploreMode === "comparison" || exploreMode === "equity"
                ? theme.palette.grey[100]
                : "transparent",
            pointerEvents: exploreMode === "map" ? "none" : "auto",
          }}
        >
          {exploreMode === "comparison" && <ComparisonPanel />}
          {exploreMode === "equity" && <EquityPanel />}
        </Box>

        {/* Right column — scenario list, search, banner (or map area for equity) */}
        <Box
          sx={{
            // Equity mode: 1/3 width for map, other split modes: 50%
            width: isEquityMode ? "33.33%" : needsSplit ? "50%" : "100%",
            transition: theme.transition.layout,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderLeft:
              needsSplit && !isEquityMode ? theme.border.medium : "none",
            pointerEvents: isEquityMode ? "none" : "auto",
            // For equity mode, this side is transparent for the map
            backgroundColor: isEquityMode ? "transparent" : undefined,
          }}
        >
          {/* Hide selection banner and content in equity mode (map shows here) */}
          {!isEquityMode && (
            <>
              <SelectionBanner />

              {/* Search toolbar (explorer view only, not in equity mode) */}
              {mainView === "explorer" && (
                <Box
                  sx={{
                    flexShrink: 0,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <SearchBar
                    placeholder="Search scenarios by name or description"
                    inputMaxWidth={needsSplit ? "165px" : "330px"}
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
              <Box
                sx={{
                  flex: 1,
                  overflow: "hidden",
                }}
              >
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
                {mainView === "data" && (
                  <DataExplorerView
                    onNavigateToExplorer={() => setMainView("explorer")}
                  />
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Global keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </Box>
  )
}
