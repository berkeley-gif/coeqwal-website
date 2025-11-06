"use client"

import { useState, useEffect } from "react"
import { CallResponsePanel } from "@repo/ui"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"
import {
  Box,
  Typography,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  ExpandMoreIcon,
} from "@repo/ui/mui"

export default function MapOverlayPanels() {
  const theme = useTheme()

  // Animation state for first panel entrance
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

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

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content, // Above the sticky map
        pointerEvents: "none", // Allow markers to be clickable through overlays
        marginTop: "-100vh", // Pull up to overlay the sticky map immediately
      }}
    >
      {/* Call: Question about California's water system */}
      <CallResponsePanel
        id="calsim-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.4 }}>
          Do you know that California has one of the most complex water
          allocation systems in the world?
        </Typography>
      </CallResponsePanel>

      {/* Response: Explanation about CalSim */}
      <CallResponsePanel
        id="calsim-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE TOOL
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          To track the movement of water across the state, tools such as CalSim
          are needed. CalSim is a water planning model that simulates how water
          moves through{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            California&apos;s major water projects
          </Box>{" "}
          within the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Central Valley
          </Box>{" "}
          and inter-connected regions. The model tracks water flowing into
          reservoirs, how much is stored and released into rivers and canals,
          and where it gets delivered across the state.
        </Typography>
      </CallResponsePanel>

      {/* Call: Rain and snowmelt statement */}
      <CallResponsePanel
        id="water-flow-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE JOURNEY
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          Rain and snowmelt in the mountains flow into California&apos;s{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Central Valley
          </Box>
          .
        </Typography>
      </CallResponsePanel>

      {/* Response: Sacramento and San Joaquin Rivers */}
      <CallResponsePanel
        id="rivers-flow-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          From the north, the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Sacramento River
          </Box>{" "}
          flows toward the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Delta
          </Box>
          , where its waters mix with waters from the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            San Joaquin River
          </Box>{" "}
          flowing up from the south.
        </Typography>
      </CallResponsePanel>

      {/* Call: Water distribution statement */}
      <CallResponsePanel
        id="water-distribution-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          Water is distributed from multiple points along the way, and
          pumped out from the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Delta
          </Box>{" "}
          to points further south.
        </Typography>
      </CallResponsePanel>

      {/* Response: CalSim model detailed explanation */}
      <CallResponsePanel
        id="calsim-detailed-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE MODEL
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          To plan and account for where the water goes, the federal{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            U.S. Bureau of Reclamation
          </Box>{" "}
          and the state{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            Department of Water Resources
          </Box>{" "}
          use a computer model called CalSim. The CalSim model tracks water
          flowing into reservoirs, how much is stored and released into rivers
          and canals, and where it gets delivered across the state.
        </Typography>
      </CallResponsePanel>

      {/* Call: COEQWAL project explanation */}
      <CallResponsePanel
        id="coeqwal-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          THE SCENARIOS
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          The COEQWAL project has been given resources from the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            University of California
          </Box>{" "}
          and the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            Bay-Delta Science Program
          </Box>{" "}
          to run CalSim through a broad range of different water management
          practices and evaluate the results under current and future climate
          scenarios.
        </Typography>

        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            lineHeight: 1.75,
            mt: 2,
            color: theme.palette.blue.darkest,
          }}
        >
          We are making this data available to the public so that communities can
          better understand the range of possibilities, and the range of
          consequences, that different water management practices can bring.
        </Typography>
      </CallResponsePanel>

      {/* Response: FAQ Accordion */}
      <CallResponsePanel
        id="faq-accordion"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        delay={0.3}
      >
        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 0, fontWeight: 500 }}
          >
            <Typography variant="body1" fontWeight={500}>
              Where is my basin?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Typography
              variant="body2"
              sx={{ mb: theme.spacing(2), lineHeight: 1.6 }}
            >
              Enter your address
            </Typography>
            <TextField
              fullWidth
              placeholder="Search for a location..."
              variant="outlined"
              size="small"
              sx={{
                backgroundColor: theme.palette.common.white,
                "& .MuiOutlinedInput-root": {
                  borderRadius: theme.borderRadius.standard,
                },
              }}
            />
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 0, fontWeight: 500 }}
          >
            <Typography variant="body1" fontWeight={500}>
              What is and where is &quot;The Delta&quot;?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              The Sacramento–San Joaquin Delta is the unique ecosystem of
              low-lying waterways and islands where the Sacramento and San
              Joaquin rivers meet, roughly between Sacramento, Stockton, and
              Antioch. Here river water mixes with salty incoming tides from San
              Francisco Bay. Pumps and canals send water from the Delta to cities
              and farms across the state.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion
          disableGutters
          elevation={0}
          sx={{
            backgroundColor: "transparent",
            "&:before": { display: "none" },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ px: 0, fontWeight: 500 }}
          >
            <Typography variant="body1" fontWeight={500}>
              What are the major components of California&apos;s water system?
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ px: 0 }}>
            <Box
              sx={{
                p: theme.spacing(2),
                backgroundColor: theme.palette.common.white,
                borderRadius: theme.borderRadius.standard,
                border: `1px solid ${theme.palette.grey[300]}`,
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{ mb: theme.spacing(1.5) }}
              >
                Map Legend
              </Typography>
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.spacing(1),
                }}
              >
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.blue.bright,
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="body2">Inflows</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.blue.darkest,
                      borderRadius: "50%",
                    }}
                  />
                  <Typography variant="body2">Major reservoirs</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.blue.bright,
                    }}
                  />
                  <Typography variant="body2">Major rivers and tributaries</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.brand.sky,
                      border: `2px solid ${theme.palette.blue.darkest}`,
                    }}
                  />
                  <Typography variant="body2">Delta</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderBottom: `16px solid ${theme.palette.accent.alert}`,
                    }}
                  />
                  <Typography variant="body2">Major pumping stations</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 3,
                      backgroundColor: theme.palette.grey[600],
                    }}
                  />
                  <Typography variant="body2">Major canals</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.accent.gold,
                      opacity: 0.6,
                    }}
                  />
                  <Typography variant="body2">Delivery areas</Typography>
                </Box>
                <Box component="li" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: theme.palette.grey[500],
                      opacity: 0.5,
                    }}
                  />
                  <Typography variant="body2">Groundwater aquifers</Typography>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </CallResponsePanel>

      <CallResponsePanel
        id="scenarios-overlay"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          EXPLORE THE SCENARIOS
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          On this site, you can explore how water is allocated under{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            current operations
          </Box>
          . This represents the laws, regulations, priorities, and decisions that
          affect how{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            California&apos;s
          </Box>{" "}
          water supply is currently managed – and how outcomes differ among water
          users.
        </Typography>
      </CallResponsePanel>

      {/* Second Explore the Scenarios panel, starting How to read CalSim */}
      <CallResponsePanel
        id="how-to-read-scenarios"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
      >
        {/* Eyebrow label */}
        <Typography
          variant="overline"
          sx={{
            color: theme.palette.blue.darkest,
            fontWeight: 600,
            letterSpacing: "0.1em",
            fontSize: "0.7rem",
          }}
        >
          EXPLORE THE SCENARIOS
        </Typography>

        <Typography variant="body1" fontWeight={400} sx={{ lineHeight: 1.75 }}>
          To help you understand how to &quot;read&quot; a CalSim scenario, we
          can start by exploring the data from the CalSim run for{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            current water management operations
          </Box>
          .
        </Typography>
      </CallResponsePanel>

      {/* Baseline scenario overlay with Current Operations and Hydroclimate cards */}
      <CallResponsePanel
        id="baseline-scenario-overlay"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        sx={{ 
          padding: (theme) => theme.spacing(2),
          marginBottom: "40vh",
          gap: (theme) => theme.spacing(1.5),
          maxWidth: "560px", // Wider for this card to accommodate contents
        }}
      >
        <ScenarioCard isMinimized={false} minimizedTitle="Current operations" />
        <ClimateCard isMinimized={false} selectedClimate={1} />
      </CallResponsePanel>
    </Box>
  )
}
