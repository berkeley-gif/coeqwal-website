"use client"

import { Typography, useTheme } from "@repo/ui/mui"
import { BarredColumns } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"

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
        items={[
          {
            title: "How is my water interest doing now?",
            description:
              "This is the current operations scenario under the historical hydroclimate, which serves as a baseline for comparison.",
          },
          {
            title:
              "How could alternative strategies impact my water interest?",
            description:
              "Select one or more scenarios to compare against the current operations scenario under the historical hydroclimate.",
          },
          {
            title: "How does climate change shift the picture?",
            description:
              "Select scenarios that represent how current operations and alternative strategies perform under alternative hydroclimates.",
          },
        ]}
        color={theme.palette.common.white}
        columnGap={theme.space.section.xl}
        sx={{ mb: theme.space.section.lg }}
      />

      <Typography variant="body2" color="text.secondary">
        As you explore scenarios with different visualization tools, use
        the &ldquo;share&rdquo; icon to save graphs, text, or maps of
        interest. These will be saved in the{" "}
        <Typography component="span" variant="body2" fontWeight={600}>
          SHARE
        </Typography>{" "}
        section of the site.
      </Typography>
    </PanelShell>
  )
}
