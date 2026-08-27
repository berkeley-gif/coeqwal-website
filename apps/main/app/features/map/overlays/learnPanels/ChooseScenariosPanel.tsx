"use client"

import { Typography, useTheme, icons } from "@repo/ui/mui"
import { BarredColumns } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { SCENARIO_QUESTIONS } from "../content"
import { GlossaryTermLink } from "../../../glossary"

export default function ChooseScenariosPanel() {
  const theme = useTheme()

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <PanelHeading
        title="Choose your scenarios"
        kicker="Which water management strategies do you want to explore?"
        lead="To guide your exploration of the COEQWAL scenario library, we recommend you ask:"
      />

      <BarredColumns
        items={SCENARIO_QUESTIONS.map(({ title, description }) => ({
          title,
          description,
        }))}
        color={theme.palette.common.white}
        columnGap={theme.space.section.xl}
        sx={{ mb: theme.space.section.lg }}
      />

      <Typography variant="body2" color="text.secondary">
        As you explore{" "}
        <GlossaryTermLink term="Scenario">scenarios</GlossaryTermLink> with
        different visualization tools, use the &ldquo;share&rdquo; icon to save
        plots and data. These will be saved in the{" "}
        <Typography component="span" variant="body2" fontWeight={600}>
          SHARE
          <icons.IosShare sx={{ fontSize: "1rem", ml: 0.5 }} fontWeight={600} />
        </Typography>{" "}
        section of the site.
      </Typography>
    </PanelShell>
  )
}
