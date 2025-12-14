"use client"

import React from "react"
import { Box, Typography, useTheme, Button, Tabs, Tab } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state/scenarioExplorer"
import CategoryView from "./components/CategoryView"
import MapView from "./components/MapView"
import TableView from "./components/TableView"

// Map scenario IDs to friendly display names
const getScenarioDisplayName = (scenarioId: string): string => {
  const names: Record<string, string> = {
    s0020: "Current operations",
    s0021: "Current ops without TUCPs",
    s0011: "Current ops with historical ag",
  }
  return names[scenarioId] || scenarioId
}

/**
 * DataExplorerView: Comprehensive outcome exploration
 * Three views:
 * - Category: Organized by outcome type with collapsible sections
 * - Map: Spatial visualization of outcomes
 * - Table: Filterable table of all metrics
 */
export default function DataExplorerView() {
  const theme = useTheme()
  const { selectedScenarios, setActiveView } = useScenarioExplorerStore()
  const [subView, setSubView] = React.useState<"category" | "map" | "table">(
    "category",
  )

  const hasData = selectedScenarios.length > 0

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.palette.grey[100],
      }}
    >
      {/* Header with sub-navigation */}
      <Box
        sx={{
          backgroundColor: theme.palette.common.white,
          borderBottom: theme.border.standard,
          borderColor: theme.palette.grey[300],
        }}
      >
        <Box
          sx={{
            px: theme.spacing(theme.cards.spacing.standard),
            py: theme.spacing(2),
          }}
        >
          <Typography variant="h6" sx={{ mb: hasData ? theme.spacing(1) : 0 }}>
            {hasData
              ? `Exploring ${selectedScenarios.length} scenario${selectedScenarios.length !== 1 ? "s" : ""}`
              : "Data Explorer"}
          </Typography>
          {hasData && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: theme.spacing(1),
              }}
            >
              {selectedScenarios.map((scenarioId) => (
                <Typography
                  key={scenarioId}
                  variant="body2"
                  sx={{
                    px: theme.spacing(1.5),
                    py: theme.spacing(0.5),
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: theme.borderRadius.pill,
                    fontSize: theme.typography.compact.subtitle.fontSize,
                    color: theme.palette.blue.darkest,
                  }}
                >
                  {getScenarioDisplayName(scenarioId)}
                </Typography>
              ))}
            </Box>
          )}
        </Box>

        {hasData && (
          <Tabs
            value={subView}
            onChange={(_, newValue) => setSubView(newValue)}
            sx={{
              px: theme.spacing(theme.cards.spacing.standard),
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
            <Tab label="By category" value="category" />
            <Tab label="By location (map)" value="map" />
            <Tab label="All metrics (table)" value="table" />
          </Tabs>
        )}
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: theme.spacing(theme.cards.spacing.standard),
        }}
      >
        {!hasData ? (
          // Empty state
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              textAlign: "center",
              maxWidth: theme.spacing(60),
              margin: "0 auto",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: theme.spacing(2),
                color: theme.palette.text.primary,
              }}
            >
              Select scenarios to explore
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: theme.spacing(3),
                color: theme.palette.grey[600],
              }}
            >
              Choose scenarios from the List or Map view to access detailed
              charts, aggregate statistics, and data downloads.
            </Typography>
            <Button variant="contained" onClick={() => setActiveView("list")}>
              Go to list view
            </Button>
          </Box>
        ) : (
          // Data view content based on active sub-tab
          <Box sx={{ height: "100%" }}>
            {subView === "category" && <CategoryView />}
            {subView === "map" && <MapView />}
            {subView === "table" && <TableView />}
          </Box>
        )}
      </Box>
    </Box>
  )
}
