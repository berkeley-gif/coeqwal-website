"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoCard } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"

const HYDROCLIMATES = [
  {
    title: "Historical hydroclimate (baseline)",
    description:
      "Temperature, precipitation, and streamflow patterns reflect historical conditions",
  },
  {
    title: "Moderate-dry climate risk",
    description:
      "Warmer and slightly drier conditions (\u22121% runoff change) - 50th percentile level of concern",
  },
  {
    title: "Moderate-wet climate risk",
    description:
      "Warmer and wetter conditions (+7% runoff change) - 44th percentile level of concern",
  },
  {
    title: "High climate risk",
    description:
      "Warmer and much drier conditions (\u22127% runoff change) - 95th percentile level of concern",
  },
  {
    title: "Extreme climate risk",
    description:
      "Much warmer and extremely drier conditions (\u221221% runoff change) - 99th percentile level of concern",
  },
] as const

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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "stretch",
          columnGap: theme.space.section.sm,
          rowGap: sp.lg,
        }}
      >
        {HYDROCLIMATES.map(({ title, description }, i) => (
          <InfoCard
            key={title}
            title={title}
            description={description}
            dimmed={i === 2 || i === 4}
            variant="onDark"
          />
        ))}
      </Box>
    </PanelShell>
  )
}
