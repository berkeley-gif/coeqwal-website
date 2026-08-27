"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { GlossaryTermLink } from "../../../glossary"

export default function DataInDepthPanel() {
  const theme = useTheme()
  const sp = theme.space.component

  return (
    <PanelShell background={theme.palette.nature.forest}>
      <PanelHeading
        title="Data in depth"
        kicker="What are the data behind these key outcomes?"
      />

      <Box sx={{ maxWidth: "50%" }}>
        <Typography variant="body2" color="text.secondary">
          The <GlossaryTermLink>key outcomes</GlossaryTermLink> are calculated
          from other variables that can be explored with the{" "}
          <Typography component="span" variant="body2" fontWeight={600}>
            DATA IN DEPTH
          </Typography>{" "}
          viewer. These variables describe different features of the water
          system, including river flows, water delivery amounts, reservoir and
          groundwater storage levels, and{" "}
          <GlossaryTermLink>salinity</GlossaryTermLink> conditions within the
          Bay-Delta estuary.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: sp.md }}>
          Using the{" "}
          <Typography component="span" variant="body2" fontWeight={600}>
            DATA IN DEPTH
          </Typography>{" "}
          viewer, you can generate plots of these additional outcome variables
          to understand how they vary under different locations, water year
          types, <GlossaryTermLink>management strategies</GlossaryTermLink>, and{" "}
          <GlossaryTermLink>hydroclimates</GlossaryTermLink>.
        </Typography>
      </Box>
    </PanelShell>
  )
}
