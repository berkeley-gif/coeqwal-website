import React, { useState } from "react"
import { Box, Typography, Grid, IconButton } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
import { PlayArrowIcon } from "@repo/ui/mui"
import { motion } from "@repo/motion"

// Add props interface
interface ContentPanelsProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

export default function ContentPanels({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenLearnDrawer,
}: ContentPanelsProps = {}) {
  // State to track if we're showing the detail panel
  const [showDetailPanel, setShowDetailPanel] = useState(false)

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
  const handleShowDetail = () => {
    setShowDetailPanel(true)
  }

  // Function to go back to main panels
  const handleBackToMain = () => {
    setShowDetailPanel(false)
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
              onClick={handleShowDetail}
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
              onClick={handleShowDetail}
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
              onClick={handleShowDetail}
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
              backgroundColor: "#005066", // Darker teal for detail panel
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
                <Typography
                  variant="h1"
                  color="common.white"
                  sx={{
                    fontSize: "5rem",
                    fontWeight: 700,
                    alignSelf: "flex-start",
                  }}
                >
                  Details
                </Typography>
              </Grid>
              <Grid
                size={{ xs: 12, md: 8 }}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    color="common.white"
                    sx={{ mb: 4 }}
                  >
                    This is the detail panel that appears connected to the right
                    of the main panels. When the user clicks on any right arrow,
                    both panels shift leftward together as a single unit,
                    revealing this content.
                  </Typography>
                  <Typography variant="body2" color="common.white">
                    This detail panel could contain deeper information about the
                    topics in the main panels, including detailed explanations,
                    charts, graphs, or other visualizations that help users
                    better understand California water systems.
                  </Typography>
                </Box>
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
