"use client"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import { LinedList } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { INTERPRETING_LENSES, VIZ_TOOLS } from "../content"

export default function InterpretingOutcomesPanel() {
  const theme = useTheme()
  const sp = theme.space.component
  const exploreBg = theme.palette.tabPanels.explore

  return (
    <PanelShell background={exploreBg}>
      <PanelHeading title="Interpreting scenario outcomes" />

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
            items={INTERPRETING_LENSES.map(({ label, description }) => ({
              label,
              description,
            }))}
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
