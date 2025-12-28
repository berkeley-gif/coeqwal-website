"use client"

/**
 * ScenarioExplorer - Main scenario exploration interface
 */

import React, { useState } from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
import { InfoOverlay } from "@repo/ui"
import UnifiedExploreView, { type ExploreMode } from "./exploreView"
import DataExplorerView from "./dataExplorer/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"
import { ViewModeControls } from "./components/ViewModeControls"
import { ComparisonHeader } from "./components/ComparisonHeader"

type MainView = "explorer" | "data"

export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const [mainView, setMainView] = useState<MainView>("explorer")
  const [exploreMode, setExploreMode] = useState<ExploreMode>("list")
  const [highlightedScenario, setHighlightedScenario] = useState<string | null>(null)

  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"

  return (
    <Box
      sx={{
        height: "100%",
        backgroundColor: needsTransparentBg ? "transparent" : theme.palette.explore.background,
        color: theme.palette.text.primary,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: needsTransparentBg ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: theme.zIndex.pageContent,
            flexShrink: 0,
            pointerEvents: "auto",
          }}
        >
          {/* Tab navigation */}
          <Box
            sx={{
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
                    backgroundColor: theme.palette.interaction.selectedBackground,
                  },
                  "&:hover:not(.Mui-selected)": {
                    color: theme.palette.blue.dark,
                    backgroundColor: theme.palette.interaction.selectedBackground,
                  },
                },
              }}
            >
              <Tab label="Choose scenarios by summary" value="explorer" />
              <Tab label="Explore data in depth" value="data" />
            </Tabs>
          </Box>

          <SelectionBanner />

          {/* Search toolbar (explorer view only) */}
          {mainView === "explorer" && (
            <Box sx={{ display: "flex", width: "100%" }}>
              <Box
                sx={{
                  width: exploreMode === "list" ? "100%" : "50%",
                  transition: theme.transition.layout,
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                <SearchBar
                  placeholder="Search scenarios by name or description"
                  rightContent={
                    <ViewModeControls mode={exploreMode} onModeChange={setExploreMode} />
                  }
                />
              </Box>

              {/* Right panel header (map/comparison modes) */}
              {exploreMode !== "list" && (
                <Box
                  sx={{
                    width: "50%",
                    position: "relative",
                    backgroundColor: exploreMode === "map" ? "transparent" : theme.palette.background.paper,
                    borderLeft: exploreMode === "comparison" ? theme.border.medium : "none",
                    borderBottom: exploreMode === "comparison" ? theme.border.medium : "none",
                    pointerEvents: exploreMode === "map" ? "none" : "auto",
                  }}
                >
                  {exploreMode === "map" && (
                    <InfoOverlay right={theme.space.component.lg}>
                      Click on a scenario outcome in the left panel to see outcomes at specific locations.
                    </InfoOverlay>
                  )}
                  {exploreMode === "comparison" && (
                    <ComparisonHeader
                      highlightedScenario={highlightedScenario}
                      onScenarioClick={(id) =>
                        setHighlightedScenario((prev) => (prev === id ? null : id))
                      }
                    />
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            pointerEvents: needsTransparentBg ? "none" : "auto",
          }}
        >
          {mainView === "explorer" && (
            <UnifiedExploreView
              mode={exploreMode}
              highlightedScenario={highlightedScenario}
              onScenarioClick={(id) =>
                setHighlightedScenario((prev) => (prev === id ? null : id))
              }
            />
          )}
          {mainView === "data" && (
            <DataExplorerView onNavigateToExplorer={() => setMainView("explorer")} />
          )}
        </Box>
      </Box>
    </Box>
  )
}
