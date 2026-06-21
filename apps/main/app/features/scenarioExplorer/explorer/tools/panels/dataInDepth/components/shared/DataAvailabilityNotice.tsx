"use client"

/**
 * DataAvailabilityNotice - amber inline strip warning that the data the user
 * asked for is not available in the current view (for example shortage data
 * that only exists at certain entity levels).
 *
 * Designed to sit inside a ChartGridProvider grid, so it spans all columns.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

export function DataAvailabilityNotice({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: theme.space.component.md,
        py: theme.space.component.sm,
        backgroundColor: "#fef3c7", // amber-100
        borderRadius: theme.borderRadius.sm,
        mb: theme.space.component.sm,
      }}
    >
      <Typography variant="compactCaption" sx={{ color: "#92400e" }}>
        {children}
      </Typography>
    </Box>
  )
}

export default DataAvailabilityNotice
