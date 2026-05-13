"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoCard } from "@repo/ui"
import PanelShell from "./PanelShell"
import { usePanelRoute } from "../../../../hooks/usePanelRoute"

const WATER_ISSUE_THEMES = [
  {
    title: "Community water systems",
    description:
      "Whether people and communities can reliably access safe drinking water for daily life, health, and essential services",
    themeKey: "cws",
  },
  {
    title: "Farms and groundwater",
    description:
      "Whether agricultural water deliveries can sustain food production, while preventing over-draft of groundwater basins",
    themeKey: "ag_gw",
  },
  {
    title: "Rivers, salmon and the Delta ecosystem",
    description:
      "Whether rivers, salmon, and the Delta estuary receive the flows they need to thrive",
    themeKey: "eco",
  },
  {
    title: "The Delta as a living place",
    description:
      "Whether the Delta is a place where communities, farms, and ecosystems coexist and thrive",
    themeKey: "delta",
  },
  {
    title: "Operations and impacts",
    description:
      "How management decisions affect trade-offs, equity and resilience",
    themeKey: "governance",
  },
] as const

export default function WaterIssuesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const { openThemePanel } = usePanelRoute()

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          alignItems: "stretch",
          columnGap: theme.space.section.sm,
          rowGap: sp.lg,
        }}
      >
        <Typography
          variant="h3"
          component="h2"
          color="text.secondary"
          sx={{
            gridColumn: "1 / -1",
            maxWidth: "66%",
            mb: theme.space.section.md,
          }}
        >
          What water issues interest you?
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ gridColumn: "1 / -1", maxWidth: "66%", mb: sp.lg }}
        >
          COEQWAL scenarios are designed to address key water challenges
          across California, including:
        </Typography>

        {WATER_ISSUE_THEMES.map(({ title, description, themeKey }) => {
          const active = themeKey !== "governance"
          return (
            <InfoCard
              key={themeKey}
              title={title}
              description={description}
              onClick={
                active ? () => openThemePanel(themeKey) : undefined
              }
              dimmed={!active}
              variant="onDark"
            />
          )
        })}

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ gridColumn: "1 / -1", mt: sp.lg }}
        >
          Click on each water issue to learn more.
        </Typography>
      </Box>
    </PanelShell>
  )
}
