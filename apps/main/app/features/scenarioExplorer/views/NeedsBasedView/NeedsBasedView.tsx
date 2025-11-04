"use client"

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"

/**
 * NeedsBasedView - Criteria-based scenario search
 * TODO: Implement form interface for setting outcome requirements
 * Users can specify "I need X outcome > Y value" and see matching scenarios
 */
export default function NeedsBasedView() {
  const theme = useTheme()

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.grey[100],
        p: theme.spacing(theme.cards.spacing.standard),
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: theme.spacing(2),
          color: theme.palette.text.primary,
        }}
      >
        Needs-Based Search
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.grey[600],
          textAlign: "center",
          maxWidth: theme.spacing(60),
        }}
      >
        Coming soon: Set explicit outcome criteria and find scenarios that meet
        your specific needs.
      </Typography>
    </Box>
  )
}
