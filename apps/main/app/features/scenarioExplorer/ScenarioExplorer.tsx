"use client"

import React, { useState } from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
import { DashboardPanel } from "@repo/ui"
import UnifiedExploreView, {
  type ExploreMode,
} from "./views/UnifiedExploreView"
import DataExplorerView from "./views/DataExplorerView/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"

type MainView = "explorer" | "data"

/**
 * ScenarioExplorer
 *
 * Two main views:
 * - Explorer: Unified view with list/map/comparison modes (with smooth transitions)
 * - Data: Detailed data comparison and exports
 *
 * The Explorer view handles its own internal mode switching (list ↔ map ↔ comparison)
 * with animated transitions. The persistent map shows through in map mode.
 */
export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const [mainView, setMainView] = useState<MainView>("explorer")
  const [exploreMode, setExploreMode] = useState<ExploreMode>("list")

  const handleTabChange = (_event: React.SyntheticEvent, newValue: MainView) => {
    setMainView(newValue)
  }

  // Map mode in explorer needs transparent background so persistent map shows through
  const needsTransparentBg = mainView === "explorer" && exploreMode === "map"

  return (
    <DashboardPanel
      backgroundColor={
        needsTransparentBg ? "transparent" : theme.palette.explore.background
      }
      color={theme.palette.text.primary}
      headerHeight={theme.layout.headerHeight}
      includeHeaderSpacing={true}
      panelPadding={{
        desktop: { top: 0, sides: 0, bottom: 0 },
        tablet: { top: 0, sides: 0, bottom: 0 },
        mobile: { top: 0, sides: 0, bottom: 0 },
      }}
      sx={{ pointerEvents: "auto" }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
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
            <Tab label="Explore scenarios" value="explorer" />
            <Tab label="Data explorer" value="data" />
          </Tabs>
        </Box>

        {/* Selection Banner */}
        <SelectionBanner />

        {/* Search bar for explorer view */}
        {mainView === "explorer" && (
          <SearchBar placeholder="Search scenarios by name or description" />
        )}

        {/* View content */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
          }}
        >
          {mainView === "explorer" && (
            <UnifiedExploreView
              mode={exploreMode}
              onModeChange={setExploreMode}
            />
          )}
          {mainView === "data" && <DataExplorerView />}
        </Box>
      </Box>
    </DashboardPanel>
  )
}
