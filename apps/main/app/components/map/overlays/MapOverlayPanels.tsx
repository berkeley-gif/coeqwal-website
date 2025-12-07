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
import ScenarioCard from "../../ScenarioCard"
import ClimateCard from "../../ClimateCard"
import ScrollTooltip from "./ScrollTooltip"
import { GeocodingPanel } from "./GeocodingPanel"
import { DeltaInfoPanel } from "./DeltaInfoPanel"
import { StrategyInfoPanel, KeyOperationsPanel, KeyOutcomesPanel } from "./StrategyRow"
import { Section, StickySection } from "./Section"
import { Box, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import { learnMapActions, useGeocodingResetCounter } from "../store"
import { useScroll, useTransform, motion } from "@repo/motion"

export default function MapOverlayPanels() {
  const map = useMap()
  const geocodingResetCounter = useGeocodingResetCounter()

  // UI state
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // Refs for tooltips
  const baselineOverlayRef = useRef<HTMLDivElement>(null)
  const climateCardRef = useRef<HTMLDivElement>(null)
  const scrollTrackRef = useRef<HTMLElement | null>(null)

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

  // Dynamic panel heights for stacking
  const [strategyInfoHeight, setStrategyInfoHeight] = useState(0)
  const [keyOperationsHeight, setKeyOperationsHeight] = useState(0)

  // Measure panel heights after render
  useEffect(() => {
    const measureHeights = () => {
      if (strategyInfoRef.current) {
        setStrategyInfoHeight(strategyInfoRef.current.offsetHeight)
      }
      if (keyOperationsRef.current) {
        setKeyOperationsHeight(keyOperationsRef.current.offsetHeight)
      }
    }
    
    // Measure initially and on resize
    measureHeights()
    window.addEventListener("resize", measureHeights)
    return () => window.removeEventListener("resize", measureHeights)
  }, [])

  // Calculate stacking positions (with 16px gap between panels)
  const panelGap = 16
  const baseTop = "15vh"
  const keyOperationsTop = strategyInfoHeight > 0 
    ? `calc(${baseTop} + ${strategyInfoHeight + panelGap}px)` 
    : `calc(${baseTop} + 150px)` // Fallback
  const keyOutcomesTop = (strategyInfoHeight > 0 && keyOperationsHeight > 0)
    ? `calc(${baseTop} + ${strategyInfoHeight + keyOperationsHeight + (panelGap * 2)}px)`
    : `calc(${baseTop} + 280px)` // Fallback

  // Tooltip scroll progress
  const [tooltipRefsReady, setTooltipRefsReady] = useState(false)

  useEffect(() => {
    if (baselineOverlayRef.current && climateCardRef.current) {
      setTooltipRefsReady(true)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: tooltipRefsReady ? scrollTrackRef : undefined,
    offset: ["start end", "end start"],
    layoutEffect: false,
  })

  const firstTooltipOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.3, 0.4, 0.5],
    [0, 1, 1, 0],
  )
  const secondTooltipOpacity = useTransform(
    scrollYProgress,
    [0.5, 0.6, 0.7, 0.8],
    [0, 1, 1, 0],
  )
  const thirdTooltipOpacity = useTransform(
    scrollYProgress,
    [0.8, 0.85, 0.95, 1.0],
    [0, 1, 1, 0],
  )

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

  // Tooltip sequence (each tooltip appears after its panel, before the next panel):
  // 1. Strategy row panel enters (~0.35)
  // 2. Strategy description tooltip (0.38-0.48)
  // 3. Key operations panel enters (~0.50)
  // 4. Key operations tooltip (0.53-0.63)
  // 5. Key outcomes panel enters (~0.70)
  // 6. Key outcomes tooltip (0.73-0.83)

  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.38, 0.42, 0.46, 0.50],
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
            <Typography
              variant="body1"
              sx={{ fontSize: "1.125rem !important", mb: 0.5 }}
            >
              scroll to learn more
            </Typography>
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
        }}
      >
        {/* Sticky intro text - animated position from midpoint to top */}
        <motion.div
          style={{
            position: "sticky",
            top: paragraphTop,
            zIndex: 2,
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
                Each water management scenario on this site can be read as having
                three main elements. Let&apos;s look at the water management scenario for the way we currently manage Central Valley water.
              </Typography>
            </CallResponsePanel>
          </Section>
        </motion.div>

        {/* Strategy info panel - scrolls in on the right side and sticks at same level as paragraph */}
        <Box
          sx={{
            position: "sticky",
            top: "15vh", // Same level as the paragraph on the left
            zIndex: 1,
            mt: "100vh", // Delay entrance until paragraph is at top position
          }}
        >
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
                pl: { xs: 2, sm: 3, md: 4 },
                pr: { xs: 4, sm: 8, md: 12, lg: 16 },
              }}
            >
              {/* Container for tooltip positioning */}
              <Box
                ref={strategyInfoContainerRef}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "500px",
                }}
              >
                <Box ref={strategyInfoRef}>
                  <StrategyInfoPanel strategyValue="current-ops" />
                </Box>
                
                {/* Strategy info tooltip */}
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
                      This describes the water management strategy being modeled.
                      <Box component="span" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
                        Hover over the i icon to see definitions of terms.
                      </Box>
                    </>
                  }
                  position="left"
                  offsetY={20}
                  opacity={strategyInfoTooltipOpacity}
                />
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Key operations panel - scrolls in after strategy description tooltip */}
        <Box
          sx={{
            position: "sticky",
            top: keyOperationsTop, // Dynamically calculated based on strategy info height
            zIndex: 1,
            mt: "100vh", // Delay entrance until after strategy description tooltip
          }}
        >
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
                pl: { xs: 2, sm: 3, md: 4 },
                pr: { xs: 4, sm: 8, md: 12, lg: 16 },
              }}
            >
              {/* Container for tooltip positioning */}
              <Box
                ref={keyOperationsContainerRef}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "500px",
                }}
              >
                <Box ref={keyOperationsRef}>
                  <KeyOperationsPanel strategyValue="current-ops" />
                </Box>
                
                {/* Key operations tooltip */}
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
                      These icons represent the key operational decisions that define
                      this water management strategy.
                      <Box component="span" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
                        Hover over the icons to see what key operations they represent.
                      </Box>
                    </>
                  }
                  position="left"
                  offsetY={20}
                  opacity={keyOperationsTooltipOpacity}
                />
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Key outcomes panel - scrolls in after key operations tooltip */}
        <Box
          sx={{
            position: "sticky",
            top: keyOutcomesTop, // Dynamically calculated based on panels above
            zIndex: 1,
            mt: "120vh", // Delay entrance until after key operations tooltip
          }}
        >
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
                pl: { xs: 2, sm: 3, md: 4 },
                pr: { xs: 4, sm: 8, md: 12, lg: 16 },
              }}
            >
              {/* Container for tooltip positioning */}
              <Box
                ref={keyOutcomesContainerRef}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "500px",
                }}
              >
                <Box ref={keyOutcomesRef}>
                  <KeyOutcomesPanel scenarioId="s0020" />
                </Box>
                
                {/* Key outcomes tooltip */}
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
                      These metrics show how this strategy affects water supply,
                      ecosystems, agriculture, and communities.
                      <Box component="span" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
                        Hover over the outcomes to learn more about each metric.
                      </Box>
                    </>
                  }
                  position="left"
                  offsetY={20}
                  opacity={keyOutcomesTooltipOpacity}
                />
              </Box>
            </Box>
          </Section>
        </Box>

        {/* Scroll spacer - allows all elements to stick while scrolling continues */}
        <Box sx={{ height: "100vh" }} aria-hidden="true" />
      </Box>

      {/* ==================== SECTION 13: Scenario Cards (Sticky) ==================== */}
      <Section id="scenario-cards" amount={0.3} sx={{ minHeight: "150vh" }}>
        <Box
          sx={{
            position: "sticky",
            top: "100px",
            height: "calc(100vh - 100px)",
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            pointerEvents: "none",
            pr: { xs: 1, sm: 2, md: 3, lg: 4 },
            pt: 2,
          }}
        >
          <Box
            id="baseline-scenario-overlay"
            ref={baselineOverlayRef}
            sx={{
              maxWidth: "580px",
              maxHeight: "100%",
              padding: (theme) => theme.spacing(2),
              display: "flex",
              flexDirection: "column",
              gap: (theme) => theme.spacing(1.5),
              backgroundColor: (theme) => theme.palette.brand.sky,
              backdropFilter: "blur(10px)",
              borderRadius: (theme) => theme.borderRadius.card,
              overflow: "auto",
              position: "relative",
              pointerEvents: "auto",
            }}
          >
            <ScenarioCard
              isMinimized={false}
              minimizedTitle="Current operations"
              firstTooltipOpacity={firstTooltipOpacity}
              secondTooltipOpacity={secondTooltipOpacity}
            />
            <ClimateCard
              ref={climateCardRef}
              isMinimized={false}
              selectedClimate={1}
            />

            <ScrollTooltip
              targetRef={climateCardRef}
              containerRef={baselineOverlayRef}
              content={
                <>
                  <Box
                    component="span"
                    sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                  >
                    Hydroclimate
                  </Box>
                  These options let you explore how a strategy performs under
                  different possible future climate conditions.
                </>
              }
              position="left"
              opacity={thirdTooltipOpacity}
            />
          </Box>
        </Box>
      </Section>

      {/* ==================== SECTION 14: Scenario Conclusion ==================== */}
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
