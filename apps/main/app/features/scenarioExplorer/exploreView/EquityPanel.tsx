"use client"

/**
 * EquityPanel — Equity analysis tool content.
 *
 * Sidebar, hydroclimate chooser, and map are handled by the persistent
 * UnifiedToolLayout chrome. This component renders the tool-specific
 * content.
 */

import { Box, Typography, useTheme } from "@repo/ui/mui"

export default function EquityPanel() {
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
        Equity tool
      </Typography>
    </Box>
  )
}
