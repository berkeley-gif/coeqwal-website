"use client"

/**
 * MapOverlayPanels
 *
 * Scroll-driven storytelling using Section components.
 * Each Section auto-reports when it's in view; layer visibility is
 * derived from activeSection in the Zustand store.
 */

import { useState, useEffect, useRef } from "react"
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson"
import { CallResponsePanel } from "@repo/ui"
import ScrollTooltip from "./ScrollTooltip"
import { GeocodingPanel } from "./GeocodingPanel"
import { DeltaInfoPanel } from "./DeltaInfoPanel"
import {
  StrategyInfoPanel,
  KeyOperationsPanel,
  KeyOutcomesPanel,
} from "./StrategyRow"
import { SummaryPanel } from "./SummaryPanel"
import { Section, StickySection } from "./Section"
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import {
  learnMapActions,
  useGeocodingResetCounter,
  useIsOutcomeVisualizationActive,
} from "../store"
import { useScroll, useTransform, motion } from "@repo/motion"

export default function MapOverlayPanels() {
  const map = useMap()
  const geocodingResetCounter = useGeocodingResetCounter()

  // UI state
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // Ref for multi-step sticky animation
  const scenarioIntroRef = useRef<HTMLDivElement>(null)

  // Refs for strategy info tooltip
  const strategyInfoRef = useRef<HTMLDivElement>(null)
  const strategyInfoContainerRef = useRef<HTMLDivElement>(null)

  // Refs for key operations tooltip
  const keyOperationsRef = useRef<HTMLDivElement>(null)
  const keyOperationsContainerRef = useRef<HTMLDivElement>(null)

  // Refs for key outcomes tooltip
  const keyOutcomesRef = useRef<HTMLDivElement>(null)
  const keyOutcomesContainerRef = useRef<HTMLDivElement>(null)

  // State for manually closed tooltips
  const [strategyTooltipClosed, setStrategyTooltipClosed] = useState(false)
  const [keyOpsTooltipClosed, setKeyOpsTooltipClosed] = useState(false)
  const [keyOutcomesTooltipClosed, setKeyOutcomesTooltipClosed] =
    useState(false)

  // Close tooltips when outcome visualization is activated
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  useEffect(() => {
    if (isOutcomeActive) {
      // Close all panel tooltips when showing outcome data on map
      setStrategyTooltipClosed(true)
      setKeyOpsTooltipClosed(true)
      setKeyOutcomesTooltipClosed(true)
    }
  }, [isOutcomeActive])

  // Multi-step sticky choreography:
  // Tracks scroll through the scenario-intro-wrapper section
  const { scrollYProgress: scenarioIntroProgress } = useScroll({
    target: scenarioIntroRef,
    offset: ["start end", "end start"],
  })

  // Animate paragraph position: starts at 45vh (midpoint), moves to 15vh (top)
  // Progress 0-0.3: paragraph enters and sticks at midpoint (45vh)
  // Progress 0.3-0.5: paragraph moves from midpoint to top (45vh -> 15vh)
  // Progress 0.5+: paragraph stays at top, strategy row enters
  const paragraphTop = useTransform(
    scenarioIntroProgress,
    [0, 0.25, 0.4, 1],
    ["45vh", "45vh", "15vh", "15vh"],
  )

  // Panel and tooltip sequence:
  // 1. Strategy row panel enters (~0.35) - stays visible
  // 2. Strategy description tooltip (0.38-0.48)
  // 3. Key operations panel enters (~0.50) - stays visible
  // 4. Key operations tooltip (0.53-0.63)
  // 5. Key outcomes + Summary panels enter together (~0.70) - stay visible
  // 6. Key outcomes tooltip (0.75-0.88)

  // Panel opacity - fade in and stay visible
  const strategyInfoPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.32, 0.38],
    [0, 1],
  )

  const keyOperationsPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.48, 0.54],
    [0, 1],
  )

  const keyOutcomesPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.68, 0.74],
    [0, 1],
  )

  // Summary panel enters at same time as key outcomes panel
  const summaryPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.68, 0.74],
    [0, 1],
  )

  // Tooltip opacity - fade in and out
  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.38, 0.42, 0.46, 0.5],
    [0, 1, 1, 0],
  )

  const keyOperationsTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.53, 0.57, 0.63, 0.67],
    [0, 1, 1, 0],
  )

  const keyOutcomesTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.75, 0.78, 0.85, 0.88],
    [0, 1, 1, 0],
  )

  // First panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
          }
        })
      },
      { threshold: 0.5, rootMargin: "0px 0px -200px 0px" },
    )

    const mapPanel = document.getElementById("california-map")
    if (mapPanel) observer.observe(mapPanel)

    return () => observer.disconnect()
  }, [])

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content,
        pointerEvents: "none",
        marginTop: "-100vh",
      }}
    >
      {/* ==================== SECTION 1: California overview ==================== */}
      <Section id="california" amount={0.5}>
        <CallResponsePanel
          id="california-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            Did you know that California has one of the most complex water
            systems in the world?
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: 3,
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: "1.5rem",
                color: "white",
                animation: "bounce 2s ease-in-out infinite",
                "@keyframes bounce": {
                  "0%, 100%": { transform: "translateY(0)" },
                  "50%": { transform: "translateY(-8px)" },
                },
              }}
            >
              ↓
            </Box>
          </Box>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 2: Central Valley ==================== */}
      <Section id="central-valley" amount={0.5} sx={{ mt: "50vh" }}>
        <CallResponsePanel
          id="central-valley-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            The{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              Central Valley
            </Box>{" "}
            is a long, low valley that collects much of California&apos;s water.
            This water is stored, divided, and transported to farms and cities
            across the state.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 3: Basins ==================== */}
      <Section id="basins" amount={0.5}>
        <CallResponsePanel
          id="basins-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            The Central Valley lies across three water{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              basins
            </Box>
            .
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 4: Watersheds ==================== */}
      <Section id="watersheds" amount={0.5}>
        <CallResponsePanel
          id="watersheds-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            Each basin collects the rain and snowmelt that flows down from
            surrounding mountains into its network of streams, rivers,
            reservoirs, and wetlands.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 4.5: Arrows (trigger) ==================== */}
      <Section id="arrows" amount={0.3} sx={{ minHeight: "50vh" }}>
        {/* Hidden trigger section - arrows appear */}
      </Section>

      {/* ==================== SECTION 5: Find My Basin ==================== */}
      <Section id="find-basin" amount={0.5}>
        <CallResponsePanel
          id="find-basin-call"
          side="right"
          variant="response"
          isVisible={isFirstPanelVisible}
          disableHighlight
        >
          <GeocodingPanel
            basinsData={
              centralValleyBasins as FeatureCollection<Polygon | MultiPolygon>
            }
            onMarkerChange={learnMapActions.setGeocoderMarker}
            resetTrigger={geocodingResetCounter}
          />
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 6: Rivers (Sticky) ==================== */}
      <StickySection id="rivers" stickyHeight="200vh">
        <CallResponsePanel
          id="rivers-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
          sx={{ minHeight: "auto", mb: 0 }}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            These waters flow to the Valley floor, where the{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              Sacramento River
            </Box>{" "}
            flows from the north and the{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              San Joaquin River
            </Box>{" "}
            flows from the south. The rivers meet and mix in the low-lying{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              Delta
            </Box>
            .
          </Typography>
          <Typography variant="body1">
            During{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              wet years
            </Box>{" "}
            water flows from the Tulare Basin into the San Joaquin River.
          </Typography>
        </CallResponsePanel>
      </StickySection>

      {/* ==================== SECTION 7: Delta Info ==================== */}
      <Section id="delta" amount={0.5}>
        <CallResponsePanel
          id="delta-call"
          side="right"
          variant="response"
          isVisible={isFirstPanelVisible}
          disableHighlight
        >
          <DeltaInfoPanel map={map} />
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 8: Water Distribution ==================== */}
      <Section id="distribution" amount={0.5}>
        <CallResponsePanel
          id="distribution-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            Water is diverted and distributed from multiple points along this
            system. Some water is released from reservoirs. Some is pumped from
            the Delta to the San Joaquin Valley and Southern California. Some is
            allowed to flow out to the Pacific Ocean. All of it must be
            carefully planned and accounted for.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 9: CalSim ==================== */}
      <Section id="calsim" amount={0.5}>
        <CallResponsePanel
          id="calsim-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1" sx={{ mb: 2 }}>
            To do this water planning and accounting, the federal{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              U.S. Bureau of Reclamation
            </Box>{" "}
            and the state{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              Department of Water Resources
            </Box>{" "}
            use a computer model called{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              CalSim
            </Box>
            .
          </Typography>
          <Typography variant="body1">
            CalSim models how water would move through the system based on the
            water management decisions that are made. It models how much water
            flows into reservoirs based on climate assumptions, how much is
            stored or released, and where it gets delivered.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 10: COEQWAL ==================== */}
      <Section id="coeqwal" amount={0.5}>
        <CallResponsePanel
          id="coeqwal-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            The{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              COEQWAL
            </Box>{" "}
            project has received support from the{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              University of California
            </Box>{" "}
            and the{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              Bay-Delta Science Program
            </Box>{" "}
            to use CalSim to explore a broad range of water management
            strategies. We evaluate the results under current and future climate
            conditions.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 11: Public Data ==================== */}
      <Section id="public-data" amount={0.5}>
        <CallResponsePanel
          id="public-data-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            We are making these{" "}
            <Box component="span" sx={{ fontWeight: 600 }}>
              alternative water management scenarios
            </Box>{" "}
            available to the public so that communities can envision alternative
            water futures for California and understand the consequences that
            different water management strategies can bring.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* ==================== SECTION 12: Scenario Intro with Strategy Row ==================== */}
      {/* 
        Multi-step sticky choreography:
        1. Intro paragraph scrolls in and pauses at midpoint (45vh)
        2. Continued scrolling moves paragraph to top (15vh)
        3. Strategy row scrolls in and sticks near bottom (55vh)
        Both remain visible together while scrolling through this section
      */}
      <Box
        ref={scenarioIntroRef}
        id="scenario-intro-wrapper"
        sx={{
          minHeight: "550vh", // Space for: paragraph, strategy row + tooltip, key operations + tooltip, key outcomes + tooltip
          position: "relative",
          pointerEvents: "none", // Allow map interaction in empty space
        }}
      >
        {/* Sticky intro text - animated position from midpoint to top */}
        <motion.div
          style={{
            position: "sticky",
            top: paragraphTop,
            zIndex: 2,
            pointerEvents: "none", // Allow map interaction
          }}
        >
          <Section
            id="scenario-intro"
            amount={0.3}
            sx={{ minHeight: "auto", alignItems: "flex-start" }}
          >
            <CallResponsePanel
              id="scenario-intro-call"
              side="left"
              variant="call"
              isVisible={isFirstPanelVisible}
              minHeight="auto"
              alignItems="flex-start"
            >
              <Typography variant="body1" sx={{ maxWidth: "460px" }}>
                Each water management scenario on this site can be read as
                having three main elements. Let&apos;s look at the water
                management scenario for the way we currently manage Central
                Valley water.
              </Typography>
            </CallResponsePanel>
          </Section>
        </motion.div>

        {/* All right-side panels in a single sticky container */}
        <Box
          sx={{
            position: "sticky",
            top: "15vh",
            zIndex: 1,
            mt: "100vh", // Delay entrance until paragraph is at top position
            pointerEvents: "none", // Allow map interaction
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              justifyContent: "flex-end",
              width: "100%",
              pl: { xs: 2, sm: 3, md: 4 },
              pr: { xs: 4, sm: 8, md: 12, lg: 16 },
              pointerEvents: "none", // Allow map interaction
            }}
          >
            {/* Strategy info panel */}
            <motion.div style={{ opacity: strategyInfoPanelOpacity }}>
              <Section
                id="strategy-row"
                amount={0.5}
                sx={{ minHeight: "auto", alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                    pointerEvents: "none", // Allow map interaction in flex container
                  }}
                >
                  <Box
                    ref={strategyInfoContainerRef}
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "500px",
                      pointerEvents: "none", // Allow map interaction
                    }}
                  >
                    <Box ref={strategyInfoRef} sx={{ pointerEvents: "auto" }}>
                      <StrategyInfoPanel
                        strategyValue="current-ops"
                        onTitleClick={() => setStrategyTooltipClosed(false)}
                      />
                    </Box>

                    <ScrollTooltip
                      targetRef={strategyInfoRef}
                      containerRef={strategyInfoContainerRef}
                      content={
                        <>
                          <Box
                            component="span"
                            sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                          >
                            Strategy
                          </Box>
                          This describes the water management strategy being
                          modeled.
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              mt: 1,
                              fontStyle: "italic",
                            }}
                          >
                            Hover over the{" "}
                            <InfoIcon
                              sx={{
                                fontSize: "1rem",
                                verticalAlign: "text-top",
                                mx: 0.25,
                                color: "blue.bright",
                              }}
                            />{" "}
                            icon to see definitions of terms.
                          </Box>
                        </>
                      }
                      position="left"
                      offsetY={20}
                      opacity={strategyInfoTooltipOpacity}
                      isClosed={strategyTooltipClosed}
                      onClose={() => setStrategyTooltipClosed(true)}
                    />
                  </Box>
                </Box>
              </Section>
            </motion.div>

            {/* Key operations panel */}
            <motion.div style={{ opacity: keyOperationsPanelOpacity }}>
              <Section
                id="key-operations"
                amount={0.5}
                sx={{ minHeight: "auto", alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                    pointerEvents: "none", // Allow map interaction in flex container
                  }}
                >
                  <Box
                    ref={keyOperationsContainerRef}
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "500px",
                      pointerEvents: "none", // Allow map interaction
                    }}
                  >
                    <Box ref={keyOperationsRef} sx={{ pointerEvents: "auto" }}>
                      <KeyOperationsPanel
                        strategyValue="current-ops"
                        onTitleClick={() => setKeyOpsTooltipClosed(false)}
                      />
                    </Box>

                    <ScrollTooltip
                      targetRef={keyOperationsRef}
                      containerRef={keyOperationsContainerRef}
                      content={
                        <>
                          <Box
                            component="span"
                            sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                          >
                            Key operations
                          </Box>
                          These icons represent the key operational decisions
                          that define this water management strategy.
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              mt: 1,
                              fontStyle: "italic",
                            }}
                          >
                            Hover over the icons to see what key operations they
                            represent.
                          </Box>
                        </>
                      }
                      position="left"
                      offsetY={20}
                      opacity={keyOperationsTooltipOpacity}
                      isClosed={keyOpsTooltipClosed}
                      onClose={() => setKeyOpsTooltipClosed(true)}
                    />
                  </Box>
                </Box>
              </Section>
            </motion.div>

            {/* Key outcomes panel */}
            <motion.div style={{ opacity: keyOutcomesPanelOpacity }}>
              <Section
                id="key-outcomes"
                amount={0.5}
                sx={{ minHeight: "auto", alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                    pointerEvents: "none", // Allow map interaction in flex container
                  }}
                >
                  <Box
                    ref={keyOutcomesContainerRef}
                    sx={{
                      position: "relative",
                      width: "100%",
                      maxWidth: "500px",
                      pointerEvents: "none", // Allow map interaction
                    }}
                  >
                    <Box ref={keyOutcomesRef} sx={{ pointerEvents: "auto" }}>
                      <KeyOutcomesPanel
                        scenarioId="s0020"
                        onTitleClick={() => setKeyOutcomesTooltipClosed(false)}
                      />
                    </Box>

                    <ScrollTooltip
                      targetRef={keyOutcomesRef}
                      containerRef={keyOutcomesContainerRef}
                      content={
                        <>
                          <Box
                            component="span"
                            sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                          >
                            Key outcomes
                          </Box>
                          These outcomes show how this strategy affects water
                          supply, ecosystems, agriculture, and communities.
                          <Box
                            component="span"
                            sx={{ display: "block", mt: 1 }}
                          >
                            Some outcomes record values from multiple locations
                            in a bar chart that shows the number of locations in
                            each tier. Other outcomes are recorded at a single
                            location such as the Delta or Sacramento River.
                          </Box>
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              mt: 1,
                              fontStyle: "italic",
                            }}
                          >
                            Click on the{" "}
                            <InfoIcon
                              sx={{
                                fontSize: "1rem",
                                verticalAlign: "text-top",
                                mx: 0.25,
                                color: "blue.bright",
                              }}
                            />{" "}
                            icons to learn more about each outcome. Click on the
                            chart to see the outcome on a map.
                          </Box>
                        </>
                      }
                      position="left"
                      offsetY={20}
                      opacity={keyOutcomesTooltipOpacity}
                      isClosed={keyOutcomesTooltipClosed}
                      onClose={() => setKeyOutcomesTooltipClosed(true)}
                    />
                  </Box>
                </Box>
              </Section>
            </motion.div>

            {/* Summary panel - positioned under outcomes panel on right side */}
            <motion.div style={{ opacity: summaryPanelOpacity }}>
              <Section
                id="scenario-summary"
                amount={0.5}
                sx={{ minHeight: "auto", alignItems: "flex-start" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    width: "100%",
                    pointerEvents: "none",
                  }}
                >
                  <Box
                    sx={{
                      pointerEvents: "auto",
                      width: "100%",
                      maxWidth: "500px",
                    }}
                  >
                    <SummaryPanel strategy="current-ops" />
                  </Box>
                </Box>
              </Section>
            </motion.div>
          </Box>
        </Box>

        {/* Scroll spacer - allows all elements to stick while scrolling continues */}
        <Box sx={{ height: "100vh" }} aria-hidden="true" />
      </Box>

      {/* ==================== SECTION 13: Scenario Conclusion ==================== */}
      <Section id="scenario-conclusion" amount={0.5}>
        <CallResponsePanel
          id="scenario-conclusion-call"
          side="left"
          variant="call"
          isVisible={isFirstPanelVisible}
        >
          <Typography variant="body1">
            Keeping these three things in mind can help you read a scenario and
            understand what it changes, what it impacts, and how it might matter
            for your community.
          </Typography>
        </CallResponsePanel>
      </Section>

      {/* Buffer spacer */}
      <Box
        sx={{
          height: "50vh",
          width: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </Box>
  )
}
