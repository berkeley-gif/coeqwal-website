"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { LinedList, WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"
import { CAVEATS } from "../content"

export default function BeforeYouBeginPanel() {
  const theme = useTheme()
  const dropletIcon = <WaterDroplet />

  return (
    <PanelShell background={theme.palette.tabPanels.exploreDeep}>
      <PanelHeading
        title="Before you begin your exploration"
        lead="There are a few things to keep in mind:"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: theme.space.section.xl,
          maxWidth: "85%",
        }}
      >
        <LinedList
          items={CAVEATS.slice(0, 3).map((c) => ({ label: c }))}
          color={theme.palette.common.white}
          arrows={false}
          icon={dropletIcon}
          labelVariant="body2"
          labelWeight={400}
        />
        <LinedList
          items={CAVEATS.slice(3).map((c) => ({ label: c }))}
          color={theme.palette.common.white}
          arrows={false}
          icon={dropletIcon}
          labelVariant="body2"
          labelWeight={400}
        />
      </Box>
    </PanelShell>
  )
}
