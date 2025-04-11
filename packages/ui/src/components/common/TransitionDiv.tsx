"use client"

import { Box } from "@mui/material"

interface TransitionDivProps {
  color?: string
  height?: number
  width?: string | number
  sx?: any
}

/**
 * TransitionDiv Component
 * 
 * A simple colored div to create visual transitions between panels.
 * Can be placed between panels on the page level.
 * 
 * @example
 * // Between two panels
 * <FirstPanel />
 * <TransitionDiv color="rgb(154, 203, 207)" height={60} />
 * <SecondPanel />
 */
export function TransitionDiv({ 
  color = "rgb(154, 203, 207)", 
  height = 60,
  width = "100%",
  sx = {}
}: TransitionDivProps) {
  return (
    <Box
      sx={{
        backgroundColor: color,
        height: typeof height === 'number' ? `${height}px` : height,
        width: width,
        display: "block",
        ...sx
      }}
    />
  )
} 