"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { LinedList } from "@repo/ui"
import PanelShell from "./PanelShell"

const VIZ_TOOLS: ReadonlyArray<{
  title: string
  description: string
  dimmed?: boolean
}> = [
  {
    title: "Map view",
    description:
      "Displays how outcomes vary across locations of interest and reveals spatial patterns in outcomes.",
  },
  {
    title: "Distribution viewer",
    description:
      "Highlights how outcomes vary across key outcomes and among different locations of interest and communities, revealing who benefits and who is most impacted.",
  },
  {
    title: "Radar chart",
    description:
      "Shows how outcomes vary within a scenario and enables comparisons across scenarios, highlighting commonalities, differences, and trade-offs.",
  },
  {
    title: "Scatterplot",
    description:
      "Compares scenarios at the system level to reveal the relative effects of operational decisions and climate change on outcomes.",
    dimmed: true,
  },
  {
    title: "Heatmaps",
    description:
      "Show how scenarios perform across increasing levels of climate stress, highlighting which management strategies are most resilient or vulnerable to climate impacts.",
  },
]

export default function InterpretingOutcomesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const exploreBg = theme.palette.tabPanels.explore

  return (
    <PanelShell background={exploreBg}>
      <Typography
        variant="h3"
        component="h2"
        color="text.secondary"
        sx={{ maxWidth: "66%", mb: theme.space.section.lg }}
      >
        Interpreting scenario outcomes
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: theme.space.section.xl,
        }}
      >
        {/* Left - three lenses */}
        <Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: theme.space.section.md }}
          >
            The visualization tools help to understand how different management
            strategies and hydroclimate conditions affect:
          </Typography>
          <LinedList
            items={[
              {
                label: "Trade-offs",
                description:
                  "How outcomes improve or decline together across scenarios",
              },
              {
                label: "Equity",
                description:
                  "How benefits and impacts are distributed across outcomes and locations of interest",
              },
              {
                label: "Resilience",
                description:
                  "How outcomes change under increasing levels of climate stress",
              },
            ]}
            color={theme.palette.common.white}
            arrows={false}
            labelVariant="body2"
            descriptionVariant="body2"
          />
        </Box>

        {/* Right - visualization tools */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: sp.sm }}>
            Each tool highlights these perspectives in different ways:
          </Typography>
          <LinedList
            items={VIZ_TOOLS.map(({ title, description, dimmed }) => ({
              label: title,
              description,
              opacity: dimmed ? 0.45 : 1,
            }))}
            color={theme.palette.common.white}
            arrows={false}
            labelVariant="body2"
            descriptionVariant="body2"
          />
        </Box>
      </Box>
    </PanelShell>
  )
}
