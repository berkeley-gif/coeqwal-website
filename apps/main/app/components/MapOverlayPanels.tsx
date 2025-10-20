"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { TwoColumnPanel, GlossaryLinkedText } from "@repo/ui"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"
import { Box, Typography, useTheme, Theme } from "@repo/ui/mui"
import { useDrawerStore } from "@repo/state"
import { motion } from "@repo/motion"

export default function MapOverlayPanels() {
  const theme = useTheme()
  const { setDrawerContent, openDrawer } = useDrawerStore()

  // Animation state for first panel entrance
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)
  const firstPanelRef = useRef<HTMLDivElement>(null)

  // Handler to open glossary to specific entry
  const handleGlossaryOpen = useCallback(
    (glossaryEntry: string) => {
      setDrawerContent({
        selectedTerm: glossaryEntry,
      })
      openDrawer("glossary")
    },
    [setDrawerContent, openDrawer],
  )

  // Intersection observer for first panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
            console.log("Map entered viewport")
          }
        })
      },
      {
        threshold: 0.5, // Trigger when 50% of panel is visible
        rootMargin: "0px 0px -200px 0px", // Delay trigger until well into viewport
      },
    )

    // Observe the California map panel -> trigger when map becomes sticky
    const mapPanel = document.getElementById("california-map")
    if (mapPanel) {
      observer.observe(mapPanel)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  // Shared style for overlay panel content boxes, for now
  const overlayPanelStyle = {
    maxWidth: (theme: Theme) => theme.layout.textContainer.maxWidth,
    backgroundColor: (theme: Theme) => theme.palette.brand.sky,
    backdropFilter: "blur(10px)",
    borderRadius: (theme: Theme) => theme.borderRadius.card,
    padding: (theme: Theme) => theme.layout.spacing.lg,
    pointerEvents: "auto", // Re-enable pointer events for the content box
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  }

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
        pointerEvents: "none", // Allow markers to be clickable through overlays
        marginTop: "-100vh", // Pull up to overlay the sticky map immediately
      }}
    >
      {/* CalSim panel right-side overlay */}
      <TwoColumnPanel
        id="calsim-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center",
          alignItems: "flex-end",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Ditto
        }}
        rightContent={
          <motion.div
            initial={{ marginTop: "100vh", opacity: 0 }} // Start one viewport below, hidden
            animate={{
              marginTop: isFirstPanelVisible ? 0 : "100vh", // Slide up to natural position over sticky map
              opacity: isFirstPanelVisible ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 40, // Lower stiffness
              damping: 30, // Higher damping
              duration: 1.8, // Longer duration
              // Separate faster timing for opacity
              opacity: {
                duration: 0.6, // Much faster opacity fade-in
                ease: "easeOut",
              },
            }}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end", // Ensure right alignment
            }}
          >
            <Box
              ref={firstPanelRef}
              sx={{
                ...overlayPanelStyle,
                mr: { xs: 8, md: 16 },
              }}
            >
              <Typography variant="body1" fontWeight={700}>
                Do you know that California has one of the most complex water
                allocation systems in the world?
              </Typography>

              <Typography variant="body1">
                <GlossaryLinkedText
                  text="To track the movement of water across the state, tools such as CalSim are needed. 
                CalSim is a water planning model that 
                simulates how water moves through California's major water 
                projects within the Central Valley and inter-connected regions. 
                The model tracks water flowing into reservoirs, 
                how much is stored and released into rivers and canals, and where it gets delivered across the state."
                  terms={[
                    { name: "CalSim", glossaryTerm: "CalSim" },
                    {
                      name: "major water projects",
                      glossaryTerm: "California's major water projects",
                    },
                    {
                      name: "Central Valley",
                      glossaryTerm: "Central Valley",
                    },
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.text.primary}
                  underlineColor={theme.palette.text.primary}
                />
              </Typography>
            </Box>
          </motion.div>
        }
      />

      <TwoColumnPanel
        id="scenarios-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center",
          alignItems: "flex-end",
        }}
        sx={{
          minHeight: "100vh",
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0, // Remove TwoColumnPanel's default padding that blocks clicks
          paddingRight: 0, // Ditto
        }}
        rightContent={
          <motion.div
            initial={{ marginTop: "100vh", opacity: 0 }} // Start one viewport below, hidden
            animate={{
              marginTop: isFirstPanelVisible ? 0 : "100vh", // Slide up to natural position over sticky map
              opacity: isFirstPanelVisible ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 40, // Lower stiffness
              damping: 30, // Higher damping
              duration: 1.8, // Longer duration
              // Separate faster timing for opacity
              opacity: {
                duration: 0.6, // Much faster opacity fade-in
                ease: "easeOut",
              },
            }}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end", // Ensure right alignment
            }}
          >
            <Box
              ref={firstPanelRef}
              sx={{
                ...overlayPanelStyle,
                mr: { xs: 8, md: 16 },
              }}
            >
              <Typography variant="body1">
                <GlossaryLinkedText
                  text="On this site, you can explore how water is allocated under current operations – 
                  representing the laws, regulations, priorities, and decisions that affect 
                  how California’s water supply is currently managed – and how outcomes differ among water users. "
                  terms={[
                    { name: "CalSim", glossaryTerm: "CalSim" },
                    {
                      name: "major water projects",
                      glossaryTerm: "California's major water projects",
                    },
                    {
                      name: "Central Valley",
                      glossaryTerm: "Central Valley",
                    },
                  ]}
                  onActivate={handleGlossaryOpen}
                  color={theme.palette.text.primary}
                  underlineColor={theme.palette.text.primary}
                />
              </Typography>
            </Box>
          </motion.div>
        }
      />

      {/* Baseline scenario overlay with Current Operations and Hydroclimate cards */}
      <TwoColumnPanel
        id="baseline-scenario-overlay"
        fullHeight={true}
        fullWidth={true}
        backgroundColor="transparent"
        includeHeaderSpacing={false}
        contentColumn="right"
        contentAlignment={{
          justifyContent: "center",
          alignItems: "flex-end",
        }}
        sx={{
          minHeight: "100vh",
          paddingBottom: "40vh", // Add vertical breathing room at bottom
          pointerEvents: "none", // Allow map interaction through the overlay
          paddingLeft: 0,
          paddingRight: 0,
        }}
        rightContent={
          <Box
            sx={{
              ...overlayPanelStyle,
              mr: { xs: 8, md: 16 }, // Same margin as tools overlay
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <ScenarioCard
              isMinimized={false}
              minimizedTitle="Current operations"
            />
            <ClimateCard
              isMinimized={false}
              selectedClimate={1} // Historical
            />
          </Box>
        }
      />
    </Box>
  )
}
