"use client"

import type { ReactNode } from "react"
import { Box, Typography, useTheme } from "@mui/material"
import type { BoxProps, SxProps, Theme } from "@mui/material"

export type StorylineOpenerAlignment = "center" | "left"

export interface StorylineOpenerProps extends Omit<BoxProps, "title"> {
  title: ReactNode
  subtitle: ReactNode
  alignment?: StorylineOpenerAlignment
  textShadow?: boolean
  scrollIndicator?: ReactNode
  children?: ReactNode
}

function alignmentSx(alignment: StorylineOpenerAlignment): SxProps<Theme> {
  if (alignment === "left") {
    return {
      position: "absolute",
      left: 0,
      top: "50%",
      width: "100%",
      transform: "translateY(-50%)",
      textAlign: "left",
    }
  }

  return {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "100%",
    transform: "translate(-50%, -50%)",
    textAlign: alignment === "center" ? "center" : "left",
  }
}

export function StorylineOpener({
  title,
  subtitle,
  alignment = "left",
  textShadow = false,
  scrollIndicator,
  children,
  sx,
  ...boxProps
}: StorylineOpenerProps) {
  const theme = useTheme()
  const shadow = textShadow ? theme.textShadow.display : "none"

  return (
    <Box
      component="header"
      role="banner"
      sx={[
        alignmentSx(alignment),
        {
          zIndex: 2,
          pointerEvents: "none",
          boxSizing: "border-box",
          textShadow: shadow,
          [theme.breakpoints.up("md")]: {
            px: "64px",
          },
          [theme.breakpoints.up("lg")]: {
            px: "80px",
          },
          [theme.breakpoints.up("xl")]: {
            px: "110px",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...boxProps}
    >
      <Typography
        variant="h1"
        sx={textShadow ? { textShadow: theme.textShadow.display } : undefined}
      >
        {title}
      </Typography>
      <Typography
        variant="h3"
        gutterBottom
        sx={
          textShadow ? { textShadow: theme.textShadow.displayBody } : undefined
        }
      >
        {subtitle}
      </Typography>
      {children}
      {scrollIndicator && (
        <Box sx={{ width: alignment === "left" ? "fit-content" : "100%" }}>
          {scrollIndicator}
        </Box>
      )}
    </Box>
  )
}
