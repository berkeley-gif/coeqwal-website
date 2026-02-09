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
} from "@repo/ui/mui"
import Image from "next/image"
import { InfoOverlay } from "@repo/ui"
import UnifiedExploreView, { type ExploreMode } from "./exploreView"
import { ComparisonPanel } from "./exploreView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { ViewModeControls } from "./components/ViewModeControls"
import KeyboardShortcuts from "./components/KeyboardShortcuts"

type MainView = "explorer" | "data"

export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const [mainView, setMainView] = useState<MainView>("explorer")
  const [exploreMode, setExploreMode] = useState<ExploreMode>("list")
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(
    null,
  )
  // Pinned scenario appears at top of list when clicked in comparison chart
  const [pinnedScenarioId, setPinnedScenarioId] = useState<string | null>(null)
  // Expand modal for list view (lifted from ListView)
  const [isListExpanded, setIsListExpanded] = useState(false)
  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"
  const needsSplit = mainView === "explorer" && exploreMode !== "list"

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
            background: theme.palette.empower.background,
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
        {/* Left column */}
        <Box
          sx={{
            width: needsSplit ? "50%" : "100%",
            transition: theme.transition.layout,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: needsSplit ? theme.border.medium : "none",
            pointerEvents: "auto",
          }}
        >
          <SelectionBanner />

          {/* Search toolbar (explorer view only) */}
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
              <UnifiedExploreView
                mode={exploreMode}
                pinnedScenarioId={pinnedScenarioId}
                isExpanded={isListExpanded}
                onCloseExpand={() => setIsListExpanded(false)}
                modalToolbar={
                  <SearchBar
                    placeholder="Search scenarios by name or description"
                    rightContent={<ViewModeControls />}
                  />
                }
              />
            )}
            {mainView === "data" && (
              <DataExplorerView
                onNavigateToExplorer={() => setMainView("explorer")}
              />
            )}
          </Box>
        </Box>

        {/* Right column — full height below tabs */}
        <Box
          sx={{
            width: needsSplit ? "50%" : "0%",
            transition: theme.transition.layout,
            overflow: "hidden",
            backgroundColor:
              exploreMode === "comparison"
                ? theme.palette.grey[100]
                : "transparent",
            pointerEvents: exploreMode === "map" ? "none" : "auto",
          }}
        >
          {exploreMode === "comparison" && (
            <ComparisonPanel
              highlightedScenario={highlightedScenario}
              onScenarioClick={(id) => {
                setHighlightedScenario((prev) => (prev === id ? null : id))
                // Bring clicked scenario to top of list
                setPinnedScenarioId(id)
              }}
            />
          )}
          {exploreMode === "map" && (
            <InfoOverlay right={theme.space.component.lg}>
              Click on a scenario outcome in the left panel to see outcomes at
              specific locations.
            </InfoOverlay>
          )}
        </Box>
      </Box>

      {/* Global keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </Box>
  )
}
