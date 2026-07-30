"use client"

/**
 * DataExplorerView - Explore data in depth for the user's selected scenarios.
 *
 * Hosts the by-variable explorer (sector rail -> variable -> view), which
 * works from the Current Operations reference even before any scenario is
 * selected. The tool header above it is the shared ToolJourneyStrip; the
 * legacy "By category" accordions were retired from this surface with the
 * 2026-07-30 content review (CategoryView remains in the tree for reference).
 */

import React, { useEffect } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { isPerfEnabled, registerPerfGlobal } from "@repo/data/perf"
import ExplorerView from "./explorer/ExplorerView"
import ToolErrorBoundary from "../../../ToolErrorBoundary"

export default function DataExplorerView() {
  const theme = useTheme()

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
          flex: 1,
          overflowY: "auto",
          backgroundColor: theme.palette.background.toolPanel,
        }}
      >
        {/* Left padding only: the explorer's chart column carries its own
            right padding INSIDE its scroll container, so the column's
            scrollbar sits flush at the tool's right edge (List view parity). */}
        <Box
          sx={{ height: "100%", py: { xs: 1, md: 2 }, pl: { xs: 2, md: 4 } }}
        >
          <ToolErrorBoundary tool="data">
            <ExplorerView />
          </ToolErrorBoundary>
        </Box>
      </Box>
    </Box>
  )
}
