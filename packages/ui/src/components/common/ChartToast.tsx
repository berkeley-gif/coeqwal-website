"use client"

/**
 * ChartToast - Centered overlay toast for chart empty/guidance states
 *
 * Renders a non-interactive pill overlay centered over its nearest
 * positioned ancestor. Intended for chart panels that need to communicate
 * state to the user (e.g. "Select scenarios…", "Choose axes…").
 *
 * @example
 * <Box sx={{ position: "relative" }}>
 *   <MyChart />
 *   <ChartToast>Select scenarios to see them on the chart</ChartToast>
 * </Box>
 */

import { Box, Typography, useTheme } from "@mui/material"
import type { SxProps, Theme } from "@mui/material"
import type { ReactNode } from "react"

export interface ChartToastProps {
  children: ReactNode
  /** Max width of the pill (default 360) */
  maxWidth?: number
  /** Additional sx overrides on the pill element */
  sx?: SxProps<Theme>
}

export function ChartToast({ children, maxWidth = 360, sx }: ChartToastProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3,
        pointerEvents: "none",
      }}
    >
      <Typography
        component="div"
        variant="compactTitle"
        sx={{
          bgcolor: theme.palette.tabPanels.share,
          color: theme.palette.common.white,
          borderRadius: theme.borderRadius.sm,
          px: 3,
          py: 1.5,
          textAlign: "center",
          maxWidth,
          boxShadow: theme.shadows[4],
          fontWeight: 400,
          ...sx,
        }}
      >
        {children}
      </Typography>
    </Box>
  )
}

export default ChartToast
