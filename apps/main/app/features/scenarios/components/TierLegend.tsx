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
        bottom: theme.spacing(3),
        right: theme.spacing(3),
        width: "450px",
        maxHeight: "60vh",
        overflowY: "auto",
        backgroundColor: theme.background.whiteOverlay[95],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing(3),
        backdropFilter: "blur(8px)",
        boxShadow: theme.shadow.md,
        zIndex: theme.zIndex.mapControls,
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: theme.typography.fontWeightMedium }}>
          {outcome}
        </Typography>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: theme.typography.subtitle1.fontSize,
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
