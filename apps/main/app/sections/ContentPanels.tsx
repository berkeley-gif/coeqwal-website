import React from "react"
import { Box, Typography, Grid } from "@repo/ui/mui"
import { BasePanel, LearnCardCarousel } from "@repo/ui"
import { useDrawerStore } from "@repo/state"

// Define the card type locally
interface LearnCardType {
  title: string
  content: string
  image?: string
  type: "resource" | "article" | "video"
}

// Add props interface
interface ContentPanelsProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

export default function ContentPanels({
  onOpenLearnDrawer,
}: ContentPanelsProps = {}) {
  // Initialize drawer store
  const { activeTab } = useDrawerStore()
  const drawerStore = useDrawerStore.getState()

  // Handler to toggle the Learn drawer
  const handleToggleLearnDrawer = () => {
    if (activeTab === "learn") {
      // If already open, close it (toggle behavior)
      drawerStore.closeDrawer()
    } else {
      // Open the drawer, either using prop or direct access
      if (onOpenLearnDrawer) {
        onOpenLearnDrawer("california-water") // Section ID
      } else {
        // Direct access pattern used by LearnMoreButtons
        drawerStore.setDrawerContent({ selectedSection: "california-water" })
        drawerStore.openDrawer("learn")
      }
    }
  }

  // Sample learn cards data
  const learnCards: LearnCardType[] = [
    {
      title: "Understanding California's Water Systems",
      content:
        "An introduction to the complex water infrastructure across the state, including reservoirs, aqueducts, and groundwater basins.",
      image:
        "https://images.unsplash.com/photo-1534251623184-22cb7e61c526?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      type: "resource",
    },
    {
      title: "Sacramento-San Joaquin Delta",
      content:
        "Explore the critical Delta region where rivers meet the San Francisco Bay, a vital ecosystem and water hub.",
      image:
        "https://images.unsplash.com/photo-1590332088237-fa156a5f8bea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2874&q=80",
      type: "article",
    },
    {
      title: "Groundwater Sustainability",
      content:
        "Learn about the impacts of groundwater management and sustainable aquifer replenishment strategies.",
      image:
        "https://images.unsplash.com/photo-1620207418302-439b387441b0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80",
      type: "video",
    },
    {
      title: "California Water Policy",
      content:
        "An overview of key water policies and regulations shaping water management decisions.",
      image:
        "https://images.unsplash.com/photo-1548407260-da850faa41e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2487&q=80",
      type: "resource",
    },
  ]

  // Handle card click to open the learn drawer with the appropriate section
  const handleCardClick = (index: number) => {
    // Map index to a section ID (this should be more dynamic in a real implementation)
    const sectionMappings = [
      "california-water",
      "delta-operations",
      "groundwater",
      "water-policy",
    ]

    const sectionId = sectionMappings[index] || "california-water"

    if (onOpenLearnDrawer) {
      onOpenLearnDrawer(sectionId)
    } else {
      drawerStore.setDrawerContent({ selectedSection: sectionId })
      drawerStore.openDrawer("learn")
    }
  }

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
      Empower
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
      Act
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
        Use our{" "}
        <Box
          component="span"
          onClick={handleToggleLearnDrawer}
          sx={{
            textDecoration: "underline",
            cursor: "pointer",
            pointerEvents: "auto",
            "&:hover": {
              opacity: 0.8,
            },
          }}
        >
          California Water Learning Library
        </Box>{" "}
        to deepen your understanding, explore key topics, and become an informed
        advocate.
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
        Explore these scenarios and empower your community with actionable
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
        paddingVariant="very-wide"
        sx={{
          backgroundColor: "#1A3F6A", // Deep blue
          py: 12, // vertical padding
          color: "white",
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

        {/* Learn Card Carousel - positioned below the grid to span full width */}
        <Box sx={{ width: "100%" }}>
          <LearnCardCarousel
            title="Learning Resources"
            cards={learnCards}
            onCardClick={handleCardClick}
          />
        </Box>
      </BasePanel>

      {/* Second Panel - Teal background */}
      <BasePanel
        paddingVariant="very-wide"
        sx={{
          backgroundColor: "#005B6E", // Teal
          py: 12,
          color: "white", // Ensure text color is white
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
      </BasePanel>

      {/* Third Panel - Purple background */}
      <BasePanel
        paddingVariant="very-wide"
        sx={{
          backgroundColor: "#3A3F79", // Deep purple
          py: 12,
          color: "white", // Ensure text color is white
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
      </BasePanel>
    </Box>
  )
}
