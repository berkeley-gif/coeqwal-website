import React, { useState, useRef, useEffect } from "react"
import { Box, Typography, Grid, IconButton, useTheme } from "@repo/ui/mui"
import type { Theme } from "@mui/material/styles"
import { BasePanel, LeadingMarkerText, ArrowHead } from "@repo/ui"
import { PlayArrowIcon } from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"

// Add props interface
interface ContentPanelsProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

// Define panel types for better type checking
type PanelType = "learn" | "explore" | "empower" | null

export default function ContentPanels({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenLearnDrawer,
}: ContentPanelsProps = {}) {
  // Get theme for color palette
  const theme = useTheme()

  // Track which panel is showing details (if any)
  const [activePanel, setActivePanel] = useState<PanelType>(null)

  // Force redraw when the window is resized to recalculate panel dimensions
  const [, setWindowWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Text component for the first panel
  const LearnTextContent = () => (
    <Box sx={{ pointerEvents: "auto", minWidth: "300px" }}>
      <Typography
        variant="h2"
        sx={{
          color: "common.white",
          alignSelf: "flex-start",
          fontWeight: 600,
        }}
      >
        Learn
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "common.white",
          pointerEvents: "auto",
          maxWidth: "620px",
        }}
      >
        how California water flows and operational decisions balance water needs
        across the state
      </Typography>
    </Box>
  )

  // Text component for the second panel
  const EmpowerTextContent = () => (
    <Box sx={{ pointerEvents: "auto", minWidth: "300px" }}>
      <Typography
        variant="h2"
        sx={{
          color: "common.white",
          alignSelf: "flex-start",
          fontWeight: 600,
        }}
      >
        Explore
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "common.white",
          pointerEvents: "auto",
        }}
      >
        COEQWAL&apos;s &quot;what if&quot; scenarios by theme
      </Typography>
    </Box>
  )

  // Text component for the third panel
  const ActTextContent = () => (
    <Box sx={{ pointerEvents: "auto", minWidth: "300px" }}>
      <Typography
        variant="h2"
        sx={{
          color: "common.white",
          alignSelf: "flex-start",
          fontWeight: 600,
        }}
      >
        Empower
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: "common.white",
          pointerEvents: "auto",
          maxWidth: "620px",
        }}
      >
        your community with data that helps you understand the impacts of
        operational decisions
      </Typography>
    </Box>
  )

  // Function to toggle showing/hiding detail for a panel
  const togglePanelDetail = (panelType: PanelType) => {
    if (activePanel === panelType) {
      setActivePanel(null) // Hide detail if same panel clicked
    } else {
      setActivePanel(panelType) // Show detail for the clicked panel
    }
  }

  // Get background color for each panel
  const getPanelBgColor = (panelType: PanelType, theme: Theme) => {
    switch (panelType) {
      case "learn":
        return theme.palette.blue.darkest // Deep blue
      case "explore":
        return theme.palette.blue.medium // Medium blue
      case "empower":
        return theme.palette.nature.teal // Teal green
      default:
        return theme.palette.blue.dark // Fallback
    }
  }

  // Get background color for detail panels (same for now)
  const getDetailPanelBgColor = (panelType: PanelType, theme: Theme) => {
    switch (panelType) {
      case "learn":
        return theme.palette.blue.dark // Deep blue
      case "explore":
        return theme.palette.blue.medium // Medium blue
      case "empower":
        return theme.palette.blue.dark // Dark blue
      default:
        return theme.palette.blue.dark // Fallback
    }
  }

  return (
    <Box
      id="content-panels"
      sx={{
        position: "relative",
        overflowX: "hidden", // Prevent horizontal scrolling
        overflowY: "visible", // Allow natural vertical flow
        width: "100%", // Full width of parent
        maxWidth: "100%", // Ensure it doesn't exceed parent width
        boxSizing: "border-box", // Include padding in width calculation
        userSelect: "text", // Ensure text is selectable
        zIndex: 100, // Much higher z-index to ensure it stays above IntroSection
        margin: 0, // Remove any default margins
        transform: "translateZ(0)", // Force new stacking context
        isolation: "isolate", // Create stacking context
        bgcolor: (theme) => theme.palette.brand.water,

        // Custom styling to ensure proper overlapping
        "& .active-panel-container": {
          zIndex: 3, // Push active panels above others (within panels layer)
          userSelect: "text", // Ensure text is selectable
        },
        "& .active-detail-panel": {
          position: "absolute", // Absolutely position detail panels
          zIndex: 3, // Same level as active panels
          overflow: "visible",
          width: "100%", // Same width as parent
          userSelect: "text", // Ensure text is selectable
        },
      }}
    >
      {/* Learn and Explore panels */}
      <BasePanel fullHeight={false} background="transparent" paddingVariant="wide" fullWidth panelWidth={"100vw"}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: (theme) => theme.palette.blue.darkest }}>
          {/* Text column */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <LeadingMarkerText title="Learn">
              <Typography variant="body2">
                how California water flows and operational decisions balance water needs across the state
              </Typography>
            </LeadingMarkerText>
          </Box>
          {/* Image column */}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
            <Box component="img" src="/images/content/learn.png" alt="Learn" sx={{ maxWidth: "100%", height: "auto" }} />
          </Box>
          {/* Play column - last */}
          <Box sx={{ width: { xs: 48, md: 56 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconButton
              color="inherit"
              aria-label="play"
              sx={(theme) => ({
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: theme.borderRadius.rounded,
                border: "none",
              })}
            >
              <ArrowHead />
            </IconButton>
          </Box>
        </Box>
      </BasePanel>

      <BasePanel fullHeight={false} background="transparent" paddingVariant="wide" fullWidth panelWidth={"100vw"}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, color: (theme) => theme.palette.blue.darkest }}>
          {/* Image column */}
          <Box sx={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
            <Box component="img" src="/images/content/explore.png" alt="Explore" sx={{ maxWidth: "100%", height: "auto" }} />
          </Box>
          {/* Text column */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <LeadingMarkerText title="Explore">
              <Typography variant="body2">COEQWAL&apos;s &ldquo;what if&rdquo; scenarios by theme</Typography>
            </LeadingMarkerText>
          </Box>
          {/* Play column - last */}
          <Box sx={{ width: { xs: 48, md: 56 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconButton
              color="inherit"
              aria-label="play"
              sx={(theme) => ({
                width: { xs: 40, md: 48 },
                height: { xs: 40, md: 48 },
                borderRadius: theme.borderRadius.rounded,
                border: "none",
              })}
            >
              <ArrowHead />
            </IconButton>
          </Box>
        </Box>
      </BasePanel>

      {/* Existing complex panels block (can be removed once new layout is final) */}
      <Box
        sx={{
          position: "relative",
          // Remove any spacing from BasePanel
          "& .MuiBasePanel-root": {
            marginTop: 0,
            marginBottom: 0,
            borderRadius: 0,
          },
          // Create stacking context to handle z-index properly
          zIndex: 1, // Base level within panels
          overflow: "visible",
          width: "100%", // Ensure content is limited to viewport width
        }}
      >
        {/* Panel Component - Learn */}
        <PanelWithDetail
          panelType="learn"
          isActive={activePanel === "learn"}
          onToggleDetail={() => togglePanelDetail("learn")}
          bgColor={getPanelBgColor("learn", theme)}
          detailBgColor={getDetailPanelBgColor("learn", theme)}
          addBorder={true}
          hideBottomArrow={true}
          title={<LearnTextContent />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  alignSelf: "flex-start",
                }}
              >
                Learn
              </Typography>
              <Grid container spacing={4} sx={{ mt: 2, pointerEvents: "auto" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Central Valley Water
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      A natural system fed by rain and snowpack
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Water in California begins as precipitation. It travels
                      through rivers, sinks into groundwater, or flows out to
                      sea. From the mountains to the Delta, understanding how
                      water moves through the state is the first step toward
                      shaping its future.
                    </Typography>
                    <Box
                      component="a"
                      href="https://flow.coeqwal.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Learn more: How water moves through California →
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Managing California&apos;s Water
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Who decides where water goes and when?
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      California&apos;s water is managed by a patchwork of
                      agencies, laws, and agreements. Decisions about Central
                      Valley water storage, delivery, and environmental flows
                      affect nearly every part of the state.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Learn more: How California&apos;s water is managed →
                    </Box>
                  </Box>
                </Grid>

                {/* Growing Challenges Card */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Growing Challenges
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      California faces increasing water challenges from
                      ecosystem alteration, groundwater depletion, climate
                      change, and long-term inequities in water access.
                      Understanding these challenges and their impacts on
                      communities is essential for developing effective,
                      equitable solutions.
                    </Typography>
                    <Box
                      component="a"
                      href="https://flow.coeqwal.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mb: 1,
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Learn more: Climate change and California water →
                    </Box>
                    <Box
                      component="a"
                      href="https://flow.coeqwal.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Learn more: Equity in California water →
                    </Box>
                  </Box>
                </Grid>

                {/* Exploring California's Water Futures Card */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Exploring California&apos;s Water Futures
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      What if we made different choices?
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      The COEQWAL project uses the CalSim3 computational model,
                      the same model used by state and federal agencies, to
                      simulate a range of alternative water futures. These
                      scenarios explore how changes in policy, priorities, and
                      climate could shape water availability, distribution, and
                      outcomes across California.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Learn more: Exploring water futures with CalSim3 →
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          }
        />

        {/* Panel Component - Explore */}
        <PanelWithDetail
          panelType="explore"
          isActive={activePanel === "explore"}
          onToggleDetail={() => togglePanelDetail("explore")}
          bgColor={getPanelBgColor("explore", theme)}
          detailBgColor={getDetailPanelBgColor("explore", theme)}
          hideBottomArrow={true}
          title={<EmpowerTextContent />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  alignSelf: "flex-start",
                  pointerEvents: "auto",
                  mb: 4,
                  width: "100%",
                }}
              >
                Explore scenario themes
              </Typography>
              <Grid container spacing={4} sx={{ mt: 2, pointerEvents: "auto" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Current operations
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    ></Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Baseline scenarios show how California manages water
                      today. They serve as a reference point for current
                      operations – the laws, regulations, priorities, and
                      decisions that affect how California’s water supply is
                      managed.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore current operations scenarios →
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Managing river flows for the environment
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Balancing ecosystem needs with human uses
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Natural river systems have high flows in winter and low
                      flows in summer, supporting native fish, plants, and
                      wildlife. Today, the storage and diversion of water
                      especially for farms and communities have altered river
                      flow patterns. This means that rivers may no longer have
                      the water that ecosystems need.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore environmental flow scenarios →
                    </Box>
                  </Box>
                </Grid>

                {/* Managing Groundwater Card */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Managing Groundwater in a Changing Agricultural Landscape
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Sustainable strategies for groundwater basins
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      In California, too much groundwater pumping has caused
                      wells to dry, crops to fail, and the ground to sink. To
                      prevent further impacts from groundwater overdraft, the
                      Sustainable Groundwater Management Act (SGMA) requires
                      local groundwater agencies to limit their pumping. These
                      scenarios examine different pathways for groundwater
                      sustainability and their impacts on agriculture.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore groundwater sustainability scenarios →
                    </Box>
                  </Box>
                </Grid>

                {/* Prioritizing Drinking Water Card */}
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Prioritizing Drinking Water for California Communities
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Ensuring safe, affordable water access for all
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      All Californians need water for drinking, cooking,
                      cleaning, and running businesses, schools, and hospitals.
                      But because of infrastructure problems and the way water
                      allocations are prioritized, some communities don’t always
                      get the water they need. In these scenarios, we focus on
                      giving priority to community water needs and measure how
                      that affects both communities and other water users.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore drinking water access scenarios →
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Improving Delta Outflows for the Environment
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Supporting the Delta ecosystem and San Francisco Bay
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      The Sacramento and San Joaquin Rivers carry water from
                      tributaries draining the Sierra Nevada to the Delta, where
                      water flows out to San Francisco Bay and the Pacific
                      Ocean. However, much of the water that would naturally
                      flow to the Bay is either diverted upstream or exported to
                      the south, significantly reducing Delta outflows. The
                      reduction in these flows has a detrimental impact on
                      ecosystem health and the sustainability of many aquatic
                      species.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore Delta outflow scenarios →
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Sustaining Uses in the Delta for Communities and Farms
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Protecting in-Delta water users and livelihoods
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Communities and farms in the Delta need freshwater water
                      for drinking water, recreation, and irrigation. However,
                      waters of the Delta can become too salty when river flows
                      are reduced from drought or reservoir operations.
                      California’s water agencies must carefully manage how
                      reservoir operations, river flows, diversions for human
                      uses, and Delta exports affect water quality in the Delta.
                      This is becoming more challenging as rising sea levels
                      increase salinity in the Delta.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore in-Delta water use scenarios →
                    </Box>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <Box
                    sx={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 2,
                      p: 4,
                      minHeight: "auto",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography variant="h4" color="white" sx={{ mb: 1 }}>
                      Improving Reliability of Delta Exports for Farms and
                      Communities
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                      }}
                    >
                      Ensuring consistent water deliveries to users south of the
                      Delta
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      California’s water system is designed and managed to move
                      water from the wetter Sacramento Basin in northern
                      California to the drier San Joaquin Basin and Southern
                      California metropolitan region in the south. This system
                      relies on controlling the flow of freshwater through the
                      Delta to export facilities in the south. Changes in
                      operations, regulations, and infrastructure to improve
                      Delta exports will affect all other aspects of the water
                      system.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.accent.gold,
                        textDecoration: "none",
                        display: "block",
                        mt: "auto",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore Delta export reliability scenarios →
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </>
          }
        />

        {/* Panel Component - Empower */}
        <PanelWithDetail
          panelType="empower"
          isActive={activePanel === "empower"}
          onToggleDetail={() => togglePanelDetail("empower")}
          bgColor={getPanelBgColor("empower", theme)}
          detailBgColor={getDetailPanelBgColor("empower", theme)}
          hideDetailArrow={true}
          title={<ActTextContent />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  alignSelf: "flex-start",
                }}
              >
                Empower
              </Typography>
              <Box>
                <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
                  Informed communities can advocate effectively for water
                  policies that meet their unique needs while staying in balance
                  with other water needs.
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  color="common.white"
                  sx={{
                    pointerEvents: "auto",
                  }}
                >
                  The COEQWAL project helps community members and
                  decision-makers understand the complex interrelationships in
                  California&apos;s water system. By providing accessible data
                  and visualizations, we empower stakeholders to participate in
                  water planning processes and advocate for sustainable,
                  equitable water solutions that benefit diverse communities
                  across the state.
                </Typography>
              </Box>
            </>
          }
        />
      </Box>
    </Box>
  )
}

// PanelWithDetail component for each panel/detail pair
interface PanelWithDetailProps {
  panelType: PanelType
  isActive: boolean
  onToggleDetail: () => void
  bgColor: string
  detailBgColor: string
  title: React.ReactNode
  content?: React.ReactNode // Make content optional
  detailContent: React.ReactNode
  hideDetailArrow?: boolean
  addBorder?: boolean
  hideBottomArrow?: boolean
}

function PanelWithDetail({
  isActive,
  onToggleDetail,
  bgColor,
  detailBgColor,
  title,
  content, // Now optional
  detailContent,
  hideDetailArrow = false,
  addBorder = false,
  hideBottomArrow = false,
}: PanelWithDetailProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)

  // Update container height based on active panel
  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return

      const activeRef = isActive ? detailPanelRef.current : mainPanelRef.current
      if (activeRef) {
        const height = activeRef.offsetHeight
        containerRef.current.style.height = `${height}px`
      }
    }

    // Use a small delay to ensure content is rendered
    const timer = setTimeout(updateHeight, 100)

    // Also update on window resize
    const handleResize = () => {
      setTimeout(updateHeight, 100)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", handleResize)
    }
  }, [isActive])

  return (
    <Box
      ref={containerRef}
      className={isActive ? "active-panel-container" : ""}
      sx={{
        position: "relative",
        width: "100%",
        overflow: "hidden", // Hide panels sliding outside the container
        overflowX: "hidden", // Prevent horizontal scrollbar
        backgroundColor: "transparent",
        zIndex: isActive ? 103 : 101,
        // Initial height will be set by useEffect
        minHeight: "auto",
        transition: "height 0.3s ease-out", // Smooth height transitions
      }}
    >
      {/* Conditionally render either main panel or detail panel with sliding animation */}
      <AnimatePresence mode="sync">
        {!isActive ? (
          // Main panel - shown when not active
          <motion.div
            key="main-panel"
            ref={mainPanelRef}
            initial={{ x: 0 }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "tween",
              duration: 0.4,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              userSelect: "text",
              zIndex: 1,
            }}
          >
            <BasePanel
              paddingVariant="wide"
              fullHeight={false}
              sx={{
                backgroundColor: bgColor,
                py: 12,
                color: "white",
                position: "relative",
                borderRadius: 0,
                userSelect: "text",
                border: addBorder ? `5px solid ${bgColor}` : "none",
                overflow: "visible",
              }}
            >
              {/* Single column layout since title and content are now combined */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  width: "100%",
                  pointerEvents: "auto",
                }}
              >
                {title}
                {content && content}{" "}
                {/* Render content if provided (for backward compatibility) */}
              </Box>

              {/* Right centered play icon - only shown when not hidden */}
              {!hideDetailArrow && (
                <IconButton
                  onClick={onToggleDetail}
                  sx={{
                    position: "absolute",
                    right: 30,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "white",

                    "&:hover": {},
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: "2.25rem" }} />
                </IconButton>
              )}

              {/* Bottom scroll icon - absolutely positioned within the panel */}
              {!hideBottomArrow && (
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "white",

                    "&:hover": {},
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon
                    sx={{ fontSize: "2.25rem", transform: "rotate(90deg)" }}
                  />
                </IconButton>
              )}
            </BasePanel>
          </motion.div>
        ) : (
          // Detail panel - shown when active
          <motion.div
            key="detail-panel"
            ref={detailPanelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "tween",
              duration: 0.4,
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              userSelect: "text",
              zIndex: 2,
            }}
          >
            <BasePanel
              paddingVariant="wide"
              fullHeight={false}
              sx={{
                backgroundColor: detailBgColor,
                py: 12,
                color: "white",
                position: "relative",
                borderRadius: 0,
                userSelect: "text",
                overflow: "visible",
              }}
            >
              <Grid container spacing={6} alignItems="flex-start">
                <Grid
                  size={{ xs: 12, md: 10 }}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    pt: 0,
                    pointerEvents: "auto",
                  }}
                >
                  {detailContent}
                </Grid>
              </Grid>

              {/* Left arrow to go back to main panel */}
              <IconButton
                onClick={onToggleDetail}
                sx={{
                  position: "absolute",
                  left: 30,
                  top: 108,
                  transform: "rotate(180deg)",
                  color: "white",

                  "&:hover": {},
                  width: 60,
                  height: 60,
                }}
              >
                <PlayArrowIcon sx={{ fontSize: "2.25rem" }} />
              </IconButton>

              {/* Bottom scroll icon - absolutely positioned within the panel */}
              {!hideBottomArrow && (
                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: "white",

                    "&:hover": {},
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon
                    sx={{ fontSize: "2.25rem", transform: "rotate(90deg)" }}
                  />
                </IconButton>
              )}
            </BasePanel>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  )
}
