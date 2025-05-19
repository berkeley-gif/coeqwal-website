import React, { useState } from "react"
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
  // State to track if we're showing the detail panel
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  // Track which panel's details we're showing
  const [activePanel, setActivePanel] = useState<PanelType>(null)

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

  // Function to trigger transition to detail panel
  const handleShowDetail = (panelType: PanelType) => {
    setActivePanel(panelType)
    setShowDetailPanel(true)
  }

  // Function to go back to main panels
  const handleBackToMain = () => {
    setShowDetailPanel(false)
  }

  // Get details content based on active panel
  const getDetailContent = () => {
    switch (activePanel) {
      case "learn":
        return (
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
              <Typography
                variant="body2"
                color="common.white"
                sx={{ mb: 4 }}
              >
                This detailed panel provides in-depth information about California's
                water system and the complex journey water takes throughout the state.
              </Typography>
              <Typography variant="body2" color="common.white">
                Understanding California's water system means appreciating its geography,
                climate, infrastructure, and policy frameworks. The state's water management
                includes a complex network of reservoirs, aqueducts, and groundwater basins 
                that work together to meet environmental, agricultural, and urban needs.
              </Typography>
            </Box>
          </>
        )
      case "explore":
        return (
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
              <Typography
                variant="body2"
                color="common.white"
                sx={{ mb: 4 }}
              >
                The COEQWAL modeling tools provide unprecedented insights into 
                California's water management options under various scenarios.
              </Typography>
              <Typography variant="body2" color="common.white">
                Our models incorporate decades of historical data, climate projections,
                water rights frameworks, infrastructure capabilities, and environmental
                requirements. By exploring different management approaches, users can
                understand tradeoffs between different water management strategies and
                their impacts on communities, agriculture, and ecosystems.
              </Typography>
            </Box>
          </>
        )
      case "empower":
        return (
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
              <Typography
                variant="body2"
                color="common.white"
                sx={{ mb: 4 }}
              >
                Informed communities can advocate effectively for water policies
                that meet their unique needs while respecting the larger water system.
              </Typography>
              <Typography variant="body2" color="common.white">
                The COEQWAL project helps community members and decision-makers
                understand the complex interrelationships in California's water system.
                By providing accessible data and visualizations, we empower stakeholders
                to participate meaningfully in water planning processes and advocate
                for sustainable, equitable water solutions that benefit diverse communities
                across the state.
              </Typography>
            </Box>
          </>
        )
      default:
        return null
    }
  }

  // Get background color for detail panel based on active panel
  const getDetailPanelBgColor = () => {
    switch (activePanel) {
      case "learn":
        return "#134970" // Darker blue than the Learn panel
      case "explore":
        return "#1E657D" // Darker teal than the Explore panel
      case "empower":
        return "#0A3D50" // Darker teal than the Empower panel
      default:
        return "#005066" // Default dark teal
    }
  }

  return (
    <Box sx={{ position: "relative", overflow: "hidden", width: "100%" }}>
      {/* Creating a container that's twice the viewport width with both panels side by side */}
      <motion.div
        style={{ 
          display: "flex",
          width: "200%", // Double the width to contain both panels
          position: "relative",
        }}
        animate={{ 
          x: showDetailPanel ? "-50%" : "0%", // Move left by 50% when showing detail
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        {/* Left side - Original stacked content panels */}
        <Box
          id="content-panels"
          sx={{ 
            width: "50%", // 50% of the container (100% of viewport)
            flexShrink: 0,
          }}
        >
          {/* First Panel - Deep blue background */}
          <BasePanel
            paddingVariant="wide"
            fullHeight={false}
            sx={{
              backgroundColor: "#1A3F6A", // Deep blue
              py: 12, // vertical padding
              color: "white",
              position: "relative", // For absolute positioning of icons
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
                <LearnTextContent />
              </Grid>
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Panel1Content />
              </Grid>
            </Grid>

            {/* Right centered play icon */}
            <IconButton
              onClick={() => handleShowDetail("learn")}
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

          {/* Second Panel */}
          <BasePanel
            paddingVariant="wide"
            fullHeight={false}
            sx={{
              backgroundColor: "#2f84ab",
              py: 12,
              color: "white", // Ensure text color is white
              position: "relative", // For absolute positioning of icons
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
                <EmpowerTextContent />
              </Grid>
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Panel2Content />
              </Grid>
            </Grid>

            {/* Right centered play icon */}
            <IconButton
              onClick={() => handleShowDetail("explore")}
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

          {/* Third Panel - Purple background */}
          <BasePanel
            paddingVariant="wide"
            fullHeight={false}
            sx={{
              backgroundColor: "#135773",
              py: 12,
              color: "white", // Ensure text color is white
              position: "relative", // For absolute positioning of icons
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
                <ActTextContent />
              </Grid>
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Panel3Content />
              </Grid>
            </Grid>

            {/* Right centered play icon */}
            <IconButton
              onClick={() => handleShowDetail("empower")}
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
        </Box>

        {/* Right side - Detail panel (connected visually) */}
        <Box
          sx={{ 
            width: "50%", // 50% of the container (100% of viewport)
            flexShrink: 0,
          }}
        >
          <BasePanel
            paddingVariant="wide"
            fullHeight={false}
            sx={{
              backgroundColor: getDetailPanelBgColor(), // Dynamic color based on active panel
              py: 12,
              minHeight: "100vh", // Match the height of stack panels
              color: "white",
              position: "relative",
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
                {/* Dynamic title and content based on active panel */}
                {getDetailContent()}
              </Grid>
            </Grid>

            {/* Left arrow to go back to main panels */}
            <IconButton
              onClick={handleBackToMain}
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
        </Box>
      </motion.div>
    </Box>
  )
}
