"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

/**
 * Placeholder used wherever a section receives a null payload from the API.
 */
export interface NoDataAtThisTimeProps {
  size?: number
  fullWidth?: boolean
  minHeight?: number | string
  label?: string
}

const DEFAULT_LABEL = "No data at this time"

export function NoDataAtThisTime({
  size,
  fullWidth = false,
  minHeight,
  label = DEFAULT_LABEL,
}: NoDataAtThisTimeProps) {
  const theme = useTheme()

  const dimensions: React.CSSProperties = fullWidth
    ? {
        width: "100%",
        minHeight: minHeight ?? 80,
      }
    : {
        width: size ?? 60,
        height: size ?? 60,
      }

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        ...dimensions,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.grey[100],
        borderRadius: theme.borderRadius.md,
        border: theme.border.medium,
      }}
    >
      <Typography
        variant="outcomeLabel"
        sx={{
          color: theme.palette.grey[700],
          textAlign: "center",
          px: theme.space.component.xs,
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}
