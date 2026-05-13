"use client"

import { Box, useTheme } from "@repo/ui/mui"
import { LinedList, WaterDroplet } from "@repo/ui"
import PanelShell from "./PanelShell"
import PanelHeading from "./PanelHeading"

const CAVEATS = [
  "All scenarios are created by CalSim3, a water planning tool to guide operations of California\u2019s water supply system in the Central Valley.",
  "The scenarios do not include all regions of California nor certain aspects of our water system that may be of interest.",
  "Key outcomes summarize scenario results over a 100-year period. Annual variation in outcomes can be explored with the DATA IN DEPTH view and in the GET DATA section.",
  "The hydroclimates used in scenarios approximate the range of historical and potential future conditions that our system may experience. They do not represent historical observations or predicted future conditions according to climate models.",
  "Estimates of water deliveries to locations of interest with small water demands may be less reliable than delivery estimates for water users that receive larger volumes.",
  "The outcomes of CalSim scenarios are best interpreted in a comparative manner \u2014 evaluating how outcomes change relative to current operations (as a baseline) is more appropriate than assessing the specific outcomes of any particular scenario.",
] as const

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
