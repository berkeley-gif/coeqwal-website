"use client"

/**
 * TourCardActions - The button row at the bottom of a tour card: Skip
 * (always), Back (hidden on the first step), and the primary Next /
 * Finish button (Finish on the last step). The Next button takes the
 * forwarded ref so the runner can autofocus it on each step.
 */

import React from "react"
import { Box, Button, useTheme } from "@repo/ui/mui"

export interface TourCardActionsProps {
  isFirst: boolean
  isLast: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  nextBtnRef: React.RefObject<HTMLButtonElement | null>
}

export function TourCardActions({
  isFirst,
  isLast,
  onBack,
  onNext,
  onSkip,
  nextBtnRef,
}: TourCardActionsProps) {
  const theme = useTheme()

  // Shared shape for the Skip / Back / Next buttons.
  const actionShape = {
    textTransform: "none" as const,
    fontSize: "0.8125rem",
    minWidth: 88,
    flexShrink: 0,
    borderRadius: 1.5,
  }

  const secondaryButtonSx = {
    ...actionShape,
    color: theme.palette.grey[700],
    borderColor: theme.palette.divider,
    backgroundColor: theme.palette.background.paper,
    "&:hover": {
      borderColor: theme.palette.grey[400],
      backgroundColor: theme.palette.action.hover,
    },
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.75,
        rowGap: 0.75,
        width: "100%",
        minWidth: 0,
      }}
    >
      <Button
        size="small"
        type="button"
        variant="outlined"
        onClick={onSkip}
        sx={secondaryButtonSx}
      >
        Skip
      </Button>
      {!isFirst && (
        <Button
          size="small"
          type="button"
          variant="outlined"
          onClick={onBack}
          sx={secondaryButtonSx}
        >
          Back
        </Button>
      )}
      <Button
        ref={nextBtnRef}
        size="small"
        type="button"
        variant="contained"
        onClick={onNext}
        sx={actionShape}
      >
        {isLast ? "Finish" : "Next"}
      </Button>
    </Box>
  )
}
