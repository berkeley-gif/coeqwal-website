"use client"

import React from "react"
import { Box, Switch, Typography, useTheme } from "@repo/ui/mui"
import TourTierLegend from "../../../../tour/reusableContent/TourTierLegend"

/**
 * List tour: top visual block for the map step.
 *
 * Two stacked sections inside one panel:
 *   1. A live-looking `Show map` switch so the copy's "Turn on Show
 *      map" reads back as a recognizable control.
 *   2. The compact tier legend, showing how the map colors map back
 *      to the bar cells.
 *
 * Framing matches `BarIllustration`: warm off-white panel (same as
 * unhighlighted scenario rows), hairline border, small uppercase
 * eyebrows. The switch here is decorative. Click handlers are omitted
 * so the illustration can't mutate app state (the tour runner already
 * drives the real switch when the step is active).
 */
export default function MapLegend() {
  const theme = useTheme()

  const eyebrowSx = {
    display: "block",
    color: theme.palette.grey[700],
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1,
    textAlign: "center" as const,
  }

  return (
    <Box
      component="figure"
      sx={{
        m: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1.5,
        bgcolor: "#faf8f5",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography component="span" sx={eyebrowSx}>
          Show map toggle
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          <Typography
            component="span"
            variant="dashboard"
            sx={{
              fontWeight: 500,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap",
            }}
          >
            Show map
          </Typography>
          <Switch
            size="small"
            checked
            readOnly
            inputProps={{
              "aria-label": "Show map switch sample",
              tabIndex: -1,
            }}
            sx={{ ml: -0.5, pointerEvents: "none" }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Typography component="span" sx={eyebrowSx}>
          Tiers
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "inline-block" }}>
            <TourTierLegend bare compact />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
