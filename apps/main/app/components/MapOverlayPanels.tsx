/**
 * MapOverlayPanels - Scroll-driven storytelling for Learn section
 * 
 * Displays narrative panels that overlay the sticky map, with synchronized
 * map visualizations controlled by scroll position.
 * 
 * Architecture:
 * - Panel UI defined here (content, layout, spacing)
 * - Scroll choreography configuration in config/learnSectionChoreography.ts
 * - Map layer management in hooks/useLearnScrollChoreography.ts
 * - Reusable panel components in components/panels/
 */

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { CallResponsePanel } from "@repo/ui"
import ScenarioCard from "./ScenarioCard"
import ClimateCard from "./ClimateCard"
import ScrollTooltip from "./ScrollTooltip"
import { GeocodingPanel } from "./panels/GeocodingPanel"
import { DeltaInfoPanel } from "./panels/DeltaInfoPanel"
import { Box, Typography } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import { useCalSimToggle } from "./CalSimContext"
import { useLearnScrollChoreography } from "../hooks/useLearnScrollChoreography"
import { createLearnChoreographyConfig } from "../config/learnSectionChoreography"
import { STICKY_HEIGHTS, ENTRANCE_RAMPS } from "../constants/scrollChoreographyConstants"
import { useScroll, useTransform } from "@repo/motion"

export default function MapOverlayPanels() {
  const map = useMap()
  const {
    setGeocoderMarker,
    showBasins,
    toggleBasins,
    setShowRivers,
    setRiversAnimationProgress,
    showInflowArrows,
    toggleInflowArrows,
    inflowArrowsOpacity,
    setInflowArrowsOpacity,
    setActivePanel,
  } = useCalSimToggle()

  // UI state
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)
  const [geocodingResetTrigger, setGeocodingResetTrigger] = useState(0)

  // Refs for stable choreography callbacks
  const labelFadeAnimationRef = useRef<number | null>(null)
  const arrowFadeAnimationRef = useRef<number | null>(null)
  const toggleBasinsOnRef = useRef(toggleBasins)
  const showBasinsRef = useRef(showBasins)
  const toggleInflowArrowsOnRef = useRef(toggleInflowArrows)
  const showInflowArrowsRef = useRef(showInflowArrows)
  const inflowArrowsOpacityRef = useRef(inflowArrowsOpacity)
  
  // Refs for scroll-driven tooltips
  const scrollTrackRef = useRef<HTMLElement | null>(null)
  const climateCardRef = useRef<HTMLDivElement | null>(null)
  const baselineOverlayRef = useRef<HTMLDivElement | null>(null)
  
  // State to track when refs are ready for scroll tracking
  const [tooltipRefsReady, setTooltipRefsReady] = useState(false)

  // Find the external elements after mount
  useEffect(() => {
    scrollTrackRef.current = document.getElementById("scenario-scroll-track")
    climateCardRef.current = document.getElementById("climate-card") as HTMLDivElement | null
    baselineOverlayRef.current = document.getElementById("baseline-scenario-overlay") as HTMLDivElement | null
    
    // Mark refs as ready if scroll track is found
    if (scrollTrackRef.current) {
      setTooltipRefsReady(true)
    }
  }, [])

  // Track scroll progress through the scroll track for tooltip animations
  const { scrollYProgress } = useScroll({
    target: tooltipRefsReady ? scrollTrackRef : undefined,
    offset: ["start end", "end start"],
    layoutEffect: false,
  })

  // Map scroll progress to tooltip opacities
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

  // Keep refs synchronized with latest values
  useEffect(() => {
    toggleBasinsOnRef.current = toggleBasins
    showBasinsRef.current = showBasins
    toggleInflowArrowsOnRef.current = toggleInflowArrows
    showInflowArrowsRef.current = showInflowArrows
    inflowArrowsOpacityRef.current = inflowArrowsOpacity
  }, [toggleBasins, showBasins, toggleInflowArrows, showInflowArrows, inflowArrowsOpacity])

  // Create choreography configuration
  const choreographyConfig = useMemo(
    () => createLearnChoreographyConfig({
      map,
      showBasinsRef,
      showInflowArrowsRef,
      inflowArrowsOpacityRef,
      labelFadeAnimationRef,
      arrowFadeAnimationRef,
      toggleBasinsOnRef,
      toggleInflowArrowsOnRef,
      setInflowArrowsOpacity,
      setGeocoderMarker,
      setShowRivers,
      setRiversAnimationProgress,
      resetGeocodingPanel: () => setGeocodingResetTrigger(prev => prev + 1),
    }),
    [map, setInflowArrowsOpacity, setGeocoderMarker, setShowRivers, setRiversAnimationProgress]
  )

  // Initialize scroll choreography
  useLearnScrollChoreography(choreographyConfig, setActivePanel)

  // Intersection observer for first panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-map" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      }
    )

    const mapPanel = document.getElementById("california-map")
    if (mapPanel) {
      observer.observe(mapPanel)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content,
        pointerEvents: "none",
        marginTop: "-100vh",
        paddingTop: ENTRANCE_RAMPS.FIRST_PANEL,
        paddingBottom: "40vh",
      }}
    >
      {/* ==================== PANEL 1: California overview ==================== */}
      <CallResponsePanel
        id="calsim-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "120vh" }}
      >
        <Typography variant="body1">
          Do you know that California has one of the most complex water systems in the world?
        </Typography>
      </CallResponsePanel>

      {/* ==================== PANEL 2: Central Valley ==================== */}
      <CallResponsePanel
        id="central-valley-importance"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          The{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Central Valley
          </Box>{" "}
          is like a giant bowl that collects most of California&apos;s water.
          This water is managed, divided up, and transported.
        </Typography>
      </CallResponsePanel>

      {/* ==================== PANEL 3: Basins ==================== */}
      <CallResponsePanel
        id="central-valley-basins"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          The Central Valley lies across three water{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            basins
          </Box>
          .
        </Typography>
      </CallResponsePanel>

      {/* ==================== PANEL 4: Water flow ==================== */}
      <CallResponsePanel
        id="water-flow-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          Each basin receives water from precipitation and snowmelt that flows down from
          surrounding mountains into streams and rivers.
        </Typography>
      </CallResponsePanel>

      {/* Hidden trigger for inflow arrows (positioned early in Panel 4's visible area) */}
      <Box
        id="arrows-trigger"
        sx={{
          height: "50vh",
          width: "100%",
          opacity: 0,
          pointerEvents: "none",
          marginTop: "-90vh", // Pull up significantly to trigger earlier
        }}
        aria-hidden="true"
      />

      {/* ==================== PANEL 4.5: Find My Basin ==================== */}
      <CallResponsePanel
        id="which-basin-call"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        disableHighlight
        sx={{ mb: "100vh" }}
      >
        <GeocodingPanel
          basinsData={centralValleyBasins}
          onMarkerChange={setGeocoderMarker}
          resetTrigger={geocodingResetTrigger}
        />
      </CallResponsePanel>

      {/* ==================== PANEL 5: Rivers (sticky) ==================== */}
      <Box
        id="rivers-flow-response"
        sx={{
          minHeight: STICKY_HEIGHTS.RIVERS,
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            alignItems: "center",
          }}
        >
          <CallResponsePanel
            id="rivers-flow-response-content"
            side="left"
            variant="call"
            isVisible={isFirstPanelVisible}
            sx={{ minHeight: "auto", mb: 0 }}
          >
            <Typography variant="body1">
              The{" "}
              <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
                Sacramento River
              </Box>{" "}
              flows from the north and the{" "}
              <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
                San Joaquin River
              </Box>{" "}
              flows from the south to mix waters in the low-lying{" "}
              <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
                Delta
              </Box>
              .
            </Typography>
          </CallResponsePanel>
        </Box>
      </Box>

      {/* ==================== PANEL 6: Delta info ==================== */}
      <CallResponsePanel
        id="delta-info-response"
        side="right"
        variant="response"
        isVisible={isFirstPanelVisible}
        disableHighlight
        sx={{ mt: "80vh", mb: "100vh" }}
      >
        <DeltaInfoPanel map={map} />
      </CallResponsePanel>

      {/* ==================== PANEL 6: Water distribution ==================== */}
      <CallResponsePanel
        id="water-distribution-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          Water is distributed from multiple points along the way, and pumped out from the{" "}
          <Box component="span" sx={{ fontStyle: "italic", fontWeight: 500 }}>
            Delta
          </Box>{" "}
          to points further south.
        </Typography>
      </CallResponsePanel>

      {/* ==================== PANEL 7: CalSim model ==================== */}
      <CallResponsePanel
        id="calsim-detailed-response"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          To plan and account for where the water goes, the federal{" "}
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
          . The CalSim model tracks water flowing into reservoirs, how much is stored and released
          into rivers and canals, and where it gets delivered across the state.
        </Typography>
      </CallResponsePanel>

      {/* ==================== PANEL 8: COEQWAL project ==================== */}
      <CallResponsePanel
        id="coeqwal-call"
        side="left"
        variant="call"
        isVisible={isFirstPanelVisible}
        sx={{ mb: "100vh" }}
      >
        <Typography variant="body1">
          The{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            COEQWAL
          </Box>{" "}
          project has been given resources from the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            University of California
          </Box>{" "}
          and the{" "}
          <Box component="span" sx={{ fontWeight: 600 }}>
            Bay-Delta Science Program
          </Box>{" "}
          to run CalSim through a broad range of different water management practices and evaluate
          the results under current and future climate possibilities.
        </Typography>

        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          We are making this data available to the public so that communities can better understand
          the range of possibilities, and the range of consequences, that different water management
          practices can bring.
        </Typography>
      </CallResponsePanel>

      {/* Baseline scenario overlay with Current Operations and Hydroclimate cards */}
      {/* Wrapper for scroll track + sticky content */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "auto",
        }}
      >
        {/* Tall scroll track - creates the scroll pause effect */}
        <Box
          id="scenario-scroll-track"
          sx={{
            height: "300vh", // 3x viewport height for scroll progression
            width: "100%",
            position: "relative",
          }}
        />

        {/* Sticky container - stays fixed while scrolling through track */}
        <Box
          sx={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100vh",
            display: "flex",
            justifyContent: "flex-end", // Align to right
            alignItems: "center",
            pl: 2, // Left padding
            pr: 4, // More right padding for space between panel and edge
            pointerEvents: "none",
          }}
        >
          {/* Blue panel grouping both cards */}
          <Box
            id="baseline-scenario-overlay"
            ref={baselineOverlayRef}
            sx={{
              maxWidth: "580px",
              padding: (theme) => theme.spacing(2),
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              gap: (theme) => theme.spacing(1.5),
              backgroundColor: (theme) => theme.palette.brand.sky,
              backdropFilter: "blur(10px)",
              borderRadius: (theme) => theme.borderRadius.card,
              overflow: "visible", // Allow tooltips to overflow to the left
              position: "relative", // For absolute positioned tooltips
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
            
            {/* Third tooltip - points to ClimateCard from parent level */}
            <ScrollTooltip
              targetRef={climateCardRef}
              containerRef={baselineOverlayRef}
              content={
                <>
                  These options allow you to select how a water management strategy is
                  expected to perform under different potential{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    hydroclimates
                  </Box>
                  .
                </>
              }
              position="left"
              opacity={thirdTooltipOpacity}
            />
          </Box>
        </Box>
      </Box>

      {/* Buffer spacer to maintain Central Valley view after scenario cards */}
      <Box
        id="scenario-buffer"
        sx={{
          height: "50vh", // Minimal buffer
          width: "100%",
          opacity: 0,
          pointerEvents: "none",
          marginTop: "-25vh", // Small overlap to prevent gap
        }}
        aria-hidden="true"
      />
    </Box>
  )
}

