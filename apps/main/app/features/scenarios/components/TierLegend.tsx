/**
 * TierLegend - Tier explanation legend panel
 *
 * Displays tier descriptions for a selected outcome.
 * Used in tooltips and as a standalone legend.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import TierTooltipContent from "../../tooltips/TierTooltipContent"

interface TierLegendProps {
  outcome: string
  onClose: () => void
}

/**
 * TierLegend - Map overlay showing tier definitions
 * Reuses TierTooltipContent in a positioned map overlay
 */
export default function TierLegend({ outcome, onClose }: TierLegendProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "absolute",
        bottom: theme.space.component.xl,
        right: theme.space.component.xl,
        width: "450px",
        maxHeight: "60vh",
        overflowY: "auto",
        backgroundColor: theme.background.whiteOverlay[95],
        borderRadius: theme.borderRadius.md,
        padding: theme.space.component.xl,
        boxShadow: theme.shadow.md,
        zIndex: theme.zIndex.mapControls,
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: theme.space.component.lg }}>
        <Typography variant="subtitle1">
          {outcome}
        </Typography>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            fontSize: theme.typography.subtitle1.fontSize,
            fontFamily: theme.typography.fontFamily,
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
            color: theme.palette.grey[600],
            "&:hover": {
              color: theme.palette.grey[800],
            },
          }}
        >
          ×
        </Box>
      </Box>

      <TierTooltipContent outcome={outcome} showTitle={false} />
    </Box>
  )
}
