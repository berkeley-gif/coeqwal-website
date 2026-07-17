"use client"

/**
 * DataExplorerView - Explore data in depth for the user's selected scenarios.
 *
 * Two modes, switched by the header toggle:
 *  - "Explorer" (default): the by-variable explorer (sector rail -> variable
 *    -> view), which works from the Current Operations reference even before
 *    any scenario is selected.
 *  - "By category": the original outcome-category accordions, kept reachable
 *    behind the toggle while the tools transition to the new interface.
 */

import React, { useEffect, useState } from "react"
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@repo/ui/mui"
import { isPerfEnabled, registerPerfGlobal } from "@repo/data/perf"
import { useWorkspaceSlice } from "../../../store"
import CategoryView from "./components/CategoryView"
import ExplorerView from "./explorer/ExplorerView"
import ToolErrorBoundary from "../../../ToolErrorBoundary"

type DataMode = "category" | "explorer"

interface DataExplorerViewProps {
  /** Callback to navigate back to explorer view */
  onNavigateToExplorer?: () => void
}

export default function DataExplorerView({
  onNavigateToExplorer,
}: DataExplorerViewProps) {
  const theme = useTheme()
  const { selectedScenarios } = useWorkspaceSlice()
  const [mode, setMode] = useState<DataMode>("explorer")

  // Dev-only (NEXT_PUBLIC_PERF_LOG=1): expose the FE quantile bench for the
  // Playwright driver. Dynamic import keeps the bench out of default bundles.
  useEffect(() => {
    if (!isPerfEnabled() || typeof window === "undefined") return
    registerPerfGlobal()
    void import("./perf/computeBench").then(({ runComputeBench }) => {
      if (window.__coeqwalPerf) {
        window.__coeqwalPerf.bench = (n?: number) => runComputeBench(n ?? 10)
      }
    })
  }, [])

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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: { xs: 3, md: 6 },
          py: 1.5,
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next: DataMode | null) => {
            if (next) setMode(next)
          }}
          aria-label="Data view mode"
        >
          <ToggleButton value="category" sx={{ textTransform: "none", px: 2 }}>
            By category
          </ToggleButton>
          <ToggleButton value="explorer" sx={{ textTransform: "none", px: 2 }}>
            Explorer
          </ToggleButton>
        </ToggleButtonGroup>

        {mode === "category" && !hasData && (
          <Typography
            variant="subtitle2"
            sx={{ color: theme.palette.grey[600] }}
          >
            Select scenarios to explore
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          backgroundColor: theme.palette.background.toolPanel,
        }}
      >
        {mode === "explorer" ? (
          <Box
            sx={{ height: "100%", py: { xs: 1, md: 2 }, px: { xs: 2, md: 4 } }}
          >
            <ToolErrorBoundary tool="data">
              <ExplorerView />
            </ToolErrorBoundary>
          </Box>
        ) : !hasData ? (
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
              and data downloads. Or open the Explorer to browse variables from
              the Current Operations reference.
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
