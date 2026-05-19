"use client"

/**
 * DataExplorerView - Explore data in depth for the user's selected scenarios
 */

import React from "react"
import { Box, Typography, useTheme, Button } from "@repo/ui/mui"
import { useWorkspaceSlice } from "../../../store"
import CategoryView from "./components/CategoryView"

interface DataExplorerViewProps {
  /** Callback to navigate back to explorer view */
  onNavigateToExplorer?: () => void
}

export default function DataExplorerView({
  onNavigateToExplorer,
}: DataExplorerViewProps) {
  const theme = useTheme()
  const { selectedScenarios } = useWorkspaceSlice()

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

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: theme.palette.background.toolPanel,
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
