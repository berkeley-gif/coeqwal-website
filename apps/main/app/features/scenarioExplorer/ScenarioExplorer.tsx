"use client"

import React, { useState } from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
import AboutScenariosView from "./views/AboutScenariosView"
import UnifiedExploreView, {
  type ExploreMode,
} from "./views/UnifiedExploreView"
import DataExplorerView from "./views/DataExplorerView/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"

type MainView = "about" | "explorer" | "data"

/**
 * ScenarioExplorer
 *
 * Three main views:
 * - About: Introduction explaining COEQWAL scenarios, the tier system, and outcomes
 * - Explorer: Unified view with list/map/comparison modes (with smooth transitions)
 * - Data: Detailed data comparison and exports
 *
 * The Explorer view handles its own internal mode switching (list ↔ map ↔ comparison)
 * with animated transitions. The persistent map shows through in map mode.
 */
export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const [mainView, setMainView] = useState<MainView>("about")
  const [exploreMode, setExploreMode] = useState<ExploreMode>("list")

  const handleTabChange = (_event: React.SyntheticEvent, newValue: MainView) => {
    setMainView(newValue)
  }

  // Map mode in explorer needs transparent background so persistent map shows through
  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"

  return (
    <Box
      sx={{
        // Fill the parent container (TabPanel sets height for explore tab)
        height: "100%",
        backgroundColor: needsTransparentBg
          ? "transparent"
          : theme.palette.explore.background,
        color: theme.palette.text.primary,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Allow map panning through when in map mode
        pointerEvents: needsTransparentBg ? "none" : "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          // Allow map panning through when in map mode
          pointerEvents: needsTransparentBg ? "none" : "auto",
        }}
      >
        {/* Header section - sticky to stay visible */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            flexShrink: 0,
            pointerEvents: "auto", // Keep header interactive even when parent is "none"
          }}
        >
          {/* Tab Navigation */}
          <Box
            sx={{
              backgroundColor: theme.palette.common.white,
              borderBottom: theme.border.standard,
              borderColor: theme.palette.grey[300],
              px: theme.spacing(theme.cards.spacing.standard),
            }}
          >
            <Tabs
            value={mainView}
            onChange={handleTabChange}
            TabIndicatorProps={{
              style: {
                height: 3,
                backgroundColor: theme.palette.blue.bright,
              },
            }}
            sx={{
              minHeight: theme.spacing(7),
              "& .MuiTab-root": {
                minHeight: theme.spacing(7),
                fontSize: theme.typography.body2.fontSize,
                textTransform: "none",
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.text.primary,
                transition: "all 0.2s ease-in-out",
                borderTopLeftRadius: theme.shape.borderRadius,
                borderTopRightRadius: theme.shape.borderRadius,
                marginTop: theme.spacing(1),
                marginRight: theme.spacing(0.5),
                paddingLeft: theme.spacing(3),
                paddingRight: theme.spacing(3),
                "&.Mui-selected": {
                  color: theme.palette.blue.bright,
                  fontWeight: theme.typography.fontWeightBold,
                  backgroundColor: `${theme.palette.blue.bright}1A`,
                },
                "&:hover:not(.Mui-selected)": {
                  color: theme.palette.blue.dark,
                  backgroundColor: `${theme.palette.blue.bright}1A`,
                },
              },
            }}
          >
            <Tab label="About COEQWAL scenarios" value="about" />
            <Tab label="Explore scenarios" value="explorer" />
            <Tab label="Data explorer" value="data" />
          </Tabs>
          </Box>

          {/* Selection Banner - only show when exploring data */}
          {(mainView === "explorer" || mainView === "data") && <SelectionBanner />}

          {/* Search bar for explorer view */}
          {mainView === "explorer" && (
            <SearchBar placeholder="Search scenarios by name or description" />
          )}
        </Box>

        {/* View content */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            // Allow map panning through when in map mode (UnifiedExploreView handles its own pointer events)
            pointerEvents: needsTransparentBg ? "none" : "auto",
          }}
        >
          {mainView === "about" && <AboutScenariosView />}
          {mainView === "explorer" && (
            <UnifiedExploreView
              mode={exploreMode}
              onModeChange={setExploreMode}
            />
          )}
          {mainView === "data" && <DataExplorerView />}
        </Box>
      </Box>
    </Box>
  )
}
