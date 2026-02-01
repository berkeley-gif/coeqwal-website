"use client"

/**
 * AlignedScenarioGrid - Unified grid layout for scenario comparisons
 *
 * Provides consistent column alignment across different visualization types.
 * Used to ensure tier charts and percentile matrices align vertically.
 */

import React from "react"
import { Box, Typography, IconButton, Tooltip, useTheme, icons } from "@repo/ui/mui"

// Layout constants - shared across all aligned components
export const GRID_LAYOUT = {
  labelColumnWidth: 100, // Width of the left label column in pixels
  minCellWidth: 120, // Minimum width per scenario cell
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
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether header should stick to top when scrolling */
  sticky?: boolean
  /** Callback to expand the section in a larger modal view */
  onExpand?: () => void
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `${GRID_LAYOUT.labelColumnWidth}px repeat(${scenarios.length}, 1fr)${onExpand ? " auto" : ""}`,
        gap: 0,
        mb: theme.space.component.lg,
        pb: theme.space.component.md,
        borderBottom: theme.border.light,
        alignItems: "center",
        // Sticky positioning for scroll persistence
        ...(sticky && {
          position: "sticky",
          top: 0,
          backgroundColor: theme.palette.background.paper,
          zIndex: 10,
          pt: theme.space.component.md,
          // Subtle shadow to indicate header is floating
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }),
      }}
    >
      {/* Empty cell for label column */}
      <Box />

      {/* Scenario name headers */}
      {scenarios.map((scenarioId) => (
        <Box
          key={scenarioId}
          sx={{
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

      {/* Expand button */}
      {onExpand && (
        <Tooltip title="Expand view" placement="left">
          <IconButton
            size="small"
            onClick={onExpand}
            aria-label="Expand to larger view"
            sx={{
              ml: theme.space.component.sm,
              color: theme.palette.grey[400],
              "&:hover": {
                color: theme.palette.grey[600],
                backgroundColor: theme.palette.grey[100],
              },
            }}
          >
            <icons.OpenInFull sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
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
}: {
  label: string
  sublabel?: string
  scenarios: string[]
  children: (scenarioId: string, index: number) => React.ReactNode
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `${GRID_LAYOUT.labelColumnWidth}px repeat(${scenarios.length}, 1fr)`,
        gap: 0,
        alignItems: "center",
        mb: theme.space.component.lg,
        minHeight: 80,
        py: theme.space.component.sm,
        borderBottom: `1px solid ${theme.palette.grey[100]}`,
        "&:last-child": {
          borderBottom: "none",
          mb: 0,
        },
      }}
    >
      {/* Label column */}
      <Box
        sx={{
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

      {/* Scenario cells */}
      {scenarios.map((scenarioId, index) => (
        <Box
          key={scenarioId}
          sx={{
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
  )
}

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
