"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 *
 * Layout: Tabs span full width at top. Below tabs, a flex row splits into
 * left column (banner, search, content) and right column (comparison chart
 * or map). The right column spans full height below tabs when active.
 */

import React, { useState } from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
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
      {/* Tab navigation — full width */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: theme.zIndex.pageContent,
          flexShrink: 0,
          pointerEvents: "auto",
          backgroundColor: theme.palette.background.paper,
          borderBottom: theme.border.medium,
          px: theme.space.component.xl,
        }}
      >
        <Tabs
          value={mainView}
          onChange={(_e, v: MainView) => setMainView(v)}
          sx={{
            minHeight: theme.spacing(7),
            "& .MuiTabs-indicator": {
              height: 3,
              backgroundColor: theme.palette.blue.bright,
            },
            "& .MuiTab-root": {
              ...theme.typography.body2,
              minHeight: theme.spacing(7),
              textTransform: "none",
              fontWeight: theme.typography.fontWeightMedium,
              color: theme.palette.text.primary,
              transition: theme.transition.default,
              borderTopLeftRadius: theme.shape.borderRadius,
              borderTopRightRadius: theme.shape.borderRadius,
              mt: theme.space.component.sm,
              mr: theme.space.component.xs,
              px: theme.space.component.xl,
              "&.Mui-selected": {
                color: theme.palette.blue.bright,
                fontWeight: theme.typography.fontWeightBold,
                backgroundColor:
                  theme.palette.interaction.selectedBackground,
              },
              "&:hover:not(.Mui-selected)": {
                color: theme.palette.blue.dark,
                backgroundColor:
                  theme.palette.interaction.selectedBackground,
              },
            },
          }}
        >
          <Tab label="Choose scenarios by summary" value="explorer" />
          <Tab label="Explore data in depth" value="data" />
        </Tabs>
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
                rightContent={
                  <ViewModeControls
                    mode={exploreMode}
                    onModeChange={setExploreMode}
                  />
                }
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
              Click on a scenario outcome in the left panel to see outcomes
              at specific locations.
            </InfoOverlay>
          )}
        </Box>
      </Box>

      {/* Global keyboard shortcuts handler */}
      <KeyboardShortcuts />
    </Box>
  )
}
