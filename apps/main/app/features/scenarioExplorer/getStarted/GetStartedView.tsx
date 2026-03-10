"use client"

import { useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"
import TierAnimationSection from "./TierAnimationSection"

const SECTIONS: { title: string; body?: string }[] = [
  { title: "Welcome", body: "...use our tools..." },
  { title: "Scenarios" },
  { title: "Scenario scorecard" },
  { title: "Operations" },
]

export default function GetStartedView() {
  const theme = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const panelSx = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    pt: theme.space.panel.padding,
    px: theme.space.panel.padding,
  }

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        position: "relative",
        height: "100%",
        overflow: "auto",
        backgroundColor: theme.palette.tabPanels.explore,
      }}
    >
      {SECTIONS.map(({ title, body }) => (
        <ContentPanel key={title} sx={panelSx}>
          <Typography variant="h3" component="h2">
            {title}
          </Typography>
          {body && (
            <Typography variant="body1" sx={{ mt: theme.space.component.lg }}>
              {body}
            </Typography>
          )}
        </ContentPanel>
      ))}

      {/* Tiers section with polygon-to-glyph animation */}
      <TierAnimationSection scrollContainerRef={scrollContainerRef} />
    </Box>
  )
}
