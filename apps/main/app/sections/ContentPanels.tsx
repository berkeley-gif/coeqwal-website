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
  // const { activeTab } = useDrawerStore()
  const drawerStore = useDrawerStore.getState()

  // Handler to toggle the Learn drawer
  // const handleToggleLearnDrawer = () => {
  //   if (activeTab === "learn") {
  //     // If already open, close it (toggle behavior)
  //     drawerStore.closeDrawer()
  //   } else {
  //     // Open the drawer, either using prop or direct access
  //     if (onOpenLearnDrawer) {
  //       onOpenLearnDrawer("california-water") // Section ID
  //     } else {
  //       // Direct access pattern used by LearnMoreButtons
  //       drawerStore.setDrawerContent({ selectedSection: "california-water" })
  //       drawerStore.openDrawer("learn")
  //     }
  //   }
  // }

  // Sample learn cards data
  const learnCards: LearnCardType[] = [
    {
      title: "How water moves through California",
      content:
        "Most of California's water falls as rain and snow. This precipitation is highly variable both across the state and from year to year.",
      image: "/images/DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
      type: "resource",
    },
    {
      title: "How California's water is managed",
      content:
        "An introduction to the complex water infrastructure across the state.",
      image: "/images/DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
      type: "article",
    },
    {
      title: "Climate change and California water",
      content:
        "Learn about the impacts of climate change on the future of California water.",
      image: "/images/DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
      type: "video",
    },
    {
      title: "Equity in California water",
      content:
        "An overview of key water policies and regulations shaping water management decisions.",
      type: "resource",
    },
  ]

  // Sample scenario cards data
  const scenarioCards: LearnCardType[] = [
    {
      title: "Current Operations",
      content: "Lorem ipsum",
      image: "/images/DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
      type: "resource",
    },
    {
      title: "What if we limit groundwater pumping?",
      content: "Lorem ipsum",
      image: "/images/DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
      type: "article",
    },
    {
      title: "What if we changed how water flows in our streams?",
      content: "Lorem ipsum",
      image: "/images/DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
      type: "resource",
    },
    {
      title: "What if we prioritized drinking water?",
      content: "Lorem ipsum",
      type: "video",
    },
  ]

  // Handle scenario card click to open the themes drawer with appropriate operation
  const handleScenarioCardClick = (index: number) => {
    // Map index to an operation ID (this should be more dynamic in a real implementation)
    const operationMappings = [
      "delta-operations",
      "climate-change",
      "water-storage",
      "groundwater",
    ]

    const operationId = operationMappings[index] || "delta-operations"

    // Access the drawer store directly since we don't have an onOpenThemesDrawer prop
    drawerStore.setDrawerContent({ selectedOperation: operationId })
    drawerStore.openDrawer("glossary")
  }

  // Handle card click to open the learn drawer with the appropriate section
  const handleCardClick = (index: number) => {
    // Special case for the first card - open external link
    if (index === 0) {
      window.location.href = "https://flow.coeqwal.org"
      return
    }

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
      drawerStore.openDrawer("glossary")
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
            title="California Water Learning Library"
            cards={learnCards}
            onCardClick={handleCardClick}
          />
        </Box>
      </BasePanel>

      {/* Second Panel */}
      <BasePanel
        paddingVariant="wide"
        sx={{
          backgroundColor: "#2f84ab",
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

        {/* Scenario Card Carousel - positioned below the grid to span full width */}
        <Box sx={{ width: "100%" }}>
          <LearnCardCarousel
            title="Scenario Library"
            cards={scenarioCards}
            onCardClick={handleScenarioCardClick}
          />
        </Box>
      </BasePanel>

      {/* Third Panel - Purple background */}
      <BasePanel
        paddingVariant="wide"
        sx={{
          backgroundColor: "#135773",
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
