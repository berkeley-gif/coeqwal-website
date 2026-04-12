"use client"

/**
 * ChartControlsBar - Secondary toolbar row for per-chart controls.
 *
 * Renders a "Chart controls" label followed by the controls passed as
 * children. Each panel supplies its own control checkboxes/toggles.
 * Sits between the primary ToolToolbar and the chart content area
 * inside UnifiedToolLayout.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

interface ChartControlsBarProps {
  children: React.ReactNode
}

export default function ChartControlsBar({ children }: ChartControlsBarProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: theme.space.tool.px,
        py: 0.5,
        minHeight: 36,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography
        variant="dashboard"
        sx={{
          fontWeight: 600,
          color: theme.palette.text.primary,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Chart controls
      </Typography>

      <Box
        sx={{
          width: "1px",
          height: 20,
          backgroundColor: theme.palette.divider,
          flexShrink: 0,
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 0.5,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
