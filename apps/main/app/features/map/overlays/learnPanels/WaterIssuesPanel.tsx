"use client"

import type { ReactNode } from "react"
import { Typography, useTheme } from "@repo/ui/mui"
import { InfoCard, InfoCardGrid, WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { usePanelRoute } from "../../../../hooks/usePanelRoute"
import { WATER_ISSUE_THEMES } from "../content"
import { GlossaryTermLink } from "../../../glossary"

// "How X..." explainer clauses for the intro bullet list, keyed by theme id.
// Kept local (not in themes.ts) because they use "How..." phrasing and
// embedded glossary links that themes.ts's plain-string `description`
// field can't hold. Title text and list order still come from WATER_THEMES,
// so a rename/reorder there is reflected here automatically — only these
// clauses need to be kept in sync by hand.
const WATER_ISSUE_BLURBS: Record<string, ReactNode> = {
  baseline:
    "How current management of California's water affects communities, agriculture, and the environment",
  cws: "How people and communities can reliably access safe drinking water for daily life, health, and essential services",
  ag_gw: (
    <>
      How agricultural water deliveries can sustain food production, while
      preventing over-draft of{" "}
      <GlossaryTermLink term="Groundwater basin">
        groundwater basins
      </GlossaryTermLink>
    </>
  ),
  eco: (
    <>
      How rivers and{" "}
      <GlossaryTermLink term="Winter-run Chinook salmon">
        winter-run Chinook salmon
      </GlossaryTermLink>{" "}
      receive the flows they need to thrive
    </>
  ),
  delta:
    "How the Delta can be managed as a place where communities, farms, and ecosystems coexist and thrive",
}

export default function WaterIssuesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const { openThemePanel } = usePanelRoute()
  const dropletIcon = <WaterDroplet />

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

      <InfoCardGrid columns={{ xs: 2, sm: 3, md: WATER_ISSUE_THEMES.length }}>
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
