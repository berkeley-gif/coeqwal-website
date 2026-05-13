"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import PanelShell from "./PanelShell"

export default function DataInDepthPanel() {
  const theme = useTheme()
  const sp = theme.space.component

  return (
    <PanelShell background={theme.palette.nature.forest}>
      <Typography
        variant="h3"
        component="h2"
        color="text.secondary"
        sx={{ maxWidth: "66%", mb: sp.sm }}
      >
        Data in depth
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          maxWidth: "66%",
          mb: theme.space.section.lg,
          opacity: 0.85,
        }}
      >
        What are the data behind these key outcomes?
      </Typography>

      <Box sx={{ maxWidth: "50%" }}>
        <Typography variant="body2" color="text.secondary">
          The key outcomes are calculated from additional variables that
          can be viewed in the{" "}
          <Typography component="span" variant="body2" fontWeight={600}>
            DATA IN DEPTH
          </Typography>{" "}
          section. These describe different features of the water system,
          including river flows, water delivery amounts, reservoir and
          groundwater storage levels, and salinity conditions within the
          Bay-Delta estuary.
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: sp.md }}
        >
          Using the{" "}
          <Typography component="span" variant="body2" fontWeight={600}>
            DATA IN DEPTH
          </Typography>{" "}
          tool, you can generate summaries and plots of these different
          outcome variables to explore how they vary over space and time
          for different scenarios.
        </Typography>
      </Box>
    </PanelShell>
  )
}
