import React, { useState, useRef, useEffect } from "react"
import { Box, Typography, Grid, IconButton } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
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
    <Box sx={{ pointerEvents: "auto" }}>
      <Typography
        component="span"
        variant="h1"
        color="common.white"
        sx={{
          alignSelf: "flex-start",
          fontWeight: 600,
          mr: 2, // Right margin to space between title and content
        }}
      >
        Learn
      </Typography>
      <Typography
        component="span"
        variant="body2"
        color="common.white"
        sx={{ pointerEvents: "auto" }}
      >
        how California water flows and operational decisions balance water needs
        across the state
      </Typography>
    </Box>
  )

  // Text component for the second panel
  const EmpowerTextContent = () => (
    <Box sx={{ pointerEvents: "auto" }}>
      <Typography
        component="span"
        variant="h1"
        color="common.white"
        sx={{
          alignSelf: "flex-start",
          fontWeight: 600,
          mr: 2, // Right margin to space between title and content
        }}
      >
        Explore
      </Typography>
      <Typography
        component="span"
        variant="body2"
        fontWeight={200}
        color="common.white"
        sx={{ pointerEvents: "auto" }}
      >
        COEQWAL&apos;s &quot;what if&quot; scenarios by theme
      </Typography>
    </Box>
  )

  // Text component for the third panel
  const ActTextContent = () => (
    <Box sx={{ pointerEvents: "auto" }}>
      <Typography
        component="span"
        variant="h1"
        color="common.white"
        sx={{
          alignSelf: "flex-start",
          fontWeight: 600,
          mr: 2, // Right margin to space between title and content
        }}
      >
        Empower
      </Typography>
      <Typography
        component="span"
        variant="body2"
        color="common.white"
        sx={{ pointerEvents: "auto" }}
      >
        your community with specific data that helps you understand the impacts
        of operational decisions
      </Typography>
    </Box>
  )

  // First panel content - Water literacy modules
  const Panel1Content = () => (
    <Box sx={{ pointerEvents: "auto" }}>
      <Typography
        variant="body2"
        color="common.white"
        sx={{ pointerEvents: "auto", mb: 0 }}
      >
        how California water flows and operational decisions
        <br />
        balance water needs across the state
      </Typography>
    </Box>
  )

  // Second panel content - Themes
  const Panel2Content = () => (
    <Box sx={{ pointerEvents: "auto" }}>
      <Typography
        variant="body2"
        fontWeight={200}
        color="common.white"
        sx={{ pointerEvents: "auto", mb: 0 }}
      >
        COEQWAL&apos;s &quot;what if&quot; scenarios by theme
      </Typography>
    </Box>
  )

  // Third panel content - Empower
  const Panel3Content = () => (
    <Box sx={{ pointerEvents: "auto", mb: 0 }}>
      <Typography
        variant="body2"
        color="common.white"
        sx={{ pointerEvents: "auto", mb: 0 }}
      >
        your community with specific data that helps you understand
        <br />
        the impacts of operational decisions
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
  const getPanelBgColor = (panelType: PanelType) => {
    switch (panelType) {
      case "learn":
        return "#303a68" // Deep blue
      case "explore":
        return "#458bb6" // Teal blue
      case "empower":
        return "rgb(19, 87, 115)" // Dark teal
      default:
        return "#1A3F6A" // Fallback
    }
  }

  // Get background color for detail panels (same for now)
  const getDetailPanelBgColor = (panelType: PanelType) => {
    switch (panelType) {
      case "learn":
        return "#1A3F6A" // Deep blue
      case "explore":
        return "#2f84ab" // Teal blue
      case "empower":
        return "#135773" // Dark teal
      default:
        return "#1A3F6A" // Fallback
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
        backgroundColor: "transparent", // Ensure no transparency issues
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
          bgColor={getPanelBgColor("learn")}
          detailBgColor={getDetailPanelBgColor("learn")}
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
                Learn about
                <br />
                California Central Valley water
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
                        fontStyle: "italic",
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
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      Who decides where water goes—and when?
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      California&apos;s water is managed by a patchwork of
                      agencies, laws, and agreements. Decisions about storage,
                      delivery, and environmental flows affect nearly every part
                      of the state, every season.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                      California faces increasing water challenges from climate
                      change, aging infrastructure, and deepening inequities in
                      water access. Understanding these challenges and their
                      impacts on communities is essential for developing
                      effective, equitable solutions.
                    </Typography>
                    <Box
                      component="a"
                      href="https://flow.coeqwal.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: "#FFAC6E",
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
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      What if we made different choices?
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      The COEQWAL project uses the CalSim3 model—trusted by
                      state and federal agencies—to simulate a range of
                      alternative water futures. These scenarios explore how
                      changes in policy, climate, and priorities could shape
                      water availability, distribution, and outcomes across
                      California.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
          bgColor={getPanelBgColor("explore")}
          detailBgColor={getDetailPanelBgColor("explore")}
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
                      Current Operations for California Water
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        fontStyle: "italic",
                      }}
                    >
                      Understanding today&apos;s water system operations
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Explore how California&apos;s water system currently
                      operates under existing policies, regulations, and
                      infrastructure constraints. This baseline scenario shows
                      water deliveries, environmental flows, and system outcomes
                      under current management practices.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                      Managing River Flows for the Environment
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        fontStyle: "italic",
                      }}
                    >
                      Balancing ecosystem needs with human uses
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Examine scenarios that prioritize environmental flows to
                      support river ecosystems while managing trade-offs with
                      other water uses. These approaches explore how strategic
                      flow management can benefit fish, wildlife, and river
                      health.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      Sustainable strategies for groundwater basins
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Explore scenarios for implementing the Sustainable
                      Groundwater Management Act (SGMA) in agricultural regions
                      where land use changes are expected. These scenarios
                      examine different pathways for groundwater sustainability
                      and their impacts on agriculture.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      Ensuring safe, affordable water access for all
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Investigate scenarios that prioritize drinking water
                      access for communities, particularly those historically
                      underserved. These approaches explore how water management
                      decisions impact drinking water availability across
                      diverse communities.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      Supporting the Delta ecosystem and San Francisco Bay
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Compare scenarios that enhance Delta outflows to support
                      the estuary ecosystem and San Francisco Bay. These
                      scenarios explore the relationship between outflow timing,
                      volume, and ecological responses in this critical
                      transition zone.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                        fontStyle: "italic",
                      }}
                    >
                      Protecting in-Delta water users and livelihoods
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Analyze scenarios that focus on sustaining water quality
                      and availability for Delta communities and agriculture.
                      These approaches examine how to balance the needs of those
                      who live and work in the Delta with other competing water
                      demands.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
                      Cities
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="white"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        fontStyle: "italic",
                      }}
                    >
                      Ensuring consistent water deliveries to users south of the
                      Delta
                    </Typography>
                    <Typography variant="body1" color="white" sx={{ mb: 3 }}>
                      Review scenarios designed to improve the reliability of
                      water exports from the Delta for agricultural and urban
                      users in Central and Southern California. These approaches
                      consider operational changes and infrastructure
                      modifications to enhance water supply reliability.
                    </Typography>
                    <Box
                      sx={{
                        color: "#FFAC6E",
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
          bgColor={getPanelBgColor("empower")}
          detailBgColor={getDetailPanelBgColor("empower")}
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
                <Typography variant="body2" color="common.white">
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
                    backgroundColor: "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon sx={{ fontSize: 36 }} />
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
                    backgroundColor: "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon
                    sx={{ fontSize: 36, transform: "rotate(90deg)" }}
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
                  top: 120,
                  transform: "rotate(180deg)",
                  color: "white",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                  },
                  width: 60,
                  height: 60,
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 36 }} />
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
                    backgroundColor: "transparent",
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                    },
                    width: 60,
                    height: 60,
                  }}
                >
                  <PlayArrowIcon
                    sx={{ fontSize: 36, transform: "rotate(90deg)" }}
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
