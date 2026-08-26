"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { LinedList } from "@repo/ui"
import { GlossaryTermLink } from "../../../glossary"

export default function HydroclimateFuturesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const dropletIcon = <WaterDroplet />

  return (
    <PanelShell background={theme.palette.nature.forest}>
      <PanelHeading title="How are climate change impacts evaluated?" />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: sp.md,
          mb: sp.xl,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          <GlossaryTermLink>COEQWAL</GlossaryTermLink> makes it possible to look
          at how the outcomes of water{" "}
          <GlossaryTermLink term="Management strategies">
            management strategies
          </GlossaryTermLink>{" "}
          change with climate-driven shifts in temperature, precipitation, and
          river flows.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <GlossaryTermLink term="Hydroclimate">Hydroclimates</GlossaryTermLink>{" "}
          are simulations of historical and future conditions that represent
          different levels of stress to our water supply system. COEQWAL
          evaluates all management strategies under five hydroclimate,
          including:
        </Typography>
      </Box>

      <LinedList
        color={theme.palette.text.secondary}
        icon={dropletIcon}
        labelVariant="body2"
        sx={{ mt: sp.sm }}
        items={[
          {
            label:
              "Historical: Temperature, precipitation, and flow patterns reflect historical conditions",
          },
          {
            label:
              "Moderate climate stress: Slightly warmer and moderately wetter conditions (+3.5% flow change)",
          },
          {
            label:
              "Moderate-high climate stress: Moderately warmer with little change in precipitation (-1% flow change)",
          },
          {
            label:
              "High climate stress: Much warmer and moderately drier conditions (-6.5% flow change)",
          },
          {
            label:
              "Extreme climate stress: Much warmer and much drier conditions (-19.2% flow change)",
          },
        ]}
      />

      <Typography variant="body2" color="text.secondary" sx={{ my: sp.lg }}>
        Click here to learn more.
      </Typography>
    </PanelShell>
  )
}
