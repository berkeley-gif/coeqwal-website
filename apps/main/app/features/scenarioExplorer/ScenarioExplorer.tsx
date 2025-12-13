"use client"

import React from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
import { DashboardPanel } from "@repo/ui"
import { useScenarioExplorerStore, type ExplorerView } from "@repo/state/scenarioExplorer"
import ListView from "./views/ListView/ListView"
import MapView from "./views/MapView/MapView"
import ComparisonView from "./views/ComparisonView/ComparisonView"
// import NeedsBasedView from "./views/NeedsBasedView/NeedsBasedView"
import DataExplorerView from "./views/DataExplorerView/DataExplorerView"
import SelectionBanner from "./components/SelectionBanner"
import SearchBar from "./components/SearchBar"

/**
 * ScenarioExplorer -- Multi-tab version
 *
 * Views:
 * - List: Full list of scenarios with searching/sorting
 * - Map: Location-based performance visualization
 * - Comparison: Visual comparison chart using parallel coordinates
 * - Needs-based: Criteria-based scenario search (commented out)
 * - Data explorer: Detailed data comparison and exports
 */
export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const { activeView, setActiveView } = useScenarioExplorerStore()

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: ExplorerView,
  ) => {
    setActiveView(newValue)
  }

  const viewLabels: Record<ExplorerView, string> = {
    list: "Full list of scenarios",
    map: "Map view",
    comparison: "Scenario comparison chart",
    needs: "Needs-based search", // Hidden from UI but required by type
    data: "Data explorer",
  }

  return (
    <DashboardPanel
      backgroundColor={theme.palette.grey[100]}
      color={theme.palette.text.primary}
      headerHeight={theme.layout.headerHeight}
      includeHeaderSpacing={true}
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
            value={activeView}
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
                marginTop: theme.spacing(1), // Gap from top of container
                marginRight: theme.spacing(0.5), // Small gap between tabs
                paddingLeft: theme.spacing(3),
                paddingRight: theme.spacing(3),
                "&.Mui-selected": {
                  color: theme.palette.blue.bright,
                  fontWeight: theme.typography.fontWeightBold,
                  backgroundColor: `${theme.palette.blue.bright}1A`, // 10% opacity bright blue tint
                },
                "&:hover:not(.Mui-selected)": {
                  color: theme.palette.blue.dark,
                  backgroundColor: `${theme.palette.blue.bright}1A`, // Same blue tint as selected
                },
              },
            }}
          >
            <Tab label={viewLabels.list} value="list" />
            <Tab label={viewLabels.map} value="map" />
            <Tab label={viewLabels.comparison} value="comparison" />
            {/* <Tab label={viewLabels.needs} value="needs" /> */}
            <Tab label={viewLabels.data} value="data" />
          </Tabs>
        </Box>

        {/* Selection Banner */}
        <SelectionBanner />

        {/* Search bar for list, map, and comparison views */}
        {(activeView === "list" ||
          activeView === "map" ||
          activeView === "comparison") && (
          <SearchBar placeholder="Search scenarios by name or description" />
        )}

        {/* View content */}
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
          }}
        >
          {activeView === "list" && <ListView />}
          {activeView === "map" && <MapView />}
          {activeView === "comparison" && <ComparisonView />}
          {/* {activeView === "needs" && <NeedsBasedView />} */}
          {activeView === "data" && <DataExplorerView />}
        </Box>
      </Box>
    </DashboardPanel>
  )
}
