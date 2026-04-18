"use client"

/**
 * Shared section primitive for the "How to read this chart" modal bodies.
 * Renders a subtitle heading and its body content with consistent spacing.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

interface SectionProps {
  title: string
  children: React.ReactNode
}

export function Section({ title, children }: SectionProps) {
  const theme = useTheme()
  return (
    <Box sx={{ mb: theme.space.component.lg }}>
      <Typography
        variant="subtitle2"
        sx={{
          mb: theme.space.component.xs,
          fontWeight: 600,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      <Box
        sx={{
          color: theme.palette.text.primary,
          "& p": { m: 0, mb: theme.space.component.sm },
          "& p:last-child": { mb: 0 },
          "& ul": {
            m: 0,
            mb: theme.space.component.sm,
            pl: theme.space.component.lg,
          },
          "& ul:last-child": { mb: 0 },
          "& li": { mb: theme.space.component.xs },
          "& li:last-child": { mb: 0 },
          "& strong": { fontWeight: 600 },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default Section
