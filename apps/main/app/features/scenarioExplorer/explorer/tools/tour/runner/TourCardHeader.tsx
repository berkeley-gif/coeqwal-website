"use client"

/**
 * TourCardHeader - The top row of a tour card: the uppercase eyebrow on
 * the left, a "step n / m" counter, and a close button on the right.
 *
 * `eyebrowId` is attached to the eyebrow only when the step has no title
 * (a title-less step uses its eyebrow as the dialog's accessible name).
 */

import React from "react"
import { Box, Typography, icons, useTheme } from "@repo/ui/mui"

export interface TourCardHeaderProps {
  eyebrow: string
  /** Set only for title-less steps, where the eyebrow names the dialog. */
  eyebrowId?: string
  stepNumber: number
  stepCount: number
  onSkip: () => void
}

export function TourCardHeader({
  eyebrow,
  eyebrowId,
  stepNumber,
  stepCount,
  onSkip,
}: TourCardHeaderProps) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        id={eyebrowId}
        variant="caption"
        sx={{
          color: theme.palette.text.primary,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontWeight: 700,
          fontSize: "0.6875rem",
        }}
      >
        {eyebrow}
      </Typography>
      <Box sx={{ flex: 1 }} />
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.grey[700],
          fontSize: "0.6875rem",
          fontWeight: 500,
        }}
      >
        {stepNumber} / {stepCount}
      </Typography>
      <Box
        component="button"
        type="button"
        onClick={onSkip}
        aria-label="Close tour"
        sx={{
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: theme.palette.grey[700],
          display: "inline-flex",
          alignItems: "center",
          p: 0.25,
          "&:hover": { color: theme.palette.text.primary },
        }}
      >
        <icons.Close sx={{ fontSize: "1.1rem" }} />
      </Box>
    </Box>
  )
}
