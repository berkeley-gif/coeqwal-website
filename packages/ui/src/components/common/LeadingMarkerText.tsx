"use client"

import { Box, Typography } from "@repo/ui/mui"

export interface LeadingMarkerTextProps {
  title: string
  children: React.ReactNode
  /** When true, the body spans full component width (no indent next to the marker) */
  bodySpansFull?: boolean
}

export function LeadingMarkerText({
  title,
  children,
  bodySpansFull = false,
}: LeadingMarkerTextProps) {
  return (
    <Box
      sx={(theme) => ({
        width: 500,
        display: "grid",
        gridTemplateColumns: "48px 1fr",
        gridTemplateRows: "auto auto",
        columnGap: theme.spacing(2),
        rowGap: theme.spacing(1),
        alignItems: "start",
      })}
    >
      {/* Leading marker (accent circle) */}
      <Box
        sx={(theme) => ({
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: theme.palette.ambient.rippleBlue,
          gridColumn: 1,
          gridRow: 1,
          alignSelf: "center",
        })}
      />
      {/* Headline */}
      <Typography variant="h2" sx={{ m: 0, gridColumn: 2 }}>
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
