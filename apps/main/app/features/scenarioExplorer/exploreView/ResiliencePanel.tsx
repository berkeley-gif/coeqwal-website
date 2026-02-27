"use client"

/**
 * ResiliencePanel - Placeholder panel for resilience view
 *
 * Content to be defined. This panel will eventually provide
 * resilience-focused scenario analysis tools.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"

export default function ResiliencePanel() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 320,
        gap: 2,
        p: 4,
        color: theme.palette.text.secondary,
      }}
    >
      <Typography variant="h5" component="h2" sx={{ color: theme.palette.text.primary }}>
        Resilience view
      </Typography>
      <Typography variant="body2" sx={{ maxWidth: "40ch", textAlign: "center", opacity: 0.7 }}>
        Resilience analysis tools are coming soon. This panel will help you
        explore how scenarios perform under climate uncertainty and stress
        conditions.
      </Typography>
    </Box>
  )
}
