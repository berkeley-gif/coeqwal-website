"use client"

/**
 * SectionHeader, the title block that introduces a chart inside a
 * Data in Depth accordion.
 *
 * Renders a strong title (with optional inline adornment) and a
 * description on the line below.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

export interface SectionHeaderProps {
  /** Section title (e.g., "Storage distribution") */
  title: string
  /** Inline element rendered after the title (e.g., a dropdown) */
  titleAdornment?: React.ReactNode
  /** Description below the title. String or ReactNode for tooltips */
  description?: React.ReactNode
}

export function SectionHeader({
  title,
  titleAdornment,
  description,
}: SectionHeaderProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.sm,
        }}
      >
        <Typography
          sx={{
            typography: "sectionTitle",
            color: theme.palette.text.primary,
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        {titleAdornment}
      </Box>
      {description && (
        <Box
          sx={{
            color: theme.palette.grey[700],
            mt: 0.5,
            ...theme.typography.dashboard,
          }}
        >
          {description}
        </Box>
      )}
    </Box>
  )
}

export default SectionHeader
