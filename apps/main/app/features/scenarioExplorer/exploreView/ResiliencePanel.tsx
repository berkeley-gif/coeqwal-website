"use client"

/**
 * ResiliencePanel — Resilience analysis tool content.
 *
 * Sidebar, hydroclimate chooser, and map are handled by the persistent
 * UnifiedToolLayout chrome. This component renders only the tool-specific
 * content area.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"

export default function ResiliencePanel() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        px: theme.space.component.lg,
        py: theme.space.component.lg,
        backgroundColor: theme.palette.grey[100],
        height: "100%",
      }}
    >
      <Typography
        variant="h5"
        component="h2"
        sx={{ color: theme.palette.text.primary }}
      >
        Resilience view
      </Typography>
      <Typography
        variant="body2"
        sx={{
          maxWidth: "40ch",
          textAlign: "center",
          color: theme.palette.text.secondary,
          opacity: 0.7,
          mt: 2,
        }}
      >
        Resilience analysis tools are coming soon. This panel will help you
        explore how scenarios perform under climate uncertainty and stress
        conditions.
      </Typography>
    </Box>
  )
}
