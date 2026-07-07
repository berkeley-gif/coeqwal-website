"use client"

import { Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { usePanelRoute } from "../../../../hooks/usePanelRoute"
import { WATER_ISSUE_THEMES } from "../content"

export default function WaterIssuesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const { openThemePanel } = usePanelRoute()

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <PanelHeading
        title="What water issues interest you?"
        lead="COEQWAL scenarios are designed to address key water challenges across California, including:"
      />

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

      <Typography variant="body2" color="text.secondary" sx={{ mt: sp.lg }}>
        Click on each water issue to learn more.
      </Typography>
    </PanelShell>
  )
}
