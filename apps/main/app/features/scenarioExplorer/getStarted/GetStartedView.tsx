"use client"

import { useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"
import { useMapMode } from "../../map/store"
import TierAnimationSection from "./TierAnimationSection"

const SECTIONS: { title: string; body?: string }[] = [
  { title: "Welcome", body: "Use our tools to explore the COEQWAL library of scenarios..." },
  { title: "COEQWAL library of scenarios", body: "Not comprehensive. We have chosen these scenarios in order to... Models...Caveats...." },
  { title: "Results", body: "...and how to view and compare them." },
  { title: "Operations" },
]

export default function GetStartedView() {
  const theme = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mapMode = useMapMode()
  const mapActive = mapMode === "get-started"

  const blueBg = theme.palette.tabPanels.explore

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
        backgroundColor: mapActive ? "transparent" : blueBg,
      }}
    >
      {/* Blue wrapper for all non-tier content panels */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: mapActive ? blueBg : "transparent",
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
      </Box>

      {/* Tier section — uses box-shadow for blue surround */}
      <TierAnimationSection scrollContainerRef={scrollContainerRef} />
    </Box>
  )
}
