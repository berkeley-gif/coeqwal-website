import React from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import FloatingMarker from "../components/FloatingMarker"
import WaterRipples from "../components/WaterRipples"
import { useDrawerStore } from "@repo/state"

const IntroSection: React.FC = () => {
  const { t } = useTranslation()

  // Hero section markers absolutely positioned to align with California map
  // TODO: this isn't the best approach for responsive design.
  const markerSpecs = [
    {
      src: "/images/markers/shasta.png",
      right: { xs: "25%", sm: "28%", md: "45%", lg: "45%", xl: "45%" },
      top: "30px",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/drinking_water.png",
      right: { xs: "13%", sm: "16%", md: "36%", lg: "36%", xl: "36%" },
      top: "50%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/los_angeles.png",
      right: { xs: "1%", sm: "2%", md: "20%", lg: "20%", xl: "20%" },
      top: "62%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/farmers.png",
      right: { xs: "3%", sm: "5%", md: "22%", lg: "22%", xl: "22%" },
      top: "38%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/salmon.png",
      right: { xs: "9%", sm: "12%", md: "30%", lg: "30%", xl: "30%" },
      top: "16%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
    {
      src: "/images/markers/atta.png",
      right: { xs: "21%", sm: "24%", md: "43%", lg: "43%", xl: "43%" },
      top: "30%",
      size: { xs: 160, sm: 180, md: 220, lg: 220, xl: 220 },
    },
  ] as const

  // page elements
  return (
    <Box
      sx={{
        background: (theme) => `
          linear-gradient(to bottom, ${theme.palette.brand.sky}, ${theme.palette.brand.water})
        `,
        minHeight: "200vh", // Ensure gradient covers first two panels
      }}
    >
      {/* First panel / Hero section */}
      {/* TODO: standardize panels into components for ui package */}
      <Box
        id="intro"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          background: `url('/images/california.png')`,
          backgroundSize: {
            xs: "auto 90%",
            sm: "auto 95%",
            md: "auto 100%",
            lg: "auto 100%",
            xl: "auto 100%",
          },
          backgroundPosition: {
            xs: "80% center",
            sm: "82% center",
            md: "85% center",
            lg: "85% center",
            xl: "85% center",
          },
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
          zIndex: 0,
          isolation: "isolate",
        }}
      >
        {/* Water ripples behind California image */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: -1, // Behind everything including California image
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <WaterRipples count={16} />
        </Box>

        {/* Water ripples in front of California image (behind markers) */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages - 1,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <WaterRipples count={16} />
        </Box>

        {/* Floating markers overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: (theme) => theme.zIndex.introBackgroundImages + 1,
            pointerEvents: "none",
          }}
        >
          {markerSpecs.map((m, i) => (
            <FloatingMarker key={i} {...m} />
          ))}
        </Box>

        {/* Hero text content */}
        <BasePanel
          id="intro-main"
          fullHeight={false}
          background="transparent"
          includeHeaderSpacing={false}
          sx={{
            paddingTop: { xs: "calc(64px + 3rem)", md: "calc(80px + 6rem)" }, // Header height + original padding
            paddingBottom: { xs: 3, md: 6 },
            paddingLeft: { xs: 6, md: 20 },
            paddingRight: { xs: 3, md: 6 },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Background circles (below text) - contained within the first 100vh */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: (theme) => theme.zIndex.introBackgroundImages,
              pointerEvents: "none",
            }}
          ></Box>

          {/* Text content on top of background circles */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              width: "100%",
              height: "100%",
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText, // Text layer
            }}
          >
            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Learn.
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Explore.
            </Typography>

            <Typography
              variant="h1"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mb: 2,
              }}
            >
              Empower.
            </Typography>

            <Typography
              variant="h3"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                mt: 2.5,
                mb: 2, // 1rem equivalent (16px)
              }}
            >
              Rethink California Water
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: (theme) => theme.palette.blue.darkest,
                maxWidth: "500px",
              }}
            >
              Explore a range of Central Valley water scenarios and discover
              possibilities for the future of water in our state, under current
              conditions and future climates.
            </Typography>

            {/* Play arrow icon pointing down */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                width: "500px",
              }}
            >
              <PlayArrowIcon
                sx={{
                  color: (theme) => theme.palette.blue.darkest,
                  fontSize: "3rem", // Using rem units for consistency
                  transform: "rotate(90deg)",
                  pointerEvents: "auto",
                }}
                onClick={() => {
                  // Scroll to the next section with improved positioning
                  const interstitialSection =
                    document.getElementById("overview")
                  if (interstitialSection) {
                    // Get the exact position of the interstitial section
                    const rect = interstitialSection.getBoundingClientRect()
                    const currentScrollTop =
                      window.pageYOffset || document.documentElement.scrollTop

                    // Calculate target position, accounting for any header offset
                    const targetPosition = rect.top + currentScrollTop - 20 // Small offset for better positioning

                    // Use requestAnimationFrame to ensure smooth scrolling doesn't interfere with manual scrolling
                    requestAnimationFrame(() => {
                      window.scrollTo({
                        top: targetPosition,
                        behavior: "smooth",
                      })
                    })
                  }
                }}
              />
            </Box>
          </Box>
        </BasePanel>
      </Box>

      {/* Second panel - Overview content */}
      <Box
        id="overview"
        sx={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          background: `
            url('/images/home_collage/birds_top.png'),
            url('/images/home_collage/left_side.png'),
            url('/images/home_collage/right_side.png')
          `,
          backgroundSize: "auto 44%, auto 80%, auto calc(100vh - 80px)",
          backgroundPosition: "left top, left bottom, right bottom",
          backgroundRepeat: "no-repeat, no-repeat, no-repeat",
          overflow: "hidden",
        }}
      >
        <BasePanel
          fullHeight={false}
          background="transparent"
          paddingVariant="wide"
          includeHeaderSpacing={false}
          sx={{
            color: (theme) => theme.palette.primary.dark,
            paddingLeft: { xs: 6, md: 20 },
            paddingRight: { xs: 3, md: 6 },
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "visible",
          }}
        >
          {/* Spacer for header */}
          <Box sx={{ height: { xs: "64px", md: "80px" } }} />

          {/* Content container for proper blending context */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              flex: 1, // Take up remaining space
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText, // Text layer
            }}
          >
            {/* Text content with mix-blend-mode */}
            <Box
              maxWidth="800px"
              sx={{
                position: "relative",
                zIndex: (theme) => theme.zIndex.introText,
                mb: 36,
              }}
            >
              {/* TODO: this section is a mess and needs some TLC */}
              <Stack spacing={4}>
                <Typography
                  variant="h2"
                  sx={{
                    color: (theme) => theme.palette.blue.darkest,
                    mb: 3,
                  }}
                >
                  What is California&apos;s
                  <br />
                  water future?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  {(() => {
                    const text = t("interstitial.part1")

                    // Check for all four terms: "surface water", "conveyance", "allocation", and "Central Valley"
                    const surfaceWaterIndex = text.indexOf("surface water")
                    const conveyanceIndex = text.indexOf("conveyance")
                    const allocationIndex = text.indexOf("allocation")
                    const centralValleyIndex = text.indexOf("Central Valley")

                    if (
                      surfaceWaterIndex !== -1 &&
                      conveyanceIndex !== -1 &&
                      allocationIndex !== -1 &&
                      centralValleyIndex !== -1
                    ) {
                      // All four terms found - handle them in order of appearance
                      const beforeSurfaceWater = text.substring(
                        0,
                        surfaceWaterIndex,
                      )
                      const afterSurfaceWater = text.substring(
                        surfaceWaterIndex + 13,
                      ) // 13 is length of "surface water"

                      const conveyanceIndexInRemainder =
                        afterSurfaceWater.indexOf("conveyance")
                      const beforeConveyance = afterSurfaceWater.substring(
                        0,
                        conveyanceIndexInRemainder,
                      )
                      const afterConveyance = afterSurfaceWater.substring(
                        conveyanceIndexInRemainder + 10,
                      ) // 10 is length of "conveyance"

                      const allocationIndexInRemainder =
                        afterConveyance.indexOf("allocation")
                      const beforeAllocation = afterConveyance.substring(
                        0,
                        allocationIndexInRemainder,
                      )
                      const afterAllocation = afterConveyance.substring(
                        allocationIndexInRemainder + 10,
                      ) // 10 is length of "allocation"

                      const centralValleyIndexInRemainder =
                        afterAllocation.indexOf("Central Valley")
                      const beforeCentralValley = afterAllocation.substring(
                        0,
                        centralValleyIndexInRemainder,
                      )
                      const afterCentralValley = afterAllocation.substring(
                        centralValleyIndexInRemainder + 14,
                      ) // 14 is length of "Central Valley"

                      return (
                        <>
                          {beforeSurfaceWater}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: 0,
                              paddingBottom: "0.5rem",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with surface water term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Surface water",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            surface water
                          </Box>
                          {beforeConveyance}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: "0em",
                              paddingBottom: "0.5em",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with conveyance term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Conveyance",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            conveyance
                          </Box>
                          {beforeAllocation}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: "0em",
                              paddingBottom: "0.5em",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with allocation term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Allocation",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            allocation
                          </Box>
                          {beforeCentralValley}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: "0em",
                              paddingBottom: "0.5em",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with Central Valley term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Central Valley",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            Central Valley
                          </Box>
                          {afterCentralValley}
                        </>
                      )
                    }

                    // Fallback to existing logic if not all four terms are found
                    // First check for "surface water" and split if found
                    if (surfaceWaterIndex !== -1) {
                      // Text before "surface water"
                      const beforeSurfaceWater = text.substring(
                        0,
                        surfaceWaterIndex,
                      )

                      // Get text after "surface water" to look for "conveyance"
                      const afterSurfaceWaterText = text.substring(
                        surfaceWaterIndex + 13,
                      ) // 13 is length of "surface water"

                      // Look for "conveyance" in the remaining text
                      const conveyanceIndexInText =
                        afterSurfaceWaterText.indexOf("conveyance")

                      if (conveyanceIndexInText !== -1) {
                        // Text between "surface water" and "conveyance"
                        const betweenText = afterSurfaceWaterText.substring(
                          0,
                          conveyanceIndexInText,
                        )

                        // Text after "conveyance"
                        const afterConveyanceText =
                          afterSurfaceWaterText.substring(
                            conveyanceIndexInText + 10,
                          ) // 10 is length of "conveyance"

                        return (
                          <>
                            {beforeSurfaceWater}
                            <Box
                              component="span"
                              sx={{
                                backgroundColor: "transparent",
                                borderBottom: (theme) =>
                                  `3px solid ${theme.palette.blue.darkest}`,
                                color: (theme) => theme.palette.blue.darkest,
                                py: 0.1,
                                mx: 0.2,
                                lineHeight: "0em",
                                paddingBottom: "0.5em",
                                cursor: "pointer",
                                display: "inline-block",
                                position: "relative",
                                "&:hover": {
                                  borderBottom: (theme) =>
                                    `5px solid ${theme.palette.blue.darkest}`,
                                },
                              }}
                              onClick={() => {
                                // Open glossary drawer with surface water term
                                const drawerStore = useDrawerStore.getState()
                                drawerStore.setDrawerContent({
                                  selectedSection: "glossary",
                                  selectedTerm: "Surface water",
                                })
                                drawerStore.openDrawer("glossary")
                              }}
                            >
                              surface water
                            </Box>
                            {betweenText}
                            <Box
                              component="span"
                              sx={{
                                backgroundColor: "transparent",
                                borderBottom: (theme) =>
                                  `3px solid ${theme.palette.blue.darkest}`,
                                color: (theme) => theme.palette.blue.darkest,
                                py: 0.1,
                                mx: 0.2,
                                lineHeight: "0em",
                                paddingBottom: "0.5em",
                                cursor: "pointer",
                                display: "inline-block",
                                position: "relative",
                                "&:hover": {
                                  borderBottom: (theme) =>
                                    `5px solid ${theme.palette.blue.darkest}`,
                                },
                              }}
                              onClick={() => {
                                // Open glossary drawer with conveyance term
                                const drawerStore = useDrawerStore.getState()
                                drawerStore.setDrawerContent({
                                  selectedSection: "glossary",
                                  selectedTerm: "Conveyance",
                                })
                                drawerStore.openDrawer("glossary")
                              }}
                            >
                              conveyance
                            </Box>
                            {afterConveyanceText}
                          </>
                        )
                      }

                      // If conveyance not found, just highlight surface water
                      return (
                        <>
                          {beforeSurfaceWater}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: "0em",
                              paddingBottom: "0.5em",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with surface water term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Surface water",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            surface water
                          </Box>
                          {afterSurfaceWaterText}
                        </>
                      )
                    }

                    // If surface water not found, check for conveyance only (fallback)
                    return text.split("conveyance").map((part, i, array) => {
                      // If this is the last part, no need to add the highlighted word
                      if (i === array.length - 1) return part

                      return (
                        <React.Fragment key={i}>
                          {part}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "transparent",
                              borderBottom: (theme) =>
                                `3px solid ${theme.palette.blue.darkest}`,
                              color: (theme) => theme.palette.blue.darkest,
                              py: 0.1,
                              mx: 0.2,
                              lineHeight: "0em",
                              paddingBottom: "0.5em",
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative",
                              "&:hover": {
                                borderBottom: (theme) =>
                                  `5px solid ${theme.palette.blue.darkest}`,
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with conveyance term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Conveyance",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            conveyance
                          </Box>
                        </React.Fragment>
                      )
                    })
                  })()}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  {(() => {
                    const text = t("interstitial.part2")

                    // Create an array of all terms to link with their positions
                    const terms = [
                      { name: "storage", glossaryTerm: "Storage" },
                      { name: "conveyance", glossaryTerm: "Conveyance" },
                      { name: "deliveries", glossaryTerm: "Deliveries" },
                      {
                        name: "operational decisions",
                        glossaryTerm: "Operational decisions",
                      },
                      {
                        name: "CalSim",
                        glossaryTerm: "Computer models / CalSim",
                      },
                      { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                      { name: "scenarios", glossaryTerm: "Scenarios" },
                      { name: "climate", glossaryTerm: "Changing climate" },
                    ]

                    // Find all term positions in the text
                    const foundTerms = terms
                      .map((term) => ({
                        ...term,
                        index: text.indexOf(term.name),
                        length: term.name.length,
                      }))
                      .filter((term) => term.index !== -1)
                      .sort((a, b) => a.index - b.index)

                    if (foundTerms.length === 0) {
                      return text
                    }

                    // Build the result by processing terms in order
                    const result: React.ReactNode[] = []
                    let currentIndex = 0

                    foundTerms.forEach((term, i) => {
                      // Add text before this term
                      result.push(text.substring(currentIndex, term.index))

                      // Add the linked term
                      result.push(
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            backgroundColor: "transparent",
                            borderBottom: (theme) =>
                              `3px solid ${theme.palette.blue.darkest}`,
                            color: (theme) => theme.palette.blue.darkest,
                            py: 0.1,
                            mx: 0.2,
                            lineHeight: "0em",
                            paddingBottom: "0.5em",
                            cursor: "pointer",
                            display: "inline-block",
                            position: "relative",
                            "&:hover": {
                              borderBottom: (theme) =>
                                `5px solid ${theme.palette.blue.darkest}`,
                            },
                          }}
                          onClick={() => {
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: term.glossaryTerm,
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          {term.name}
                        </Box>,
                      )

                      currentIndex = term.index + term.length
                    })

                    // Add remaining text after the last term
                    result.push(text.substring(currentIndex))

                    return <>{result}</>
                  })()}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: (theme) => theme.palette.blue.darkest }}
                >
                  {(() => {
                    const text = t("interstitial.part3")

                    // Create an array of all terms to link and format
                    const terms = [
                      { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                      { name: "scenarios", glossaryTerm: "Scenarios" },
                      {
                        name: "changing climate",
                        glossaryTerm: "Changing climate",
                      },
                    ]

                    // Find all term positions in the text
                    const foundTerms = terms
                      .map((term) => ({
                        ...term,
                        index: text.indexOf(term.name),
                        length: term.name.length,
                      }))
                      .filter((term) => term.index !== -1)
                      .sort((a, b) => a.index - b.index)

                    if (foundTerms.length === 0) {
                      return text
                    }

                    // Build the result by processing terms in order
                    const result: React.ReactNode[] = []
                    let currentIndex = 0

                    foundTerms.forEach((term, i) => {
                      // Add text before this term
                      result.push(text.substring(currentIndex, term.index))

                      // Add the linked term
                      result.push(
                        <Box
                          key={i}
                          component="span"
                          sx={{
                            backgroundColor: "transparent",
                            borderBottom: (theme) =>
                              `3px solid ${theme.palette.blue.darkest}`,
                            color: (theme) => theme.palette.blue.darkest,
                            py: 0.1,
                            mx: 0.2,
                            lineHeight: "0em",
                            paddingBottom: "0.5em",
                            cursor: "pointer",
                            display: "inline-block",
                            position: "relative",
                            "&:hover": {
                              borderBottom: (theme) =>
                                `5px solid ${theme.palette.blue.darkest}`,
                            },
                          }}
                          onClick={() => {
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: term.glossaryTerm,
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          {term.name}
                        </Box>,
                      )

                      currentIndex = term.index + term.length
                    })

                    // Add remaining text after the last term
                    result.push(text.substring(currentIndex))

                    return <>{result}</>
                  })()}
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    color: (theme) => theme.palette.blue.darkest,
                    mt: 2,
                  }}
                >
                  what if we did things differently?
                </Typography>
              </Stack>
            </Box>
          </Box>
        </BasePanel>
      </Box>
    </Box>
  )
}

export default IntroSection
