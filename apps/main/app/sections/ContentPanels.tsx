import React, { useState, useEffect, useRef } from "react"
import { Box, Typography, Grid, IconButton, useTheme, useMediaQuery } from "@repo/ui/mui"
import type { Theme } from "@mui/material/styles"
import { BasePanel, LeadingMarkerText, ArrowHead, Spacer } from "@repo/ui"
import { motion, AnimatePresence } from "@repo/motion"

interface ContentPanelsProps {
  onOpenLearnDrawer?: (sectionId: string) => void
}

type PanelType = "learn" | "explore" | "empower" | null

export default function ContentPanels({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenLearnDrawer
}: ContentPanelsProps = {}) {
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

  // Function to toggle showing/hiding detail for a panel
  const togglePanelDetail = (panelType: PanelType) => {
    if (activePanel === panelType) {
      setActivePanel(null) // Hide detail if same panel clicked
    } else {
      setActivePanel(panelType) // Show detail for the clicked panel
    }
  }

  // Scroll to the next section after the content panels
  const scrollToNextSection = () => {
    const root = document.getElementById("content-panels")
    if (root) {
      const nextEl = root.nextElementSibling as HTMLElement | null
      if (nextEl) {
        const rect = nextEl.getBoundingClientRect()
        const currentTop =
          window.pageYOffset || document.documentElement.scrollTop
        const target = rect.top + currentTop - 20
        window.scrollTo({ top: target, behavior: "smooth" })
        return
      }
    }
    // Fallback: scroll one viewport height
    window.scrollBy({ top: window.innerHeight, left: 0, behavior: "smooth" })
  }

  const LearnSimple = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        alignItems: "center",
        gap: { xs: 2, md: 3 },
        color: (theme) => theme.palette.blue.darkest,
        width: "100%",
      }}
    >
      {/* Text column */}
      <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
        <LeadingMarkerText title="Learn">
          <Typography variant="body1">
            Many Californians would be surprised to learn how controlled our
            state&apos;s water is. Californians share water through one of the
            largest and most complex conveyance and allocation systems in the
            world, particularly in the Central Valley. Learn how California
            water flows and water management decisions balance water needs
            across the state.
          </Typography>
        </LeadingMarkerText>
      </Box>
      {/* Image column */}
      <Box
        sx={{ order: { xs: 1, md: 2 }, minWidth: 0, display: "flex", justifyContent: "center" }}
      >
        <Box
          component="img"
          src="/images/content/learn.png"
          alt="Learn"
          sx={{ width: "100%", maxWidth: { xs: 420, md: 520 }, height: "auto" }}
        />
      </Box>
    </Box>
  )

  const ExploreSimple = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
        alignItems: "center",
        gap: { xs: 2, md: 3 },
        color: (theme) => theme.palette.blue.darkest,
        width: "100%",
        paddingTop: { xs: 3, md: 10 },
      }}
    >
      {/* Image column */}
      <Box
        sx={{ order: { xs: 2, md: 1 }, minWidth: 0, display: "flex", justifyContent: "center" }}
      >
        <Box
          component="img"
          src="/images/content/explore.png"
          alt="Explore"
          sx={{ width: "100%", maxWidth: { xs: 420, md: 500 }, height: "auto" }}
        />
      </Box>
      {/* Text column */}
      <Box sx={{ order: { xs: 2, md: 1 }, minWidth: 0 }}>
        <LeadingMarkerText title="Explore">
          <Typography variant="body1">
            COEQWAL&apos;s scenarios by theme
          </Typography>
        </LeadingMarkerText>
      </Box>
    </Box>
  )

  const EmpowerSimple = () => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr",
        placeItems: "center",
        gap: 2,
        color: (theme) => theme.palette.blue.darkest,
        width: "100%",
        paddingTop: { xs: 3, md: 10 },
      }}
    >
      <LeadingMarkerText title="Empower">
        <Typography variant="body1">
          your community with data that helps you understand the impacts of
          operational decisions
        </Typography>
      </LeadingMarkerText>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <IconButton
          color="inherit"
          aria-label="open-empower"
          sx={(theme) => ({
            width: 48,
            height: 48,
            borderRadius: theme.borderRadius.rounded,
            border: "none",
          })}
          onClick={scrollToNextSection}
        >
          <ArrowHead
            style={{ width: 36, height: 36, transform: "rotate(90deg)" }}
          />
        </IconButton>
      </Box>
    </Box>
  )
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

  return (
    <BasePanel
      id="content-panels"
      fullHeight={false}
      background="transparent"
      paddingVariant="wide"
      sx={{
        position: "relative",
        overflowX: "clip", // Prevent horizontal scrolling
        overflowY: "visible", // Allow natural vertical flow
        width: "100%", // Full width of parent
        maxWidth: "100%", // Ensure it doesn't exceed parent width
        boxSizing: "border-box", // Include padding in width calculation
        userSelect: "text", // Ensure text is selectable
        zIndex: (theme) => theme.zIndex.floatingElements, // Ensure it stays above IntroSection
        margin: 0, // Remove any default margins
        transform: "translateZ(0)", // Force new stacking context
        isolation: "isolate", // Create stacking context
        bgcolor: (theme) => theme.palette.brand.water,
        paddingTop: { xs: 4, md: 6 }, // Override the wide padding variant's large top padding (120px -> 24px/48px)

        // Custom styling to ensure proper overlapping
        "& .active-panel-container": {
          zIndex: 3, // Push active panels above others (within content layer)
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

      <Spacer height={{ xs: 66, md: 72 }} />

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
          zIndex: 1, // Base level within content layer
          overflow: "visible",
          width: "100%", // Ensure content is limited to viewport width
        }}
      >
        {/* Panel Component - Learn (detail only) */}
        <PanelWithDetail
          panelType="learn"
          isActive={activePanel === "learn"}
          onToggleDetail={() => togglePanelDetail("learn")}
          bgColor={getPanelBgColor("learn", theme)}
          addBorder={false}
          hideBottomArrow={true}
          title={<LearnSimple />}
          detailContent={
            <>
              <ResponsiveDetailHeader label="Learn" onBack={() => togglePanelDetail("learn")} />
              <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1, pointerEvents: "auto" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Central Valley Water"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      A natural system fed by rain and snowpack
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
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
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Learn more: How water moves through California →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Managing California's Water"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Who decides where water goes and when?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      California&apos;s water is managed by a patchwork of
                      agencies, laws, and agreements. Decisions about Central
                      Valley water storage, delivery, and environmental flows
                      affect nearly every part of the state.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Learn more: How California&apos;s water is managed →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Growing Challenges"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
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
                        color: (theme) => theme.palette.blue.darkest,
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
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Learn more: Equity in California water →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Exploring California's Water Futures"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      What if we made different choices?
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      The COEQWAL project uses the CalSim3 computational model,
                      the same model used by state and federal agencies, to
                      simulate a range of alternative water futures. These
                      scenarios explore how changes in policy, priorities, and
                      climate could shape water availability, distribution, and
                      outcomes across California.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Learn more: Exploring water futures with CalSim3 →
                    </Box>
                  </LeadingMarkerText>
                </Grid>
              </Grid>
            </>
          }
        />

        {/* Panel Component - Explore (detail only) */}
        <PanelWithDetail
          panelType="explore"
          isActive={activePanel === "explore"}
          onToggleDetail={() => togglePanelDetail("explore")}
          bgColor={getPanelBgColor("explore", theme)}
          hideBottomArrow={true}
          title={<ExploreSimple />}
          detailContent={
            <>
              <ResponsiveDetailHeader label="Explore scenario themes" onBack={() => togglePanelDetail("explore")} />
              <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1, pointerEvents: "auto" }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Current operations"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Baseline scenarios show how California manages water
                      today. They serve as a reference point for current
                      operations – the laws, regulations, priorities, and
                      decisions that affect how California&apos;s water supply
                      is managed.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore current operations scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Managing river flows for the environment"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Balancing ecosystem needs with human uses
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Natural river systems have high flows in winter and low
                      flows in summer, supporting native fish, plants, and
                      wildlife. Today, the storage and diversion of water
                      especially for farms and communities have altered river
                      flow patterns. This means that rivers may no longer have
                      the water that ecosystems need.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore environmental flow scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Managing Groundwater in a Changing Agricultural Landscape"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Sustainable strategies for groundwater basins
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
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
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore groundwater sustainability scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Prioritizing Drinking Water for California Communities"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Ensuring safe, affordable water access for all
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      All Californians need water for drinking, cooking,
                      cleaning, and running businesses, schools, and hospitals.
                      But because of infrastructure problems and the way water
                      allocations are prioritized, some communities don&apos;t
                      always get the water they need. In these scenarios, we
                      focus on giving priority to community water needs and
                      measure how that affects both communities and other water
                      users.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore drinking water access scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Improving Delta Outflows for the Environment"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Supporting the Delta ecosystem and San Francisco Bay
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
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
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore Delta outflow scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Sustaining Uses in the Delta for Communities and Farms"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Protecting in-Delta water users and livelihoods
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Communities and farms in the Delta need freshwater water
                      for drinking water, recreation, and irrigation. However,
                      waters of the Delta can become too salty when river flows
                      are reduced from drought or reservoir operations.
                      California&apos;s water agencies must carefully manage how
                      reservoir operations, river flows, diversions for human
                      uses, and Delta exports affect water quality in the Delta.
                      This is becoming more challenging as rising sea levels
                      increase salinity in the Delta.
                    </Typography>
                    <Box
                      sx={{
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore in-Delta water use scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }} sx={{ pointerEvents: "auto" }}>
                  <LeadingMarkerText
                    title="Improving Reliability of Delta Exports for Farms and Communities"
                    headlineVariant="h5"
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 2,
                        opacity: 0.8,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      Ensuring consistent water deliveries to users south of the
                      Delta
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        mb: 3,
                        color: (theme) => theme.palette.blue.darkest,
                      }}
                    >
                      California&apos;s water system is designed and managed to
                      move water from the wetter Sacramento Basin in northern
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
                        color: (theme) => theme.palette.blue.darkest,
                        textDecoration: "none",
                        display: "block",
                        fontWeight: 500,
                        cursor: "default",
                      }}
                    >
                      Explore Delta export reliability scenarios →
                    </Box>
                  </LeadingMarkerText>
                </Grid>
              </Grid>
            </>
          }
        />

        {/* Empower panel */}
        <Box sx={{ py: { xs: 3, md: 5 } }}>
          <EmpowerSimple />
        </Box>
      </Box>
    </BasePanel>
  )
}

// Reusable back header with responsive vertical alignment for the arrow
function ResponsiveDetailHeader({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
      <IconButton
        onClick={onBack}
        sx={(t) => {
          const typography = t.typography.h2
          let fontSize = 16
          if (typeof typography.fontSize === "string") {
            fontSize = parseFloat(typography.fontSize) * 16
          } else if (typeof typography.fontSize === "number") {
            fontSize = typography.fontSize
          }
          const lineHeight = typeof typography.lineHeight === "number" ? typography.lineHeight : 1.2
          const firstLineHeight = fontSize * lineHeight
          const topOffset = (firstLineHeight - 48) / 2
          return { color: t.palette.blue.darkest, width: 48, height: 48, position: "relative", top: { xs: 0, md: Math.max(0, topOffset) } }
        }}
      >
        <ArrowHead style={{ width: 28, height: 28, transform: "rotate(180deg)" }} />
      </IconButton>
      <Typography variant="h2" sx={{ alignSelf: "flex-start", color: (t) => t.palette.blue.darkest }}>
        {label}
      </Typography>
    </Box>
  )
}

// PanelWithDetail component for each panel/detail pair
interface PanelWithDetailProps {
  panelType: PanelType
  isActive: boolean
  onToggleDetail: () => void
  bgColor: string
  title: React.ReactNode
  content?: React.ReactNode // Make content optional
  detailContent: React.ReactNode
  hideDetailArrow?: boolean
  addBorder?: boolean
  hideBottomArrow?: boolean
}

function PanelWithDetail({
  panelType,
  isActive,
  onToggleDetail,
  bgColor,
  title,
  content,
  detailContent,
  hideDetailArrow = false,
  addBorder = false,
  hideBottomArrow = false,
}: PanelWithDetailProps) {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const mainPanelRef = useRef<HTMLDivElement>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const isTablet = useMediaQuery(theme.breakpoints.up("md"))

  // Smooth height animation using Framer Motion's layout animations
  const [containerHeight, setContainerHeight] = useState<"auto" | number>(
    "auto",
  )

  useEffect(() => {
    if (!isActive) {
      setContainerHeight("auto")
      return
    }

    // Measure detail panel height after it's rendered
    const measureHeight = () => {
      if (detailPanelRef.current) {
        const height = detailPanelRef.current.scrollHeight
        setContainerHeight(height)
      }
    }

    // Small delay to ensure detail panel is rendered
    const timer = setTimeout(measureHeight, 50)

    return () => clearTimeout(timer)
  }, [isActive])

  return (
    <motion.div
      ref={containerRef}
      id="detail-panel"
      className={isActive ? "active-panel-container" : ""}
      animate={{ height: containerHeight }}
      transition={{
        type: "tween",
        duration: 0.4,
        ease: "easeInOut",
      }}
      style={{
        position: "relative",
        width: "100%",
        overflow: "visible",
        backgroundColor: "transparent",
        zIndex: isActive ? 103 : 101,

      }}
    >
      {/* Conditionally render either main panel or detail panel with sliding animation */}
      <AnimatePresence mode="sync">
        {!isActive ? (
          // Main panel, shown when not active
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
            style={{ userSelect: "text" }}
          >
            <Box
              sx={{
                backgroundColor: "transparent",
                p: 0,
                color: (theme) => theme.palette.blue.darkest,
                position: "relative",
                borderRadius: 0,
                userSelect: "text",
                border: addBorder ? `5px solid ${bgColor}` : "none",
                overflow: "visible",
              }}
            >
              {/* Single column layout */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  width: { sm: "90%", md: "100%" },
                  pointerEvents: "auto",
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {title}
                  {content && content}
                </Box>
                {!hideDetailArrow && panelType !== "empower" && (
                  <Box
                    sx={{
                      width: { xs: 48, md: 56 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      onClick={onToggleDetail}
                      sx={(theme) => ({
                        width: { xs: 40, md: 48 },
                        height: { xs: 40, md: 48 },
                        color: theme.palette.blue.darkest,
                        border: "none",
                        borderRadius: theme.borderRadius.rounded,
                      })}
                    >
                      <ArrowHead style={{ width: 36, height: 36 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>

              {/* Bottom scroll arrow (outer). Do not render for Empower */}
              {!hideBottomArrow && panelType !== "empower" && (
                <IconButton
                  onClick={onToggleDetail}
                  sx={(theme) => ({
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    color: theme.palette.blue.darkest,
                    border: "none",
                    borderRadius: theme.borderRadius.rounded,
                    width: 60,
                    height: 60,
                  })}
                >
                  <ArrowHead
                    style={{
                      width: 36,
                      height: 36,
                      transform: "rotate(90deg)",
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </motion.div>
        ) : (
          // Detail panel, shown when active
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
            <Box
              sx={{
                backgroundColor: (theme) => theme.palette.brand.water,
                p: 0,
                color: (theme) => theme.palette.blue.darkest,
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
                    pt: (theme) => `${theme.layout.headerHeight}px`,
                    pointerEvents: "auto",
                  }}
                >
                  {detailContent}
                </Grid>
              </Grid>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
