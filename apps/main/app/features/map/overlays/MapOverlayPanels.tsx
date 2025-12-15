"use client"

/**
 * MapOverlayPanels
 *
 * Scroll-driven storytelling using react-scrollama for robust section detection
 * and Framer Motion for smooth animations.
 *
 * Architecture:
 * - react-scrollama: Handles section detection (onStepEnter) and rivers progress (onStepProgress)
 * - Framer Motion: Handles smooth animations in the scenario-intro section
 * - Zustand store: Manages activeSection state, layer visibility derived in useMapLayers
 */

import { useState, useEffect, useRef } from "react"
import { Scrollama, Step } from "react-scrollama"
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson"
import { CallResponsePanel } from "@repo/ui"
import ScrollTooltip from "../../tooltips/ScrollTooltip"
import { GeocodingPanel } from "./GeocodingPanel"
import { DeltaInfoPanel } from "./DeltaInfoPanel"
import {
  StrategyInfoPanel,
  KeyOperationsPanel,
  KeyOutcomesPanel,
} from "./StrategyRow"
import { SummaryPanel } from "./SummaryPanel"
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import {
  learnMapActions,
  useGeocodingResetCounter,
  useIsOutcomeVisualizationActive,
  type SectionId,
} from "../store"
import {
  useTransform,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "@repo/motion"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"

export default function MapOverlayPanels() {
  const map = useMap()
  const geocodingResetCounter = useGeocodingResetCounter()

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

  // UI state
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // Ref for multi-step sticky animation (Framer Motion)
  const scenarioIntroRef = useRef<HTMLDivElement>(null)

  // Use MutationObserver to detect when the element is added to DOM
  const [isScenarioIntroMounted, setIsScenarioIntroMounted] = useState(false)

  useEffect(() => {
    // Check if element already exists
    const checkElement = () => {
      const element = document.getElementById("scenario-intro-wrapper")
      if (element) {
        // Store the element in the ref for scroll tracking
        scenarioIntroRef.current = element as HTMLDivElement
        setIsScenarioIntroMounted(true)
        return true
      }
      return false
    }

    if (checkElement()) return

    // Otherwise observe DOM for the element
    const observer = new MutationObserver(() => {
      if (checkElement()) {
        observer.disconnect()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

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

  // ============================================================================
  // Framer Motion: Scenario-intro choreography
  // ============================================================================

  // Multi-step sticky choreography:
  // Tracks scroll through the scenario-intro-wrapper section
  // We use manual scroll tracking because useScroll doesn't work reliably
  // when the ref isn't available at mount time (which happens due to conditional rendering)
  const scenarioIntroProgress = useMotionValue(0)

  useEffect(() => {
    if (!isScenarioIntroMounted || !scenarioIntroRef.current) return

    const updateProgress = () => {
      const element = scenarioIntroRef.current
      if (!element) return

      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const elementHeight = element.offsetHeight

      // Progress calculation matching Framer Motion's ["start end", "end start"] offset:
      // 0 when element top hits viewport bottom
      // 1 when element bottom hits viewport top
      const scrollStart = -viewportHeight // element top at viewport bottom
      const scrollEnd = elementHeight // element bottom at viewport top
      const totalRange = scrollEnd - scrollStart
      const currentPosition = -rect.top // How far past scrollStart we are

      const progress = Math.max(0, Math.min(1, currentPosition / totalRange))
      scenarioIntroProgress.set(progress)
    }

    // Initial update
    updateProgress()

    // Update on scroll
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress, { passive: true })

    return () => {
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [isScenarioIntroMounted, scenarioIntroProgress])

  // Paragraph position: fixed at top (no animation, just scrolls naturally)
  const paragraphTop = "15vh"

  // Panel opacity - fade in and stay visible
  const strategyInfoPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.12, 0.18],
    [0, 1],
  )

  const keyOperationsPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.28, 0.34],
    [0, 1],
  )

  const keyOutcomesPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.48, 0.54],
    [0, 1],
  )

  const summaryPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.48, 0.54],
    [0, 1],
  )

  // TODO: find another way to allow map panning and disable triggering hidden interactive panel features.
  // Panel pointer events - derived from opacity to prevent invisible panels from receiving events
  // When opacity < 0.1, pointer events are disabled (prevents clicking hidden panels)
  // Using lower threshold to ensure panels are truly invisible before allowing map panning
  // Applied to inner motion.div so map panning still works through backgrounds
  const strategyInfoPointerEvents = useTransform(
    strategyInfoPanelOpacity,
    (v) => (v < 0.1 ? "none" : "auto"),
  )
  const keyOperationsPointerEvents = useTransform(
    keyOperationsPanelOpacity,
    (v) => (v < 0.1 ? "none" : "auto"),
  )
  const keyOutcomesPointerEvents = useTransform(keyOutcomesPanelOpacity, (v) =>
    v < 0.1 ? "none" : "auto",
  )
  const summaryPointerEvents = useTransform(summaryPanelOpacity, (v) =>
    v < 0.1 ? "none" : "auto",
  )

  // Convert motion values to state to override panel's hardcoded pointerEvents: "auto"
  const [strategyInfoPE, setStrategyInfoPE] = useState<"none" | "auto">("none")
  const [keyOperationsPE, setKeyOperationsPE] = useState<"none" | "auto">(
    "none",
  )
  const [keyOutcomesPE, setKeyOutcomesPE] = useState<"none" | "auto">("none")
  const [summaryPE, setSummaryPE] = useState<"none" | "auto">("none")

  // Sync motion values to state for use in MUI sx prop
  useMotionValueEvent(strategyInfoPointerEvents, "change", (latest) => {
    setStrategyInfoPE(latest as "none" | "auto")
  })
  useMotionValueEvent(keyOperationsPointerEvents, "change", (latest) => {
    setKeyOperationsPE(latest as "none" | "auto")
  })
  useMotionValueEvent(keyOutcomesPointerEvents, "change", (latest) => {
    setKeyOutcomesPE(latest as "none" | "auto")
  })
  useMotionValueEvent(summaryPointerEvents, "change", (latest) => {
    setSummaryPE(latest as "none" | "auto")
  })

  // Tooltip opacity - fade in and out (adjusted for compressed timing)
  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.18, 0.22, 0.26, 0.3],
    [0, 1, 1, 0],
  )

  const keyOperationsTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.36, 0.4, 0.46, 0.5],
    [0, 1, 1, 0],
  )

  const keyOutcomesTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.55, 0.58, 0.65, 0.68],
    [0, 1, 1, 0],
  )

  // Clear outcome visualization when scrolling past the KeyOutcomes panel
  // The panel is visible from ~0.48 to ~0.68 progress (compressed timing)
  useEffect(() => {
    const unsubscribe = scenarioIntroProgress.on("change", (progress) => {
      // Clear outcome when scrolled past the KeyOutcomes section (> 0.70)
      // or scrolled before it (< 0.45)
      if (progress > 0.7 || progress < 0.45) {
        learnMapActions.setSelectedOutcome(null)
      }
    })
    return () => unsubscribe()
  }, [scenarioIntroProgress])

  // First panel entrance animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.id === "california-call" && entry.isIntersecting) {
            setIsFirstPanelVisible(true)
          }
        })
      },
      { threshold: 0.5, rootMargin: "0px 0px -200px 0px" },
    )

    const mapPanel = document.getElementById("california-call")
    if (mapPanel) observer.observe(mapPanel)

    return () => observer.disconnect()
  }, [])

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.content,
        pointerEvents: "none",
        // Map is now position: fixed, so no need for negative margin
      }}
    >
      <Scrollama
        onStepEnter={onStepEnter}
        onStepExit={onStepExit}
        onStepProgress={onStepProgress}
        offset={SCROLLAMA_CONFIG.offset}
        debug={SCROLLAMA_CONFIG.debug}
      >
        {/* ==================== SECTION 1: California overview ==================== */}
        <Step data={"california" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
          </Box>
        </Step>

        {/* ==================== SECTION 2: Central Valley ==================== */}
        <Step data={"central-valley" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              mt: "50vh",
            }}
          >
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
                is a long, low valley that collects much of California&apos;s
                water. This water is stored, divided, and transported to farms
                and cities across the state, supporting some of the most
                productive agricultural land in the country.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 3: Basins ==================== */}
        <Step data={"basins" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
          </Box>
        </Step>

        {/* ==================== SECTION 4: Watersheds ==================== */}
        <Step data={"watersheds" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
          </Box>
        </Step>

        {/* ==================== SECTION 4.5: Arrows (trigger) ==================== */}
        <Step data={"arrows" as SectionId}>
          <Box
            sx={{
              minHeight: "120vh", // keep arrows visible
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            {/* Hidden trigger section - arrows appear */}
          </Box>
        </Step>

        {/* ==================== SECTION 5: Find My Basin ==================== */}
        <Step data={"find-basin" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="find-basin-call"
              side="right"
              variant="response"
              isVisible={isFirstPanelVisible}
              disableHighlight
            >
              <GeocodingPanel
                basinsData={
                  centralValleyBasins as FeatureCollection<
                    Polygon | MultiPolygon
                  >
                }
                onMarkerChange={learnMapActions.setGeocoderMarker}
                resetTrigger={geocodingResetCounter}
              />
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 6: Rivers (Sticky with Progress) ==================== */}
        <Step data={"rivers" as SectionId} progress>
          <Box
            sx={{
              minHeight: "200vh",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: 0,
                height: "100vh",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
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
            </Box>
          </Box>
        </Step>

        {/* ==================== SECTION 7: Delta Info ==================== */}
        <Step data={"delta" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="delta-call"
              side="right"
              variant="response"
              isVisible={isFirstPanelVisible}
              disableHighlight
            >
              <DeltaInfoPanel map={map} />
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 8: Water Distribution ==================== */}
        <Step data={"distribution" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="distribution-call"
              side="left"
              variant="call"
              isVisible={isFirstPanelVisible}
            >
              <Typography variant="body1">
                Water is diverted and distributed from multiple points along
                this system. Some water is released from reservoirs. Some is
                pumped from the Delta to the San Joaquin Valley and Southern
                California. Some is allowed to flow out to the Pacific Ocean.
                All of it must be carefully planned and accounted for.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 9: CalSim ==================== */}
        <Step data={"calsim" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
                CalSim models how water would move through the system based on
                the water management decisions that are made. It models how much
                water flows into reservoirs based on climate assumptions, how
                much is stored or released, and where it gets delivered.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 10: COEQWAL ==================== */}
        <Step data={"coeqwal" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
                strategies. We evaluate the results under current and future
                climate conditions.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 11: Public Data ==================== */}
        <Step data={"public-data" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
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
                available to the public so that communities can envision
                alternative water futures for California and understand the
                consequences that different water management strategies can
                bring.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 12: Scenario Intro with Strategy Row ==================== */}
        {/* 
          This section uses Framer Motion for the complex multi-step choreography.
          Scrollama just detects when we enter this section.
          Internal animations are driven by useScroll/useTransform.
        */}
        <Step data={"scenario-intro" as SectionId}>
          <Box
            id="scenario-intro-wrapper"
            sx={{
              minHeight: "900vh",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Sticky intro text at top */}
            <motion.div
              style={{
                position: "sticky",
                top: paragraphTop,
                zIndex: 2,
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  minHeight: "auto",
                  display: "flex",
                  alignItems: "flex-start",
                  pointerEvents: "none",
                }}
              >
                <CallResponsePanel
                  id="scenario-intro-call"
                  side="left"
                  variant="call"
                  isVisible={isFirstPanelVisible}
                  minHeight="auto"
                  alignItems="flex-start"
                >
                  <Typography
                    variant="body1"
                    sx={{
                      maxWidth: {
                        xs: "100%",
                        sm: "340px",
                        md: "380px",
                        lg: "420px",
                        xl: "460px",
                      },
                    }}
                  >
                    Each water management scenario on this site can be read as
                    having three main elements. Let&apos;s look at the water
                    management scenario for the way we currently manage Central
                    Valley water.
                  </Typography>
                </CallResponsePanel>
              </Box>
            </motion.div>

            {/* All right-side panels in a single sticky container */}
            <Box
              sx={{
                position: "sticky",
                top: "15vh",
                zIndex: 1,
                mt: "100vh",
                pointerEvents: "none",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  justifyContent: "flex-end",
                  width: "100%",
                  pr: { xs: 1.5, sm: 2, md: 3, lg: 4, xl: 6 }, // Match left panel padding
                  pointerEvents: "none",
                }}
              >
                {/* Strategy info panel */}
                <motion.div
                  style={{
                    opacity: strategyInfoPanelOpacity,
                    pointerEvents: "none", // Allow map panning through panel backgrounds
                  }}
                >
                  <Box
                    sx={{
                      minHeight: "auto",
                      display: "flex",
                      alignItems: "flex-start",
                      pointerEvents: "none",
                    }}
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
                        ref={strategyInfoContainerRef}
                        sx={{
                          position: "relative",
                          width: "100%",
                          maxWidth: {
                            xs: "100%",
                            sm: "360px",
                            md: "420px",
                            lg: "460px",
                            xl: "500px",
                          },
                          pointerEvents: strategyInfoPE, // Block panel AND tooltip when hidden
                        }}
                      >
                        <motion.div
                          ref={strategyInfoRef}
                          style={{
                            pointerEvents: strategyInfoPointerEvents, // "none" when hidden, "auto" when visible
                          }}
                        >
                          <Box
                            sx={{
                              pointerEvents: strategyInfoPE, // Override panel's hardcoded "auto"
                            }}
                          >
                            <StrategyInfoPanel
                              strategyValue="current-ops"
                              onTitleClick={() =>
                                setStrategyTooltipClosed(false)
                              }
                            />
                          </Box>
                        </motion.div>

                        <ScrollTooltip
                          targetRef={strategyInfoRef}
                          containerRef={strategyInfoContainerRef}
                          content={
                            <>
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 0.5,
                                }}
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
                                Click the{" "}
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
                          offsetY={30}
                          opacity={strategyInfoTooltipOpacity}
                          isClosed={strategyTooltipClosed}
                          onClose={() => setStrategyTooltipClosed(true)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </motion.div>

                {/* Key operations panel */}
                <motion.div
                  style={{
                    opacity: keyOperationsPanelOpacity,
                    pointerEvents: "none", // Allow map panning through panel backgrounds
                  }}
                >
                  <Box
                    sx={{
                      minHeight: "auto",
                      display: "flex",
                      alignItems: "flex-start",
                      pointerEvents: "none",
                    }}
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
                        ref={keyOperationsContainerRef}
                        sx={{
                          position: "relative",
                          width: "100%",
                          maxWidth: {
                            xs: "100%",
                            sm: "360px",
                            md: "420px",
                            lg: "460px",
                            xl: "500px",
                          },
                          pointerEvents: keyOperationsPE, // Block panel AND tooltip when hidden
                        }}
                      >
                        <motion.div
                          ref={keyOperationsRef}
                          style={{
                            pointerEvents: keyOperationsPointerEvents, // "none" when hidden, "auto" when visible
                          }}
                        >
                          <Box
                            sx={{
                              pointerEvents: keyOperationsPE, // Override panel's hardcoded "auto"
                            }}
                          >
                            <KeyOperationsPanel
                              strategyValue="current-ops"
                              onTitleClick={() => setKeyOpsTooltipClosed(false)}
                            />
                          </Box>
                        </motion.div>

                        <ScrollTooltip
                          targetRef={keyOperationsRef}
                          containerRef={keyOperationsContainerRef}
                          content={
                            <>
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                Key operations
                              </Box>
                              These icons represent the key operational
                              decisions that define this water management
                              strategy.
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                  mt: 1,
                                  fontStyle: "italic",
                                }}
                              >
                                Click the icons to see what key operations they
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
                  </Box>
                </motion.div>

                {/* Key outcomes panel */}
                <motion.div
                  style={{
                    opacity: keyOutcomesPanelOpacity,
                    pointerEvents: "none", // Allow map panning through panel backgrounds
                  }}
                >
                  <Box
                    sx={{
                      minHeight: "auto",
                      display: "flex",
                      alignItems: "flex-start",
                      pointerEvents: "none",
                    }}
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
                        ref={keyOutcomesContainerRef}
                        sx={{
                          position: "relative",
                          width: "100%",
                          maxWidth: {
                            xs: "100%",
                            sm: "360px",
                            md: "420px",
                            lg: "460px",
                            xl: "500px",
                          },
                          pointerEvents: keyOutcomesPE, // Block panel AND tooltip when hidden
                        }}
                      >
                        <motion.div
                          ref={keyOutcomesRef}
                          style={{
                            pointerEvents: keyOutcomesPointerEvents, // "none" when hidden, "auto" when visible
                          }}
                        >
                          <Box
                            sx={{
                              pointerEvents: keyOutcomesPE, // Override panel's hardcoded "auto"
                            }}
                          >
                            <KeyOutcomesPanel
                              scenarioId="s0020"
                              onTitleClick={() =>
                                setKeyOutcomesTooltipClosed(false)
                              }
                            />
                          </Box>
                        </motion.div>

                        <ScrollTooltip
                          targetRef={keyOutcomesRef}
                          containerRef={keyOutcomesContainerRef}
                          content={
                            <>
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 0.5,
                                }}
                              >
                                Key outcomes
                              </Box>
                              These outcomes show how this strategy affects
                              water supply, ecosystems, agriculture, and
                              communities.
                              <Box
                                component="span"
                                sx={{ display: "block", mt: 1 }}
                              >
                                Some outcomes record values from multiple
                                locations in a bar chart that shows the number
                                of locations in each tier. Other outcomes are
                                recorded at a single location such as the Delta
                                or Sacramento River.
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
                                icons to learn more about each outcome. Click on
                                the chart to see the outcome on a map.
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
                  </Box>
                </motion.div>

                {/* Summary panel */}
                <motion.div
                  style={{
                    opacity: summaryPanelOpacity,
                    pointerEvents: "none", // Allow map panning through panel backgrounds
                  }}
                >
                  <Box
                    sx={{
                      minHeight: "auto",
                      display: "flex",
                      alignItems: "flex-start",
                      pointerEvents: "none",
                    }}
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
                          width: "100%",
                          maxWidth: {
                            xs: "100%",
                            sm: "360px",
                            md: "420px",
                            lg: "460px",
                            xl: "500px",
                          },
                          pointerEvents: "none",
                        }}
                      >
                        <motion.div
                          style={{
                            pointerEvents: summaryPointerEvents, // "none" when hidden, "auto" when visible
                          }}
                        >
                          <Box
                            sx={{
                              pointerEvents: summaryPE, // Override panel's hardcoded "auto"
                            }}
                          >
                            <SummaryPanel strategy="current-ops" />
                          </Box>
                        </motion.div>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </Box>
            </Box>

            {/* Scroll spacer */}
            <Box sx={{ height: "100vh" }} aria-hidden="true" />
          </Box>
        </Step>

        {/* ==================== SECTION 13: Scenario Conclusion ==================== */}
        <Step data={"scenario-conclusion" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="scenario-conclusion-call"
              side="left"
              variant="call"
              isVisible={isFirstPanelVisible}
            >
              <Typography variant="body1">
                Keeping these three things in mind can help you read a scenario
                and understand what it changes, what it impacts, and how it
                might matter for your community.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>
      </Scrollama>

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
