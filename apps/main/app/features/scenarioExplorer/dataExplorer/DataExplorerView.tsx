"use client"

import React from "react"
import { Box, Typography, useTheme, Button } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../store"
import CategoryView from "./components/CategoryView"
// Hidden for now
// import MapView from "./components/MapView"
// import TableView from "./components/TableView"

interface DataExplorerViewProps {
  /** Callback to navigate back to explorer view */
  onNavigateToExplorer?: () => void
}

/**
 * DataExplorerView
 *
 * Displays outcome data by category. Map and table views are hidden for now.
 */
export default function DataExplorerView({
  onNavigateToExplorer,
}: DataExplorerViewProps) {
  const theme = useTheme()
  const { selectedScenarios } = useScenarioExplorerStore()

  const hasData = selectedScenarios.length > 0

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header - Only shows when no data (scenarios shown in SelectionBanner above) */}
      {!hasData && (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: theme.border.light,
            px: { xs: 3, md: 6 },
            py: 2,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Select scenarios to explore
          </Typography>
        </Box>
      )}

      {/* Sub-navigation tabs 
      {hasData && (
        <Box
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderBottom: theme.border.light,
            px: { xs: 3, md: 6 },
          }}
        >
          <Tabs
            value={subView}
            onChange={(_, newValue) => setSubView(newValue)}
            slotProps={{
              indicator: {
                style: {
                  height: 2,
                  backgroundColor: theme.palette.text.primary,
                },
              },
            }}
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                textTransform: "none",
                ...theme.typography.dashboard,
                fontWeight: 500,
                color: theme.palette.grey[500],
                px: 0,
                mr: theme.space.section.sm,
                "&.Mui-selected": {
                  color: theme.palette.text.primary,
                },
                "&:hover": {
                  color: theme.palette.text.primary,
                },
              },
            }}
          >
            <Tab label="By category" value="category" />
            <Tab label="By location" value="map" />
            <Tab label="All metrics" value="table" />
          </Tabs>
        </Box>
      )}
        */}

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: theme.palette.grey[50],
        }}
      >
        {!hasData ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              px: { xs: 3, md: 6 },
              py: { xs: 4, md: 6 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                textAlign: "center",
                mb: theme.space.section.sm,
                maxWidth: theme.layout.maxWidth.md,
              }}
            >
              Choose scenarios to access detailed charts, aggregate statistics,
              and data downloads.
            </Typography>

            <Box>
              <Button
                variant="contained"
                onClick={onNavigateToExplorer}
                sx={{
                  textTransform: "none",
                  fontWeight: theme.typography.fontWeightMedium,
                  backgroundColor: theme.palette.blue.darkest,
                  "&:hover": {
                    backgroundColor: theme.palette.blue.dark,
                  },
                }}
              >
                Choose scenarios
              </Button>
            </Box>
          </Box>
        ) : (
          // Category view content
          <Box
            sx={{ height: "100%", py: { xs: 1, md: 2 }, px: { xs: 2, md: 4 } }}
          >
            <CategoryView />
          </Box>
        )}
      </Box>
    </Box>
  )
}
