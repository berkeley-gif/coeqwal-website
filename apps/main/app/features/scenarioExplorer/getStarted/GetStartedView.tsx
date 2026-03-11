"use client"

import { useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"
import { useMapMode } from "../../map/store"
import TierAnimationSection from "./TierAnimationSection"

const SECTIONS_BEFORE: { title: string; body?: string }[] = [
  {
    title: "Welcome",
    body: "Use our tools to explore the COEQWAL library of scenarios...",
  },
  {
    title: "COEQWAL library of scenarios",
    body: "Not comprehensive. We have chosen these scenarios in order to... Models...Caveats....",
  },
]

const SECTIONS_AFTER: { title: string; body?: string }[] = [
  { title: "Hydroclimates", body: "What are hydroclimates?" },
  { title: "Data in depth", body: "Wet years, dry years..." },
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
      {/* Blue wrapper for pre-outcomes panels */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: mapActive ? blueBg : "transparent",
        }}
      >
        {SECTIONS_BEFORE.map(({ title, body }) => (
          <ContentPanel key={title} sx={panelSx}>
            <Typography variant="h4" component="h2" fontWeight={300}>
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

      {/* Outcomes / Tier animation section */}
      <TierAnimationSection scrollContainerRef={scrollContainerRef} />

      {/* Blue wrapper for post-outcomes panels */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: blueBg,
        }}
      >
        {SECTIONS_AFTER.map(({ title, body }) => (
          <ContentPanel key={title} sx={panelSx}>
            <Typography variant="h4" component="h2" fontWeight={300}>
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
    </Box>
  )
}
