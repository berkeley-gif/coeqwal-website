"use client"

import { Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid, WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { usePanelRoute } from "../../../../hooks/usePanelRoute"
import { WATER_ISSUE_THEMES } from "../content"
import { LinedList } from "@repo/ui"

export default function WaterIssuesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const { openThemePanel } = usePanelRoute()
  const dropletIcon = <WaterDroplet />

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <PanelHeading
        title="What water issues interest you?"
      />
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ my: sp.sm }}
      >
        Water is important to all of us – from farmers in the Central Valley to communities in the Delta, from salmon in the Sacramento River to urban water users in Los Angeles. COEQWAL considers how decisions affect the water issues that people care about.
      </Typography>

      <LinedList
        items={[
          {
            label:
              "Representing current operations: How current management of California’s water affects communities, agriculture, and the environment",
          },
          {
            label:
              "Securing community water supplies: How people and communities can reliably access safe drinking water for daily life, health, and essential services",
          },
          {
            label:
              "Sustaining farms and groundwater: How agricultural water deliveries can sustain food production, while preventing over-draft of groundwater basins",
          },
          {
            label:
              "Protecting rivers and salmon: How rivers and winter run Chinook salmon receive the flows they need to thrive",
          },
          {
            label:
              "Balancing needs in the Delta: How the Delta can be managed as a place where communities, farms, and ecosystems coexist and thrive",
          },
        ]}
        color={theme.palette.common.white}
        icon={dropletIcon}
        labelVariant="body2"
        sx={{ mt: sp.sm }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ my: sp.lg }}>
        Click on each water issue to learn more.
      </Typography>

      <InfoCardGrid columns={5}>
        {WATER_ISSUE_THEMES.map(({ title, description, themeKey, dimmed }) => (
          <InfoCard
            key={themeKey}
            title={title}
            description={description}
            onClick={dimmed ? undefined : () => openThemePanel(themeKey)}
            dimmed={dimmed}
            variant="onDark"
          />
        ))}
      </InfoCardGrid>


    </PanelShell>
  )
}
