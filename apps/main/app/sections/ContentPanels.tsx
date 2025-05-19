import React, { useState, useRef, useLayoutEffect, useEffect } from "react"
import { Box, Typography, Grid, IconButton } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
import { PlayArrowIcon } from "@repo/ui/mui"
import { motion } from "@repo/motion"

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
    <Typography
      variant="h1"
      color="common.white"
      sx={{
        fontSize: "5rem",
        fontWeight: 700,
        alignSelf: "flex-start",
      }}
    >
      Learn
    </Typography>
  )

  // Text component for the second panel
  const EmpowerTextContent = () => (
    <Typography
      variant="h1"
      color="common.white"
      sx={{
        fontSize: "5rem",
        fontWeight: 700,
        alignSelf: "flex-start",
      }}
    >
      Explore
    </Typography>
  )

  // Text component for the third panel
  const ActTextContent = () => (
    <Typography
      variant="h1"
      color="common.white"
      sx={{
        fontSize: "5rem",
        fontWeight: 700,
        alignSelf: "flex-start",
      }}
    >
      Empower
    </Typography>
  )

  // First panel content - Understanding California Water
  const Panel1Content = () => (
    <Box>
      <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
        Water in California travels remarkable distances. Most of it falls far
        from where it is needed. Managing this journey involves one of the most
        complex water conveyance systems in the world. By understanding how
        water flows and how policies and management decisions balance water
        needs across the state, you can participate in shaping our shared water
        future.
      </Typography>
      <Typography variant="body2" color="common.white">
        Use our California Water Learning Library to deepen your understanding,
        explore key topics, and become an informed advocate.
      </Typography>
    </Box>
  )

  // Second panel content - COEQWAL Project Modeling
  const Panel2Content = () => (
    <Box>
      <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
        The COEQWAL project is using the same computer models as the state
        Department of Water Resources and the U.S. Bureau of Reclamation to
        model a broad range of water management and climate scenarios.
      </Typography>
      <Typography variant="body2" color="common.white">
        Explore these scenario themes and empower your community with actionable
        insights to advocate for water solutions.
      </Typography>
    </Box>
  )

  // Third panel content - Community Impact
  const Panel3Content = () => (
    <Box>
      <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
        How will policy changes impact your community&apos;s water supply and
        environment? What strategies could help your community achieve their
        water goals?
      </Typography>
      <Typography variant="body2" color="common.white">
        Search our scenario data, identify actionable strategies, and take
        informed steps to advocate effectively for your community&apos;s water
        future.
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
        return "#1A3F6A" // Deep blue
      case "explore":
        return "#2f84ab" // Teal blue
      case "empower":
        return "#135773" // Dark teal
      default:
        return "#1A3F6A" // Fallback
    }
  }

  // Get background color for detail panels (slightly darker)
  const getDetailPanelBgColor = (panelType: PanelType) => {
    switch (panelType) {
      case "learn":
        return "#134970" // Darker blue
      case "explore":
        return "#1E657D" // Darker teal blue
      case "empower":
        return "#0A3D50" // Darker teal
      default:
        return "#134970" // Fallback
    }
  }

  return (
    <Box
      id="content-panels"
      sx={{
        position: "relative",
        overflowX: "hidden", // Prevent horizontal scrolling
        width: "100%", // Full width of parent
        maxWidth: "100%", // Ensure it doesn't exceed parent width
        boxSizing: "border-box", // Include padding in width calculation
        // Custom styling to ensure proper overlapping
        "& .active-panel-container": {
          isolation: "isolate", // Create stacking context
          zIndex: 1000, // Push active panels above others
        },
        "& .active-detail-panel": {
          position: "absolute", // Absolutely position detail panels
          zIndex: 1000,
          overflow: "visible",
          width: "100%", // Same width as parent
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          // Prevent space between panels
          "& > div": {
            marginTop: 0,
            marginBottom: 0,
          },
          // Remove any spacing from BasePanel
          "& .MuiBasePanel-root": {
            marginTop: 0,
            marginBottom: 0,
            borderRadius: 0,
          },
          // Create stacking context to handle z-index properly
          zIndex: 1,
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
          title={<LearnTextContent />}
          content={<Panel1Content />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  fontSize: "5rem",
                  fontWeight: 700,
                  alignSelf: "flex-start",
                }}
              >
                Learn Details
              </Typography>
              <Box>
                <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
                  This detailed panel provides in-depth information about
                  California`&apos;`s water system and the complex journey water
                  takes throughout the state.
                </Typography>
                <Typography variant="body2" color="common.white">
                  Understanding California`&apos;`s water system means
                  appreciating its geography, climate, infrastructure, and
                  policy frameworks. The state`&apos;`s water management
                  includes a complex network of reservoirs, aqueducts, and
                  groundwater basins that work together to meet environmental,
                  agricultural, and urban needs.
                </Typography>
              </Box>
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
          title={<EmpowerTextContent />}
          content={<Panel2Content />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  fontSize: "5rem",
                  fontWeight: 700,
                  alignSelf: "flex-start",
                }}
              >
                Explore Details
              </Typography>
              <Box>
                <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
                  The COEQWAL modeling tools provide unprecedented insights into
                  California`&apos;`s water management options under various
                  scenarios.
                </Typography>
                <Typography variant="body2" color="common.white">
                  Our models incorporate decades of historical data, climate
                  projections, water rights frameworks, infrastructure
                  capabilities, and environmental requirements. By exploring
                  different management approaches, users can understand
                  tradeoffs between different water management strategies and
                  their impacts on communities, agriculture, and ecosystems.
                </Typography>
              </Box>
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
          title={<ActTextContent />}
          content={<Panel3Content />}
          detailContent={
            <>
              <Typography
                variant="h1"
                color="common.white"
                sx={{
                  fontSize: "5rem",
                  fontWeight: 700,
                  alignSelf: "flex-start",
                }}
              >
                Empower Details
              </Typography>
              <Box>
                <Typography variant="body2" color="common.white" sx={{ mb: 4 }}>
                  Informed communities can advocate effectively for water
                  policies that meet their unique needs while respecting the
                  larger water system.
                </Typography>
                <Typography variant="body2" color="common.white">
                  The COEQWAL project helps community members and
                  decision-makers understand the complex interrelationships in
                  California&apos;s water system. By providing accessible data
                  and visualizations, we empower stakeholders to participate
                  meaningfully in water planning processes and advocate for
                  sustainable, equitable water solutions that benefit diverse
                  communities across the state.
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
  content: React.ReactNode
  detailContent: React.ReactNode
}

function PanelWithDetail({
  isActive,
  onToggleDetail,
  bgColor,
  detailBgColor,
  title,
  content,
  detailContent,
}: PanelWithDetailProps) {
  // Track height of panel container for seamless matching
  const panelRef = useRef<HTMLDivElement>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState<string>("auto")

  // Measure the main panel height to set container height
  useLayoutEffect(() => {
    if (panelRef.current) {
      // Get initial height of the main panel
      const height = panelRef.current.offsetHeight
      setContainerHeight(`${height}px`)
    }
  }, [])

  // Update container height when detail panel becomes active
  useEffect(() => {
    if (!isActive || !detailRef.current || !panelRef.current) return

    // Get heights of both panels
    const detailHeight = detailRef.current.offsetHeight
    const mainHeight = panelRef.current.offsetHeight

    // Use the taller of the two panels
    const newHeight = Math.max(detailHeight, mainHeight)
    setContainerHeight(`${newHeight}px`)

    // Cleanup - reset to main panel height when detail becomes inactive
    return () => {
      if (panelRef.current) {
        setContainerHeight(`${panelRef.current.offsetHeight}px`)
      }
    }
  }, [isActive])

  return (
    <Box
      className={isActive ? "active-panel-container" : ""}
      sx={{
        position: "relative",
        width: "100%", // Keep container at 100% width
        overflow: isActive ? "visible" : "hidden", // Allow overflow when panel is active
        height: containerHeight, // Dynamic height based on content
        zIndex: isActive ? 1000 : 1, // Much higher z-index when active
        transition: "height 0.4s ease-in-out", // Smooth height transition
      }}
    >
      {/* Main panel */}
      <motion.div
        ref={panelRef}
        className={isActive ? "active-panel" : ""}
        style={{
          width: "100%", // Full width of container
          height: "100%",
          position: "relative", // Keep in normal flow
          willChange: "transform", // Hint for browser optimization
        }}
        animate={{
          x: isActive ? "-100%" : "0%", // Slide left when active
        }}
        transition={{
          type: "tween", // Use tween instead of spring for no bounce
          duration: 0.4, // Duration in seconds
          ease: "easeInOut", // Smooth acceleration and deceleration
        }}
      >
        {/* Main Panel */}
        <BasePanel
          paddingVariant="wide"
          fullHeight={false}
          sx={{
            backgroundColor: bgColor,
            py: 12, // vertical padding
            color: "white",
            position: "relative", // For absolute positioning of icons
            borderRadius: 0, // No border radius
            height: "100%", // Fill the full height
          }}
        >
          <Grid container spacing={6} alignItems="flex-start">
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                pt: 0,
              }}
            >
              {title}
            </Grid>
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{ display: "flex", alignItems: "flex-start" }}
            >
              {content}
            </Grid>
          </Grid>

          {/* Right centered play icon */}
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

          {/* Bottom scroll icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              position: "absolute",
              bottom: 20,
              left: 0,
            }}
          >
            <IconButton
              sx={{
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
          </Box>
        </BasePanel>
      </motion.div>

      {/* Detail panel - positioned absolutely, outside viewport initially */}
      <motion.div
        ref={detailRef}
        className={isActive ? "active-detail-panel" : ""}
        style={{
          position: "absolute", // Take out of normal flow
          top: 0,
          left: "100%", // Start positioned to the right of viewport
          width: "100%", // Same width as main panel
          height: "auto", // Let it grow taller if needed
          willChange: "transform",
        }}
        animate={{
          x: isActive ? "-100%" : "0%", // Slide left when active
        }}
        transition={{
          type: "tween", // Use tween instead of spring for no bounce
          duration: 0.4, // Duration in seconds
          ease: "easeInOut", // Smooth acceleration and deceleration
        }}
      >
        {/* Detail Panel */}
        <BasePanel
          paddingVariant="wide"
          fullHeight={false}
          sx={{
            backgroundColor: detailBgColor,
            py: 12, // vertical padding
            color: "white",
            position: "relative",
            borderRadius: 0, // No border radius
            minHeight: "100%", // At least as tall as container
            height: "auto", // Grow with content
          }}
        >
          <Grid container spacing={6} alignItems="flex-start">
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                pt: 0,
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
              top: "50%",
              transform: "translateY(-50%) rotate(180deg)",
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

          {/* Bottom centered play icon */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              position: "absolute",
              bottom: 20,
              left: 0,
            }}
          >
            <IconButton
              sx={{
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
          </Box>
        </BasePanel>
      </motion.div>
    </Box>
  )
}
