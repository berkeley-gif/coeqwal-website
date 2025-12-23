"use client"

import React from "react"
import { Box, Typography, useTheme, Button, Tabs, Tab } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "../../store"
import CategoryView from "./components/CategoryView"
import MapView from "./components/MapView"
import TableView from "./components/TableView"

interface DataExplorerViewProps {
  /** Callback to navigate back to explorer view */
  onNavigateToExplorer?: () => void
}

/**
 * DataExplorerView
 *
 * Three sub-views: category, map, table
 */
export default function DataExplorerView({
  onNavigateToExplorer,
}: DataExplorerViewProps) {
  const theme = useTheme()
  const { selectedScenarios } = useScenarioExplorerStore()
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
        backgroundColor: theme.palette.common.white,
      }}
    >
      {/* Header - Only shows when no data (scenarios shown in SelectionBanner above) */}
      {!hasData && (
        <Box
          sx={{
            backgroundColor: theme.palette.common.white,
            borderBottom: theme.border.light,
            px: { xs: 3, md: 6 },
            py: 2,
          }}
        >
          <Typography
            sx={{
              fontSize: theme.typography.compact.caption.fontSize,
              fontWeight: 500,
              letterSpacing: "0.15rem",
              textTransform: "uppercase",
              color: theme.palette.grey[500],
              mb: 1,
            }}
          >
            Data Explorer
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            Select scenarios to explore
          </Typography>
        </Box>
      )}

      {/* Sub-navigation tabs */}
      {hasData && (
        <Box
          sx={{
            backgroundColor: theme.palette.common.white,
            borderBottom: theme.border.light,
            px: { xs: 3, md: 6 },
          }}
        >
          <Tabs
            value={subView}
            onChange={(_, newValue) => setSubView(newValue)}
            TabIndicatorProps={{
              style: {
                height: 2,
                backgroundColor: theme.palette.blue.darkest,
              },
            }}
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                minHeight: 48,
                fontSize: theme.typography.nav.fontSize,
                textTransform: "none",
                fontWeight: 500,
                color: theme.palette.grey[600],
                px: 0,
                mr: 4,
                "&.Mui-selected": {
                  color: theme.palette.blue.darkest,
                },
                "&:hover": {
                  color: theme.palette.blue.darkest,
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
              height: "100%",
              px: { xs: 3, md: 6 },
              py: { xs: 4, md: 6 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.grey[600],
                lineHeight: 1.7,
                mb: 3,
                maxWidth: "400px",
              }}
            >
              Choose scenarios from the Explore tab to access detailed charts,
              aggregate statistics, and data downloads.
            </Typography>

            <Box>
              <Button
                variant="contained"
                onClick={onNavigateToExplorer}
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
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
          // Data view content based on active sub-tab
          <Box sx={{ height: "100%", p: { xs: 2, md: 4 } }}>
            {subView === "category" && <CategoryView />}
            {subView === "map" && <MapView />}
            {subView === "table" && <TableView />}
          </Box>
        )}
      </Box>
    </Box>
  )
}
