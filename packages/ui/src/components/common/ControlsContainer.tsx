"use client"

import { Box, useTheme, BoxProps } from "../.."

export interface ControlsContainerProps extends BoxProps {
  children: React.ReactNode
  spacing?: number
}

export function ControlsContainer({
  children,
  spacing = 2,
  sx,
  ...props
}: ControlsContainerProps) {
  const theme = useTheme()

  const controlsStyles = {
    display: "flex",
    gap: theme.spacing(spacing),
    mb: theme.spacing(3),
    paddingLeft: theme.spacing(2),
    ...sx,
  }

  return (
    <Box sx={controlsStyles} {...props}>
      {children}
    </Box>
  )
}
