"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { HYDROCLIMATES } from "../content"

export default function HydroclimateFuturesPanel() {
  const theme = useTheme()
  const sp = theme.space.component

  return (
    <PanelShell background={theme.palette.nature.forest}>
      <PanelHeading
        title="Hydroclimate futures"
        kicker="How are climate change impacts evaluated?"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: theme.space.section.lg,
          rowGap: sp.lg,
          mb: theme.space.section.lg,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          COEQWAL evaluates how the outcomes of different water management
          strategies are affected by alternative hydroclimate futures. We
          specifically evaluate how the outcomes of water management strategies
          change with climate-driven shifts in water supplies and temperature.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          The COEQWAL scenario library evaluates various hydroclimates that
          represent different levels of risk to the water supply system:
        </Typography>
      </Box>

      <InfoCardGrid columns={5}>
        {HYDROCLIMATES.map(({ title, description, dimmed }) => (
          <InfoCard
            key={title}
            title={title}
            description={description}
            dimmed={dimmed}
            variant="onDark"
          />
        ))}
      </InfoCardGrid>
    </PanelShell>
  )
}
