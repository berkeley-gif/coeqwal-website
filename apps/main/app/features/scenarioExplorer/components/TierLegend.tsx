import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import TierTooltipContent, {
  getOutcomeDisplayLabel,
} from "./TierTooltipContent"

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
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderRadius: theme.borderRadius.rounded,
        padding: theme.spacing(3),
        backdropFilter: "blur(8px)",
        boxShadow: theme.boxShadows.prominent,
        zIndex: 1000,
      }}
    >
      {/* Header with close button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
          {getOutcomeDisplayLabel(outcome)}
        </Typography>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: "1.25rem",
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

      {/* Reuse shared tooltip content */}
      <TierTooltipContent outcome={outcome} showTitle={false} />
    </Box>
  )
}
