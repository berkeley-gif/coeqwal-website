"use client"

import React from "react"
import { Box, Tabs, Tab, useTheme } from "@repo/ui/mui"
import { DashboardPanel } from "@repo/ui"
import { useScenarioExplorerStore, type ExplorerView } from "@repo/state"
import Breadcrumbs from "./components/Breadcrumbs"
import ListView from "./views/ListView/ListView"
import MapView from "./views/MapView/MapView"
import ComparisonView from "./views/ComparisonView/ComparisonView"
import NeedsBasedView from "./views/NeedsBasedView/NeedsBasedView"
import DataExplorerView from "./views/DataExplorerView/DataExplorerView"

/**
 * ScenarioExplorer -- Multi-tab version
 * 
 * Views:
 * - List: Full list of scenarios with searching/sorting
 * - Map: Location-based performance visualization
 * - Comparison: Visual comparison chart using parallel coordinates
 * - Needs-based: Criteria-based scenario search
 * - Data explorer: Detailed data comparison and exports
 */
export default function ScenarioExplorerNew() {
  const theme = useTheme()
  const { activeView, setActiveView } = useScenarioExplorerStore()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: ExplorerView) => {
    setActiveView(newValue)
  }

  const viewLabels: Record<ExplorerView, string> = {
    list: "List",
    map: "Map",
    comparison: "Comparison Chart",
    needs: "Needs-Based Search",
    data: "Data Explorer",
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
            sx={{
              minHeight: theme.spacing(7),
              "& .MuiTab-root": {
                minHeight: theme.spacing(7),
                fontSize: theme.typography.body2.fontSize,
                textTransform: "none",
                fontWeight: theme.typography.fontWeightMedium,
                color: theme.palette.text.primary,
                "&.Mui-selected": {
                  color: theme.palette.blue.darkest,
                },
                "&:hover": {
                  color: theme.palette.blue.bright,
                },
              },
            }}
          >
            <Tab label={viewLabels.list} value="list" />
            <Tab label={viewLabels.map} value="map" />
            <Tab label={viewLabels.comparison} value="comparison" />
            <Tab label={viewLabels.needs} value="needs" />
            <Tab label={viewLabels.data} value="data" />
          </Tabs>
        </Box>

        {/* Breadcrumbs (current selections) */}
        <Breadcrumbs />

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
          {activeView === "needs" && <NeedsBasedView />}
          {activeView === "data" && <DataExplorerView />}
        </Box>
      </Box>
    </DashboardPanel>
  )
}

