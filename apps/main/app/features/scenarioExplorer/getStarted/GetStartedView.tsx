"use client"

import { useRef } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { ContentPanel } from "@repo/ui"
import { useMapMode } from "../../map/store"
import { usePanelRoute } from "../../../hooks/usePanelRoute"
import { useScenarioExplorerStore } from "../store"
import TierAnimationSection from "./TierAnimationSection"

const WATER_ISSUE_THEMES = [
  { label: "Drinking water for community water systems", themeKey: "cws" },
  { label: "Groundwater management for agriculture", themeKey: "ag_gw" },
  { label: "Water for salmon, rivers, and the estuary", themeKey: "eco" },
  { label: "Balancing water needs in the Delta", themeKey: "delta" },
  {
    label: "Understanding impacts of operations",
    themeKey: "governance",
  },
] as const

const KEY_OUTCOMES = [
  "Community water system deliveries",
  "Agricultural revenues",
  "River ecology",
  "Bay Delta estuary ecology",
  "Winter-run salmon abundance",
  "Freshwater for in-Delta uses",
  "Freshwater for Delta exports",
  "Reservoir storage",
  "Groundwater storage",
] as const

const CAVEATS = [
  "All scenarios are created by CalSim3, a water planning tool to guide operations of California\u2019s water supply system in the Central Valley.",
  "The scenarios do not include all regions of California nor certain aspects of our water system that may be of interest.",
  "Key outcomes summarize scenario results over a 100-year period. Annual variation in outcomes can be explored with the DATA IN DEPTH VIEW.",
  "The hydroclimates used in scenarios approximate the range of historical and potential future conditions that our system may experience. They do not represent historical observations or predicted future conditions according to climate models.",
  "Predictions of water deliveries to location of interest with small water demands are less reliable than predictions for water users that receive large water volumes.",
  "The outcomes of CalSim scenarios are best interpreted in a comparative manner \u2014 evaluating how outcomes change relative to current operations (as a baseline) is more appropriate than assessing the specific outcomes of any particular scenario.",
] as const

export default function GetStartedView() {
  const theme = useTheme()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const mapMode = useMapMode()
  const mapActive = mapMode === "get-started"
  const { openThemePanel } = usePanelRoute()
  const setMainView = useScenarioExplorerStore((s) => s.setMainView)

  const exploreBg = theme.palette.tabPanels.explore
  const sp = theme.space.component

  return (
    <Box
      ref={scrollContainerRef}
      sx={{
        position: "relative",
        pointerEvents: "none",
        backgroundColor: mapActive ? "transparent" : exploreBg,
      }}
    >
      {/* Welcome */}
      <ContentPanel
        background={exploreBg}
        heading="Welcome"
        sx={{
          pointerEvents: "auto",
          backgroundColor: mapActive ? exploreBg : "transparent",
        }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          COEQWAL uses the CalSim3 water planning model to evaluate how
          different water management strategies and climate futures affect
          outcomes for communities, farms, and the environment.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          The library of scenarios can be explored in this section of the
          website.
        </Typography>
      </ContentPanel>

      {/* Water Issues */}
      <ContentPanel
        background={theme.palette.blue.dark}
        heading="Water Issues"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          COEQWAL scenarios are designed to address specific water issues. These
          include:
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", p: 0, mt: sp.md }}>
          {WATER_ISSUE_THEMES.map(({ label, themeKey }) => (
            <Box component="li" key={themeKey} sx={{ mt: sp.sm }}>
              <Typography
                component="button"
                variant="body1"
                onClick={() => openThemePanel(themeKey)}
                sx={{
                  background: "none",
                  border: "none",
                  p: 0,
                  color: "text.secondary",
                  textDecoration: "underline",
                  textDecorationColor: "rgba(255,255,255,0.4)",
                  textUnderlineOffset: "3px",
                  cursor: "pointer",
                  font: "inherit",
                  textAlign: "left",
                  "&:hover": {
                    textDecorationColor: "rgba(255,255,255,0.8)",
                  },
                }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          If you are interested in one of these issues, we suggest you click on
          the text above.
        </Typography>
      </ContentPanel>

      {/* Map panel (TierAnimationSection) */}
      <TierAnimationSection />

      {/* Key outcomes */}
      <ContentPanel
        background={theme.palette.nature.forest}
        heading="Key outcomes"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          All scenarios are described by nine key outcomes, listed below. Click
          on each to learn more.
        </Typography>
        <Box component="ul" sx={{ listStyle: "none", p: 0, mt: sp.md }}>
          {KEY_OUTCOMES.map((outcome) => (
            <Box component="li" key={outcome} sx={{ mt: sp.sm }}>
              <Typography variant="body1" color="text.secondary">
                {outcome}
              </Typography>
            </Box>
          ))}
        </Box>
      </ContentPanel>

      {/* Data in depth */}
      <ContentPanel
        background={exploreBg}
        heading="Data in depth"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          In addition to the key outcomes, there are dozens of detailed scenario
          outcome variables that describe different features of the systems,
          including river flows, reservoir and groundwater storage, water
          deliveries, and Delta salinity.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          A full list of outcome variables can be accessed{" "}
          <Typography
            component="button"
            variant="body1"
            onClick={() => setMainView("data")}
            sx={{
              background: "none",
              border: "none",
              p: 0,
              color: "text.secondary",
              textDecoration: "underline",
              cursor: "pointer",
              font: "inherit",
            }}
          >
            here
          </Typography>
          .
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          Using the &ldquo;Data in Depth&rdquo; tool, users can generate
          summaries and plots of these different outcome variables to explore
          how they vary over space and time.
        </Typography>
      </ContentPanel>

      {/* Before you start your exploration */}
      <ContentPanel
        background={theme.palette.blue.dark}
        heading="Before you start your exploration"
        sx={{ pointerEvents: "auto" }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ mt: sp.lg }}>
          There are a few important things to keep in mind:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: sp.md, color: "text.secondary" }}>
          {CAVEATS.map((caveat, i) => (
            <Box component="li" key={i} sx={{ mt: sp.sm }}>
              <Typography variant="body1" color="text.secondary">
                {caveat}
              </Typography>
            </Box>
          ))}
        </Box>
      </ContentPanel>
    </Box>
  )
}
