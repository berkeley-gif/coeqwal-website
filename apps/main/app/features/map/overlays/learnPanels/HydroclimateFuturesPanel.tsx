"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { LinedList } from "@repo/ui"

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
          COEQWAL specifically evaluates how the outcomes of water management
          strategies change with climate-driven shifts in temperature,
          precipitation, and river flows.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Hydroclimates are represented by historical conditions and four
          possible futures, representing different levels of stress to our water
          supply system that we should plan for.
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
              "Historical hydroclimate: Temperature, precipitation, and streamflow patterns reflect historical conditions",
          },
          {
            label:
              "Moderate climate stress: Slightly warmer and wetter conditions (+7% runoff change)",
          },
          {
            label:
              "Moderate-high climate stress: Warmer and slightly drier conditions (-1% runoff change)",
          },
          {
            label:
              "High climate stress: Much warmer and much drier conditions (-7% runoff change)",
          },
          {
            label:
              "Extreme climate stress: Warmer and substantially drier conditions (-19% runoff change)",
          },
        ]}
      />

      <Typography variant="body2" color="text.secondary" sx={{ my: sp.lg }}>
        Click here to learn more.
      </Typography>
    </PanelShell>
  )
}
