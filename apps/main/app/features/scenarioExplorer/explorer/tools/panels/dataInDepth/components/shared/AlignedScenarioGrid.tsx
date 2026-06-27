"use client"

/**
 * AlignedScenarioGrid - Unified grid layout for scenario comparisons
 *
 * Provides consistent column alignment across different visualization types.
 * Used to ensure tier charts and percentile matrices align vertically.
 *
 * This module provides two sets of components:
 * 1. Original flexbox-based (ScenarioHeader, AlignedRow) - for standalone use
 * 2. CSS Grid-based (GridScenarioHeader, GridRow) - for use within ChartGridProvider
 */

import React from "react"
import { Box, Typography, Button, useTheme, icons } from "@repo/ui/mui"
import { CHART_GRID, useChartGridLayout } from "./ChartGridContext"

// Layout constants - shared across all aligned components (legacy, kept for compatibility)
export const GRID_LAYOUT = {
  labelColumnWidth: CHART_GRID.labelColumnWidth,
  minCellWidth: CHART_GRID.minCellWidth,
  maxCellWidth: CHART_GRID.maxCellWidth,
  headerHeight: 40, // Height of the scenario header row
}

interface AlignedScenarioGridProps {
  /** Scenario IDs in display order */
  scenarios: string[]
  /** Map of scenario ID to display name */
  scenarioNames: Record<string, string>
  /** Whether to show the scenario header row */
  showHeader?: boolean
  /** Children components */
  children: React.ReactNode
}

/**
 * ScenarioHeader - Header row showing scenario names
 */
export function ScenarioHeader({
  scenarios,
  scenarioNames,
  sticky = false,
  onExpand,
  maxCellWidth = GRID_LAYOUT.maxCellWidth,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether header should stick to top when scrolling */
  sticky?: boolean
  /** Callback to expand the section in a larger modal view */
  onExpand?: () => void
  /** Maximum width per scenario cell (for alignment with charts) */
  maxCellWidth?: number
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        mb: theme.space.component.sm,
        pb: theme.space.component.xs,
        // Sticky positioning for scroll persistence
        ...(sticky && {
          position: "sticky",
          top: 0,
          backgroundColor: theme.palette.background.paper,
          zIndex: 10,
          // Subtle shadow to indicate header is floating
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }),
      }}
    >
      {/* Expand button row - above scenario headers */}
      {onExpand && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: theme.space.component.xs,
          }}
        >
          <Button
            variant="text"
            size="small"
            onClick={onExpand}
            startIcon={<icons.OpenInFull sx={{ fontSize: 16 }} />}
            sx={{
              color: theme.palette.grey[500],
              textTransform: "none",
              ...theme.typography.dashboard,
              fontWeight: 500,
              px: theme.space.component.md,
              "&:hover": {
                color: theme.palette.grey[700],
                backgroundColor: theme.palette.grey[100],
              },
            }}
          >
            Expand
          </Button>
        </Box>
      )}

      {/* Layout: label column + evenly distributed scenario cells */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Fixed-width label column spacer */}
        <Box sx={{ width: GRID_LAYOUT.labelColumnWidth, flexShrink: 0 }} />

        {/* Scenario names container - spread evenly with max cell width */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          {scenarios.map((scenarioId) => (
            <Box
              key={scenarioId}
              sx={{
                flex: "0 1 auto",
                width: maxCellWidth,
                textAlign: "center",
                px: theme.space.component.sm,
              }}
            >
              <Typography
                variant="dashboard"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                  fontFeatureSettings: "'tnum' 1",
                }}
              >
                {scenarioNames[scenarioId] || scenarioId}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

/**
 * AlignedRow - A single row in the aligned grid
 */
export function AlignedRow({
  label,
  sublabel,
  scenarios,
  children,
  maxCellWidth = GRID_LAYOUT.maxCellWidth,
}: {
  label: string
  sublabel?: string
  scenarios: string[]
  children: (scenarioId: string, index: number) => React.ReactNode
  /** Maximum width per scenario cell (for alignment with charts) */
  maxCellWidth?: number
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: theme.space.component.md,
        minHeight: 80,
        py: theme.space.component.xs,
        "&:last-child": {
          mb: 0,
        },
      }}
    >
      {/* Label column */}
      <Box
        sx={{
          width: GRID_LAYOUT.labelColumnWidth,
          flexShrink: 0,
          pr: theme.space.component.lg,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="dashboard"
          sx={{
            display: "block",
            fontWeight: 500,
            color: theme.palette.text.primary,
          }}
        >
          {label}
        </Typography>
        {sublabel && (
          <Typography
            variant="compactMicro"
            sx={{
              display: "block",
              color: theme.palette.grey[400],
              mt: 0.25,
              textTransform: "lowercase",
            }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>

      {/* Scenario cells - spread evenly with max cell width */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "space-evenly",
        }}
      >
        {scenarios.map((scenarioId, index) => (
          <Box
            key={scenarioId}
            sx={{
              flex: "0 1 auto",
              width: maxCellWidth,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              px: theme.space.component.xs,
            }}
          >
            {children(scenarioId, index)}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

// =============================================================================
// CSS Grid-based components (for use within ChartGridProvider)
// =============================================================================

/**
 * GridScenarioHeader - Scenario names that align with CSS Grid columns
 *
 * Must be used within a ChartGridProvider. Renders directly as grid cells.
 */
export function GridScenarioHeader({
  scenarios,
  scenarioNames,
  onExpand,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Callback to expand the section in a larger modal view */
  onExpand?: () => void
}) {
  const theme = useTheme()

  return (
    <>
      {/* Label column - contains expand button if provided */}
      <Box
        sx={{
          gridColumn: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: onExpand ? "flex-end" : "flex-start",
          pr: 1,
        }}
      >
        {onExpand && (
          <Button
            variant="text"
            size="small"
            onClick={onExpand}
            startIcon={<icons.OpenInFull sx={{ fontSize: 16 }} />}
            sx={{
              color: theme.palette.grey[400],
              textTransform: "none",
              minWidth: "auto",
              px: theme.space.component.sm,
              "&:hover": {
                color: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[100],
              },
            }}
          >
            Expand
          </Button>
        )}
      </Box>

      {/* Scenario name cells */}
      {scenarios.map((scenarioId, index) => (
        <Box
          key={scenarioId}
          sx={{
            gridColumn: index + 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 1,
            px: theme.space.component.sm,
          }}
        >
          <Typography
            variant="axisLabel"
            sx={{
              color: theme.palette.blue.darkest,
              textAlign: "center",
              fontFeatureSettings: "'tnum' 1",
            }}
          >
            {scenarioNames[scenarioId] || scenarioId}
          </Typography>
        </Box>
      ))}
    </>
  )
}

/**
 * GridRow - A row of content that aligns with CSS Grid columns
 *
 * Must be used within a ChartGridProvider. Renders directly as grid cells.
 */
export function GridRow({
  label,
  sublabel,
  scenarios,
  children,
}: {
  label?: string
  sublabel?: string
  scenarios: string[]
  children: (scenarioId: string, index: number) => React.ReactNode
}) {
  const theme = useTheme()
  const layout = useChartGridLayout()

  // Calculate min height based on chart size
  const minHeight = layout ? layout.chartSize + 16 : 96

  return (
    <>
      {/* Label column */}
      <Box
        sx={{
          gridColumn: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight,
          pr: theme.space.component.md,
        }}
      >
        {label && (
          <Typography
            variant="dashboard"
            sx={{
              display: "block",
              fontWeight: 500,
              color: theme.palette.text.primary,
            }}
          >
            {label}
          </Typography>
        )}
        {sublabel && (
          <Typography
            variant="compactMicro"
            sx={{
              display: "block",
              color: theme.palette.grey[400],
              mt: 0.25,
              textTransform: "lowercase",
            }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>

      {/* Content cells */}
      {scenarios.map((scenarioId, index) => (
        <Box
          key={scenarioId}
          sx={{
            gridColumn: index + 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight,
          }}
        >
          {children(scenarioId, index)}
        </Box>
      ))}
    </>
  )
}

/**
 * GridSpanRow - A row that spans all scenario columns (for full-width content like matrices)
 *
 * Must be used within a ChartGridProvider.
 */
export function GridSpanRow({
  label,
  sublabel,
  children,
}: {
  label?: string
  sublabel?: string
  children: React.ReactNode
}) {
  const theme = useTheme()

  return (
    <>
      {/* Label column */}
      <Box
        sx={{
          gridColumn: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          pt: 1,
          pr: theme.space.component.md,
        }}
      >
        {label && (
          <Typography
            variant="smallSectionLabel"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </Typography>
        )}
        {sublabel && (
          <Typography
            variant="compactMicro"
            sx={{
              display: "block",
              color: theme.palette.grey[400],
              mt: 0.25,
            }}
          >
            {sublabel}
          </Typography>
        )}
      </Box>

      {/* Content spans all scenario columns */}
      <Box sx={{ gridColumn: "2 / -1" }}>{children}</Box>
    </>
  )
}

// =============================================================================
// Legacy flexbox-based components (for standalone use without ChartGridProvider)
// =============================================================================

/**
 * AlignedScenarioGrid - Container with consistent grid structure
 */
export default function AlignedScenarioGrid({
  scenarios,
  scenarioNames,
  showHeader = true,
  children,
}: AlignedScenarioGridProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        boxShadow: theme.shadow.subtle,
        p: theme.space.component.lg,
      }}
    >
      {showHeader && (
        <ScenarioHeader scenarios={scenarios} scenarioNames={scenarioNames} />
      )}
      {children}
    </Box>
  )
}
