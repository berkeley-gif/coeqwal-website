"use client"

import React from "react"
import { Box, Typography, useTheme, Button, Tabs, Tab } from "@repo/ui/mui"
import { useScenarioExplorerStore } from "@repo/state"

/**
 * DataExplorerView: Compare detailed data and aggregates
 */
export default function DataExplorerView() {
  const theme = useTheme()
  const { selectedScenarios, resetAll } = useScenarioExplorerStore()
  const [subView, setSubView] = React.useState<"charts" | "aggregates" | "downloads">("charts")

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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: theme.spacing(theme.cards.spacing.standard),
            py: theme.spacing(2),
          }}
        >
          <Typography variant="h6">
            {hasData
              ? `Exploring ${selectedScenarios.length} scenario${selectedScenarios.length !== 1 ? "s" : ""}`
              : "Data Explorer"}
          </Typography>
          {hasData && (
            <Button
              variant="outlined"
              size="small"
              onClick={resetAll}
              sx={{ textTransform: "none" }}
            >
              Clear selection
            </Button>
          )}
        </Box>

        {hasData && (
          <Tabs
            value={subView}
            onChange={(_, newValue) => setSubView(newValue)}
            sx={{
              px: theme.spacing(theme.cards.spacing.standard),
              minHeight: theme.spacing(5),
            }}
          >
            <Tab label="Detailed Charts" value="charts" />
            <Tab label="Aggregates" value="aggregates" />
            <Tab label="Downloads" value="downloads" />
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
            <Button
              variant="contained"
              onClick={() => {
                // TODO: Navigate to list view
              }}
            >
              Go to List View
            </Button>
          </Box>
        ) : (
          // Data view content
          <Box>
            {subView === "charts" && (
              <Typography>TODO: Detailed outcome charts for each scenario</Typography>
            )}
            {subView === "aggregates" && (
              <Typography>TODO: Aggregate statistics and comparisons</Typography>
            )}
            {subView === "downloads" && (
              <Typography>TODO: Data download options</Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

