"use client"

import { useCallback } from "react"

import { Box, Typography, useTheme } from "@repo/ui/mui"
import CaliforniaMapPanel from "../../components/CaliforniaMapPanel"
import MapOverlayPanels from "../../components/MapOverlayPanels"
import ProgressiveScenarioPanels from "../../components/ProgressiveScenarioPanels"
import { CalSimProvider } from "../../components/CalSimContext"
import { GlossaryLinkedText } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

import { LeadingMarkerText } from "@repo/ui"

export default function LearnPanel() {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  // Handler to open glossary to specific entry
  const handleGlossaryOpen = useCallback(
    (term: string) => {
      setDrawerContent({ selectedTerm: term })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )


  return (
    <div>
      <Box sx={{ pointerEvents: "none" }}>
        {/* CalSim context provider for shared state between map and overlays */}
        <CalSimProvider>
          {/* Sticky California map background */}
          <CaliforniaMapPanel id="california-map" />

          {/* Scrolling overlay panels over the sticky map */}
          <MapOverlayPanels />

          {/* Progressive scenario and climate panels that appear on scroll */}
          <ProgressiveScenarioPanels />
        </CalSimProvider>
      </Box>
      <Box
        id="learnMoreContainer"
        sx={{
          display: "flex",
          alignItems: { sm: "flex-start", md: "center" },
          flexDirection: { sm: "column-reverse", lg: "row" },
          justifyContent: 'center',
          gap: (theme) => theme.layout.spacing.sm,
          width: '100%',
          maxWidth: '1200px',
          margin: '100px auto 0',
        }}
      >
        {/* Text column */}
        <Box sx={{ flex: 3 }}>
          <LeadingMarkerText title="Learn">
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '15px'
            }}>
              <Typography variant="body1" sx={{
                fontSize: '1.2rem',
              }} fontWeight={700}>
                Do you know that California has one of the most complex water allocation systems in the world?
              </Typography>
              <Typography variant="body1">



                <GlossaryLinkedText
                  text="To track the movement of water across the state, tools such as CalSim are needed. 
                CalSim is a water planning model developed by government agencies that 
                simulates how water moves through California's major water 
                projects within the Central Valley and inter-connected regions. 
                The model tracks water flowing into reservoirs, 
                how much is stored and released into rivers and canals, and where it gets delivered across the state."
                  terms={[
                    { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                    { name: "CalSim", glossaryTerm: "CalSim" },
                    {
                      name: "water management strategies",
                      glossaryTerm: "Operational strategies",
                    },
                    { name: "hydroclimate", glossaryTerm: "Hydroclimate" },
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.text.primary}
                  underlineColor={theme.palette.text.primary}
                />


              </Typography>
            </div>

            <Box
              component="a"
              href="https://flow.coeqwal.org/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                textDecoration: "none",
                display: "block",
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "underline",
                },
                marginTop: '40px'
              }}
            >
              Learn more: How water moves through California →
            </Box>
            <Box
              component="a"
              href="https://climate.coeqwal.org/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                textDecoration: "none",
                display: "block",
                mb: (theme) => theme.layout.spacing.xs,
                fontWeight: 500,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Learn more: Climate change and California water →
            </Box>
          </LeadingMarkerText>
        </Box>
        {/* Image column */}
        <Box
          sx={{
            minWidth: 0,
            display: "flex",
            justifyContent: "center",
            flex: 1
          }}
        >
          <Box
            component="img"
            src="/images/content/learn.png"
            alt="Learn"
            sx={{ width: "100%", maxWidth: 520, height: "auto" }}
          />
        </Box>
      </Box>
    </div>
  )
}
