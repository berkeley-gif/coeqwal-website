import React from "react"
import { Box, Typography, Grid, IconButton } from "@repo/ui/mui"
import { BasePanel } from "@repo/ui"
import { PlayArrowIcon } from "@repo/ui/mui"

// Add props interface
interface ContentPanelsProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

export default function ContentPanels({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenLearnDrawer,
}: ContentPanelsProps = {}) {
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

  return (
    <Box id="content-panels">
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
            <PlayArrowIcon sx={{ fontSize: 36, transform: "rotate(90deg)" }} />
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
            <PlayArrowIcon sx={{ fontSize: 36, transform: "rotate(90deg)" }} />
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
            <PlayArrowIcon sx={{ fontSize: 36, transform: "rotate(90deg)" }} />
          </IconButton>
        </Box>
      </BasePanel>
    </Box>
  )
}
