"use client"

import { Box, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"
import type { SxProps, Theme } from "@mui/material/styles"

export interface DisplayBlockProps {
  children: React.ReactNode
  /** Override or extend the styles */
  sx?: SxProps<Theme>
  /** Whether to apply text shadow (default: true) */
  textShadow?: boolean
}

/**
 * DisplayBlock - Bordered text block using the text font for comfortable reading.
 */
export function DisplayBlock({
  children,
  sx,
  textShadow = true,
}: DisplayBlockProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        // Responsive width: fixed max on larger screens, full-width on mobile
        // 520px optimizes line length for content sentence wrapping
        maxWidth: { xs: "100%", sm: "520px" },
        width: { xs: "100%", sm: "auto" },
        // Responsive padding: tighter on mobile
        padding: {
          xs: "clamp(24px, 5vw, 36px)",
          sm: theme.space.displayBlock.padding,
        },
        background: "transparent",
        border: theme.border.rule,
        boxSizing: "border-box",
        ...sx,
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: "rgba(255, 255, 255, 0.95)",
          textShadow: textShadow ? theme.textShadow.displayBody : "none",
          margin: 0,
          textAlign: "left",
          // Uses body1 (1.25rem) consistently
        }}
      >
        {children}
      </Typography>
    </Box>
  )
}

export default DisplayBlock
