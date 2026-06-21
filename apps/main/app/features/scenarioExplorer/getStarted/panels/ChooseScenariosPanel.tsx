"use client"

import { Typography, useTheme } from "@repo/ui/mui"
import { BarredColumns } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { SCENARIO_QUESTIONS } from "../content"

export default function ChooseScenariosPanel() {
  const theme = useTheme()

  return (
    <PanelShell background={theme.palette.blue.dark}>
      <PanelHeading
        title="Choose your scenarios"
        kicker="Which water management strategies do you want to explore?"
        lead="To use the library effectively, you may want to start by asking these questions:"
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
        As you explore scenarios with different visualization tools, use the
        &ldquo;share&rdquo; icon to save graphs, text, or maps of interest.
        These will be saved in the{" "}
        <Typography component="span" variant="body2" fontWeight={600}>
          SHARE
        </Typography>{" "}
        section of the site.
      </Typography>
    </PanelShell>
  )
}
