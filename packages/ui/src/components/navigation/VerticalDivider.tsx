"use client"

import { Box } from "@mui/material"
import { useTheme, Theme } from "@mui/material/styles"

interface VerticalDividerProps {
  /**
   * The horizontal position where the divider should start.
   * Can be a fixed value or a function that receives the theme and returns a value.
   */
  left: number | string | ((theme: Theme) => number | string)
  /** Optional top position override. Default is headerHeight from theme. */
  top?: number | string
  /** Optional color override. Default is theme's divider color. */
  color?: string
  /** If true, the divider will transition its position with animation */
  animated?: boolean
  /** Optional z-index. Default is above drawer. */
  zIndex?: number
}

/**
 * A vertical divider line that can be positioned precisely
 * Commonly used to create vertical separations between content areas
 */
export function VerticalDivider({
  left,
  top,
  color,
  animated = true,
  zIndex,
}: VerticalDividerProps) {
  const theme = useTheme()

  // Calculate top position and height based on provided values or theme defaults
  const topPosition = top ?? theme.layout.headerHeight
  const heightCalc = `calc(100vh - ${typeof topPosition === "number" ? topPosition : theme.layout.headerHeight}px)`

  // Resolve the left position if it's a function
  const leftPosition = typeof left === "function" ? left(theme) : left

  return (
    <Box
      sx={{
        position: "fixed",
        top: topPosition,
        left: leftPosition,
        width: "1px",
        height: heightCalc,
        backgroundColor: color ?? theme.palette.divider,
        ...(animated && {
          transition: theme.transitions.create("left", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }),
        zIndex: zIndex ?? theme.zIndex.drawer + 1,
        pointerEvents: "none",
      }}
    />
  )
}
