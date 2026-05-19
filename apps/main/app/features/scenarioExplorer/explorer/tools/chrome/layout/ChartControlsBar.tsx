"use client"

/**
 * ChartControlsBar - Secondary toolbar row for unique per-chart controls.
 *
 * Renders a "Chart controls" label followed by the controls passed as
 * children. Each panel supplies its own controls.
 * Sits between the primary ToolToolbar and the chart content area
 * inside UnifiedToolView.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

interface ChartControlsBarProps {
  children: React.ReactNode
}

const ChartControlsBar = React.forwardRef<
  HTMLDivElement,
  ChartControlsBarProps
>(function ChartControlsBar({ children }, ref) {
  const theme = useTheme()

  return (
    <Box
      ref={ref}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: theme.space.tool.px,
        py: 0.5,
        minHeight: 36,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.common.white,
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
          alignSelf: "stretch",
          minHeight: 20,
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
})

export default ChartControlsBar
