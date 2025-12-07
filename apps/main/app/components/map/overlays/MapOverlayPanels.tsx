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
import { StrategyRow } from "./StrategyRow"
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
          minHeight: "250vh", // Increased to accommodate the extra scroll phase
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

        {/* Strategy row - scrolls in and sticks near bottom of viewport */}
        <Box
          sx={{
            position: "sticky",
            top: "55vh",
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
                pl: { xs: 4, sm: 8, md: 12, lg: 16 },
                pr: { xs: 2, sm: 3, md: 4 },
                width: "100%",
              }}
            >
              <StrategyRow strategyValue="current-ops" />
            </Box>
          </Section>
        </Box>

        {/* Scroll spacer - allows both elements to stick while scrolling continues */}
        <Box sx={{ height: "70vh" }} aria-hidden="true" />
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
