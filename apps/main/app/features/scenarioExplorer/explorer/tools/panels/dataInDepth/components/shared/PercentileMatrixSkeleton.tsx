"use client"

/**
 * PercentileMatrixSkeleton - Loading placeholder for matrix visualizations
 *
 * Displays a grey placeholder grid matching the actual chart layout while data
 * is loading. Shows placeholder boxes for each expected row/cell and a centered
 * loading indicator.
 */

import React from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CHART_GRID } from "./ChartGridContext"

interface PercentileMatrixSkeletonProps {
  /** Scenario IDs to create columns for */
  scenarios: string[]
  /** Expected number of data rows */
  rowCount: number
  /** Loading message to display */
  message?: string
  /** Width of the label column (default: 100) */
  labelColumnWidth?: number
}

/**
 * Skeleton loading state for PercentileMatrix charts
 *
 * Renders a placeholder grid matching the expected chart layout:
 * - Label column with grey text placeholders
 * - Chart cells with grey box placeholders
 * - Centered loading spinner with message
 */
export function PercentileMatrixSkeleton({
  scenarios,
  rowCount,
  message = "Loading data...",
  labelColumnWidth = 100,
}: PercentileMatrixSkeletonProps) {
  const theme = useTheme()

  // Match the grid structure from ChartGridProvider
  const gridTemplateColumns = `${labelColumnWidth}px repeat(${scenarios.length}, 1fr)`

  // Row height should match the actual PercentileMatrix row height
  const rowHeight = 160

  // Shared shimmer: a light band sweeps left-to-right across each placeholder
  // to signal that data is on the way. Applied to every placeholder box.
  // The band travels fully off-screen at both ends (±200%) with linear timing,
  // so each loop restarts on an identical (plain) frame with no visible snap.
  // Disabled entirely when the user prefers reduced motion.
  const shimmerSx = {
    backgroundColor: theme.palette.grey[100],
    backgroundImage: `linear-gradient(90deg, transparent 0%, ${theme.palette.grey[300]} 50%, transparent 100%)`,
    backgroundSize: "200% 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "200% 0",
    "@keyframes matrixSkeletonShimmer": {
      "0%": { backgroundPosition: "200% 0" },
      "100%": { backgroundPosition: "-200% 0" },
    },
    animation: "matrixSkeletonShimmer 1.6s linear infinite",
    "@media (prefers-reduced-motion: reduce)": {
      animation: "none",
      backgroundImage: "none",
    },
  }

  return (
    <Box sx={{ position: "relative" }}>
      {/* Grid skeleton */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns,
          gap: `${CHART_GRID.rowGap}px 0`,
          width: "100%",
          opacity: 0.7,
        }}
      >
        {/* Generate placeholder rows */}
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <React.Fragment key={`skeleton-row-${rowIndex}`}>
            {/* Label column placeholder */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.5,
                py: theme.space.component.sm,
              }}
            >
              {/* Main label placeholder */}
              <Box
                sx={{
                  height: 12,
                  width: `${60 + (rowIndex % 3) * 15}%`,
                  borderRadius: theme.borderRadius.xs,
                  ...shimmerSx,
                }}
              />
              {/* Secondary label placeholder (shorter) */}
              <Box
                sx={{
                  height: 10,
                  width: `${40 + (rowIndex % 2) * 10}%`,
                  borderRadius: theme.borderRadius.xs,
                  ...shimmerSx,
                }}
              />
            </Box>

            {/* Chart cell placeholders - one per scenario */}
            {scenarios.map((scenarioId, colIndex) => (
              <Box
                key={`skeleton-cell-${rowIndex}-${colIndex}`}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: theme.space.component.sm,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    maxWidth: 180,
                    height: rowHeight,
                    borderRadius: theme.borderRadius.sm,
                    ...shimmerSx,
                  }}
                />
              </Box>
            ))}
          </React.Fragment>
        ))}
      </Box>

      {/* Loading indicator. Pinned near the top of the visible area (sticky)
          rather than the vertical center, so it stays above the fold even when
          the skeleton grid is tall. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: theme.space.component.md,
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.borderRadius.md,
            px: theme.space.component.lg,
            py: theme.space.component.md,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            pointerEvents: "auto",
          }}
        >
          <CircularProgress size={20} sx={{ color: theme.palette.grey[300] }} />
          <Typography
            variant="compactCaption"
            sx={{
              ml: theme.space.component.md,
              color: theme.palette.grey[400],
            }}
          >
            {message}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default PercentileMatrixSkeleton
