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
 * DisplayBlock - Clean body text for hero and frontmatter panels.
 *
 * No container, no border. Standard readable paragraphs with
 * optional <strong> for emphasis within the text.
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
        maxWidth: { xs: "100%", sm: "520px" },
        width: { xs: "100%", sm: "auto" },
        ...sx,
      }}
    >
      <Typography
        sx={{
          fontFamily: theme.typography.fontFamily,
          fontSize: "1.4rem",
          fontWeight: 400,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "rgba(255, 255, 255, 0.82)",
          textShadow: textShadow ? theme.textShadow.displayBody : "none",
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          margin: 0,
          textAlign: "left",
          "& strong, & b": {
            fontWeight: 600,
          },
        }}
      >
        {children}
      </Typography>
    </Box>
  )
}

export default DisplayBlock
