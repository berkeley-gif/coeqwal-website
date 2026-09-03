"use client"

import { Typography, useTheme, Box } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { usePanelRoute } from "../../../../hooks/usePanelRoute"
import { WATER_ISSUE_THEMES } from "../content"
import { GlossaryTermLink } from "../../../glossary"

export default function WaterIssuesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const { openThemePanel } = usePanelRoute()

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <PanelHeading title="What water issues interest you?" />
      <Typography variant="body2" color="text.secondary" sx={{ my: sp.sm }}>
        Water is important to all of us – from farmers in the{" "}
        <GlossaryTermLink>Central Valley</GlossaryTermLink> to communities in
        the <GlossaryTermLink>Delta</GlossaryTermLink>, from salmon in the{" "}
        <GlossaryTermLink>Sacramento River</GlossaryTermLink> to urban water
        users in Los Angeles. <GlossaryTermLink>COEQWAL</GlossaryTermLink>{" "}
        considers how decisions affect the water issues that people care about.
      </Typography>
      <Box sx={{ mt: theme.space.listGap.sm }}>
        <InfoCardGrid columns={{ xs: 1, lg: WATER_ISSUE_THEMES.length }}>
          {WATER_ISSUE_THEMES.map(
            ({ title, description, themeKey, dimmed }) => (
              <InfoCard
                key={themeKey}
                title={title}
                description={description}
                onClick={dimmed ? undefined : () => openThemePanel(themeKey)}
                dimmed={dimmed}
                variant="onDark"
              />
            ),
          )}
        </InfoCardGrid>
      </Box>
    </PanelShell>
  )
}
