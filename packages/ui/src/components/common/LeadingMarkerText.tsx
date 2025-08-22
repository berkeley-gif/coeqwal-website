"use client"

import { Box, Typography } from "@repo/ui/mui"

export interface LeadingMarkerTextProps {
  title: string
  children: React.ReactNode
  /** When true, the body spans full component width (no indent next to the marker) */
  bodySpansFull?: boolean
  /** Typography variant for the headline (defaults to h2) */
  headlineVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export function LeadingMarkerText({
  title,
  children,
  bodySpansFull = false,
  headlineVariant = "h2",
}: LeadingMarkerTextProps) {
  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        maxWidth: { xs: "100%", md: 600 },
        display: "grid",
        gridTemplateColumns: "48px 1fr",
        gridTemplateRows: "auto auto",
        columnGap: theme.spacing(2),
        rowGap: theme.spacing(1),
        alignItems: "start",
      })}
    >
      {/* Leading marker (accent circle) positioned relative to first line of headline */}
      <Box
        sx={(theme) => {
          // Get the typography variant to calculate line height
          const typography = theme.typography[headlineVariant]

          // Parse fontSize from rem to pixels (assuming 1rem = 16px)
          let fontSize = 16 // default
          if (typeof typography.fontSize === "string") {
            if (typography.fontSize.includes("rem")) {
              fontSize = parseFloat(typography.fontSize) * 16
            } else {
              fontSize = parseFloat(typography.fontSize)
            }
          } else if (typeof typography.fontSize === "number") {
            fontSize = typography.fontSize
          }

          const lineHeight =
            typeof typography.lineHeight === "number"
              ? typography.lineHeight
              : 1.2

          // Calculate the height of the first line in pixels
          const firstLineHeight = fontSize * lineHeight

          // Position circle to center on the first line
          const topOffset = (firstLineHeight - 48) / 2

          return {
            width: 48,
            height: 48,
            borderRadius: "50%",
            backgroundColor: theme.palette.ambient.rippleBlue,
            gridColumn: 1,
            gridRow: 1,
            position: "relative",
            top: Math.max(0, topOffset), // Ensure it doesn't go negative
          }
        }}
      />
      {/* Headline */}
      <Typography variant={headlineVariant} sx={{ m: 0, gridColumn: 2 }}>
        {title}
      </Typography>
      {/* Body */}
      <Box
        sx={{
          gridColumn: bodySpansFull ? "1 / span 2" : 2,
          color: (theme) => theme.palette.text.primary,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default LeadingMarkerText
