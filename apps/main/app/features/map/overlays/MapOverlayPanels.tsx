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
 *
 * Dev note: Future refactoring could extract section components, but it makes timing tricky and it's not worth the effort right now.
 * The react-scrollama library has internal dependencies on how Step components render that break when I try to abstract the inner content.
 * Even wrapping just the Box/CallResponsePanel in a helper component causes the IntersectionObserver to fail.
 */

import { useState, useEffect, useRef } from "react"
import { useTheme } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { Scrollama, Step } from "react-scrollama"

// Animation thresholds for scenario-intro section panels (progress 0-1)
// Panels fade in BEFORE their tooltips so the user sees the panel first,
// then the tooltip appears to explain it. Each panel's fadeEnd aligns with
// its tooltip's fadeIn start: strategy 0.18, keyOps 0.34, keyOutcomes 0.55.
const PANEL_ANIMATION_THRESHOLDS = {
  strategyInfo: { fadeStart: 0.12, fadeEnd: 0.18 },
  keyOperations: { fadeStart: 0.28, fadeEnd: 0.34 },
  keyOutcomes: { fadeStart: 0.48, fadeEnd: 0.54 },
  summary: { fadeStart: 0.48, fadeEnd: 0.54 },
} as const

const PANEL_POSITIONS = {
  paragraphTop: "15vh",
} as const

const ACCENT_TEXT_SX = {
  fontFamily: themeValues.fontFamily.accent,
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "1.4rem",
} as const

const RIGHT_PANEL_MAX_WIDTH = {
  xs: "100%",
  sm: "360px",
  md: "420px",
  lg: "460px",
  xl: "500px",
} as const

import type { FeatureCollection, Polygon, MultiPolygon } from "geojson"
import { CallResponsePanel } from "@repo/ui"
import ScrollTooltip from "../../tooltips/ScrollTooltip"
import { GeocodingPanel } from "./GeocodingPanel"
import { DeltaInfoPanel } from "./DeltaInfoPanel"
import { PanelEyebrow } from "./PanelEyebrow"
import {
  StrategyInfoPanel,
  KeyOperationsPanel,
  KeyOutcomesPanel,
} from "./scenarioPanels"
import { SummaryPanel } from "./scenarioPanels"
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import {
  mapActions,
  useGeocodingResetCounter,
  useIsOutcomeVisualizationActive,
} from "../store"
import type { SectionId } from "../config/sectionLayers"
import {
  useTransform,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "@repo/motion"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapOverlayPanels() {
  const theme = useTheme()
  const map = useMap()
  const geocodingResetCounter = useGeocodingResetCounter()

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

  // Panels always "visible" for pointer-events; entrance animation is
  // viewport-driven via CallResponsePanel's whileInView.
  const isFirstPanelVisible = true

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
  const [viewByClimateTooltipClosed, setViewByClimateTooltipClosed] =
    useState(false)
  const [keyOutcomesTooltipClosed, setKeyOutcomesTooltipClosed] =
    useState(false)

  // Close tooltips when outcome visualization is activated
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  useEffect(() => {
    if (isOutcomeActive) {
      // Close all panel tooltips when showing outcome data on map
      setStrategyTooltipClosed(true)
      setKeyOpsTooltipClosed(true)
      setViewByClimateTooltipClosed(true)
      setKeyOutcomesTooltipClosed(true)
    }
  }, [isOutcomeActive])

  // ============================================================================
  // Framer Motion: Scenario-intro choreography
  // ============================================================================

  // Multi-step sticky choreography:
  // Tracks scroll through the scenario-intro-wrapper section
  // Uses manual scroll tracking because useScroll doesn't work reliably
  // when the ref isn't available at mount time
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
  const paragraphTop = PANEL_POSITIONS.paragraphTop

  // Panel opacity - fade in and stay visible
  const strategyInfoPanelOpacity = useTransform(
    scenarioIntroProgress,
    [
      PANEL_ANIMATION_THRESHOLDS.strategyInfo.fadeStart,
      PANEL_ANIMATION_THRESHOLDS.strategyInfo.fadeEnd,
    ],
    [0, 1],
  )

  const keyOperationsPanelOpacity = useTransform(
    scenarioIntroProgress,
    [
      PANEL_ANIMATION_THRESHOLDS.keyOperations.fadeStart,
      PANEL_ANIMATION_THRESHOLDS.keyOperations.fadeEnd,
    ],
    [0, 1],
  )

  const keyOutcomesPanelOpacity = useTransform(
    scenarioIntroProgress,
    [
      PANEL_ANIMATION_THRESHOLDS.keyOutcomes.fadeStart,
      PANEL_ANIMATION_THRESHOLDS.keyOutcomes.fadeEnd,
    ],
    [0, 1],
  )

  const summaryPanelOpacity = useTransform(
    scenarioIntroProgress,
    [
      PANEL_ANIMATION_THRESHOLDS.summary.fadeStart,
      PANEL_ANIMATION_THRESHOLDS.summary.fadeEnd,
    ],
    [0, 1],
  )

  // TODO: Find better approach for allowing map panning while disabling hidden panel interactions
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

  // Track if StrategyInfoPanel was ever visible (to avoid clearing on initial render)
  // Using first panel because it's visible the longest
  const strategyInfoWasVisible = useRef(false)

  // Sync motion values to state for use in MUI sx prop
  useMotionValueEvent(strategyInfoPointerEvents, "change", (latest) => {
    const newPE = latest as "none" | "auto"
    setStrategyInfoPE(newPE)

    // Track when panel becomes visible
    if (newPE === "auto") {
      strategyInfoWasVisible.current = true
    }

    // Clear outcome visualization only when transitioning from visible to invisible
    // (not on initial render when panel starts invisible)
    if (newPE === "none" && strategyInfoWasVisible.current) {
      mapActions.clearOutcomeVisualization()
      strategyInfoWasVisible.current = false // Reset for next cycle
    }
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

  // Tooltip opacity - fade in and out
  // Sequence (no overlaps): strategy → key ops → view by climate → key outcomes
  // Panel fadeEnd values: strategy 0.18, keyOps 0.34, keyOutcomes 0.54
  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.18, 0.22, 0.26, 0.30],
    [0, 1, 1, 0],
  )

  // Starts at keyOps panel fadeEnd (0.34), ends at 0.44
  const keyOperationsTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.34, 0.37, 0.41, 0.44],
    [0, 1, 1, 0],
  )

  // Picks up immediately after key ops ends (0.44), finishes as key outcomes panel appears (0.54)
  const viewByClimateTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.44, 0.47, 0.51, 0.54],
    [0, 1, 1, 0],
  )

  // Starts just after view by climate ends (0.54), key outcomes panel is now fully visible
  const keyOutcomesTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.55, 0.58, 0.65, 0.68],
    [0, 1, 1, 0],
  )

  // Reset tooltip closed states when scrolling away (opacity goes to 0)
  // This allows tooltips to reappear when user scrolls back to that section
  useMotionValueEvent(strategyInfoTooltipOpacity, "change", (latest) => {
    if (latest === 0) setStrategyTooltipClosed(false)
  })
  useMotionValueEvent(keyOperationsTooltipOpacity, "change", (latest) => {
    if (latest === 0) setKeyOpsTooltipClosed(false)
  })
  useMotionValueEvent(viewByClimateTooltipOpacity, "change", (latest) => {
    if (latest === 0) setViewByClimateTooltipClosed(false)
  })
  useMotionValueEvent(keyOutcomesTooltipOpacity, "change", (latest) => {
    if (latest === 0) setKeyOutcomesTooltipClosed(false)
  })

  // Note: Outcome visualization clearing is handled by the StrategyInfoPanel
  // visibility tracking in useMotionValueEvent above

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: (theme) => theme.zIndex.mapOverlays,
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
        {/* ==================== SECTION 1: California overview ====================
            Short scroll runway — no visible content.
            Fires the Scrollama "california" step as soon as the section enters
            the viewport, triggering the Central Valley zoom via useLearnScrollama.
            50vh gives the zoom animation time to play and the momentum of an
            active scroll to settle before the central-valley paragraph slides in. */}
        <Step data={"california" as SectionId}>
          <Box sx={{ height: "50vh", pointerEvents: "none" }} />
        </Step>

        {/* ==================== SECTION 2: Central Valley ==================== */}
        <Step data={"central-valley" as SectionId}>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="central-valley-call"
              side="left"
              variant="call"
              isVisible={isFirstPanelVisible}
            >
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <PanelEyebrow>Central Valley Water</PanelEyebrow>
                <Typography variant="body1">
                  The{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    Central Valley
                  </Box>{" "}
                  is a long, low valley that collects much of California&apos;s
                  water from surrounding mountains. This water is stored,
                  divided up, and used to irrigate the most productive farmland
                  in the world, to supply drinking water to millions of people,
                  and to protect sensitive species and ecosystems.
                </Typography>
              </Box>
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
                <Box
                  component="span"
                  sx={ACCENT_TEXT_SX}
                >
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
              minHeight: "50vh",
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
                onMarkerChange={mapActions.setGeocoderMarker}
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
                <Typography
                  variant="body1"
                  sx={{ mb: theme.space.component.lg }}
                >
                  These waters flow to the Valley floor, where the{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    Sacramento River
                  </Box>{" "}
                  flows from the north and the{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    San Joaquin River
                  </Box>{" "}
                  flows from the south. The rivers meet and mix in the low-lying{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    Delta
                  </Box>
                  .
                </Typography>
                <Typography variant="body1">
                  During{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
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
                Water is stored, diverted and distributed to multiple points
                throughout the Valley and to cities along the coast. All of it
                must be carefully accounted for.
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
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <PanelEyebrow>
                  Central Valley Water Modeling
                </PanelEyebrow>
                <Typography variant="body1" sx={{ mb: theme.space.component.lg }}>
                  To do this water planning and accounting, the federal{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    U.S. Bureau of Reclamation
                  </Box>{" "}
                  and the state{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    Department of Water Resources
                  </Box>{" "}
                  use a computer model called{" "}
                  <Box
                    component="span"
                    sx={ACCENT_TEXT_SX}
                  >
                    CalSim
                  </Box>
                  .
                </Typography>
                <Typography variant="body1">
                  CalSim simulates how much water flows into reservoirs based on
                  climate, how much is stored or released, and where it gets
                  delivered.
                </Typography>
              </Box>
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
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <Typography variant="body1">
                  Until now, this tool has been inaccessible to many
                  communities, creating barriers to participation in water
                  decision-making. The COEQWAL 
                  project uses CalSim to explore and report a wide range of different water
                  management strategies and climate futures. We are making these
                  scenarios available to the public so that communities can
                  envision alternative water futures for California.
                </Typography>
              </Box>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 12: Scenario intro ==================== */}
        {/* 
          This section uses Framer Motion for the complex multi-step choreography.
          Scrollama just detects when we enter this section.
          Internal animations are driven by useScroll/useTransform.
        */}
        <Step data={"scenario-intro" as SectionId} progress>
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
                <PanelEyebrow>
                  Library of Water Allocation Scenarios
                </PanelEyebrow>
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
                  gap: theme.space.gap.sm,
                  justifyContent: "flex-end",
                  width: "100%",
                  pr: theme.space.panel.padding,
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
                          maxWidth: RIGHT_PANEL_MAX_WIDTH,
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
                              scenarioId="s0020"
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
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                1. Strategy
                              </Typography>
                              This describes the water management strategy being
                              modeled.
                              <Typography
                                variant="tooltipHeader"
                                sx={{
                                  mt: theme.space.component.sm,
                                  mb: theme.space.component.xs,
                                }}
                              >
                                Try this:
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                }}
                              >
                                Click{" "}
                                <Box
                                  component="span"
                                  sx={{
                                    color: theme.palette.blue.medium,
                                  }}
                                >
                                  more
                                </Box>{" "}
                                to see the whole strategy description. Underlined words appear in a glossary when clicked.
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
                          maxWidth: RIGHT_PANEL_MAX_WIDTH,
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
                              scenarioId="s0020"
                              onTitleClick={() => setKeyOpsTooltipClosed(false)}
                            />
                          </Box>
                        </motion.div>

                        <ScrollTooltip
                          targetRef={keyOperationsRef}
                          containerRef={keyOperationsContainerRef}
                          content={
                            <>
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                2. Key operations
                              </Typography>
                              These icons represent the key operational
                              decisions that define this water management
                              strategy.
                              <Typography
                                variant="tooltipHeader"
                                sx={{
                                  mt: theme.space.component.sm,
                                  mb: theme.space.component.xs,
                                }}
                              >
                                Try this:
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
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

                        <ScrollTooltip
                          targetRef={keyOperationsRef}
                          containerRef={keyOperationsContainerRef}
                          content={
                            <>
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                3. View by climate
                              </Typography>
                              Choosing one of these climate icons will show
                              you how the scenario allocates water under
                              different potential future climates.
                              <Typography
                                variant="tooltipHeader"
                                sx={{
                                  mt: theme.space.component.sm,
                                  mb: theme.space.component.xs,
                                }}
                              >
                                Try this:
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                }}
                              >
                                Hover over the icons to see the hydroclimates
                                they represent.
                              </Box>
                            </>
                          }
                          position="left"
                          offsetY={20}
                          opacity={viewByClimateTooltipOpacity}
                          isClosed={viewByClimateTooltipClosed}
                          onClose={() => setViewByClimateTooltipClosed(true)}
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
                          maxWidth: RIGHT_PANEL_MAX_WIDTH,
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
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                4. Key outcomes
                              </Typography>
                              While the strategy description, key operations, and climate describe the key inputs into the CalSim model, the outcomes listed here summarize the outputs. They show how well the allocations meet needs in each category.
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                  mt: theme.space.component.sm,
                                }}
                              >
                                Outcomes represented by a bar chart show the percentage of locations in each tier. For other outcomes, there is only one location of interest.
                              </Box>
                              <Typography
                                variant="tooltipHeader"
                                sx={{
                                  mt: theme.space.component.sm,
                                  mb: theme.space.component.xs,
                                }}
                              >
                                Try this:
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
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
                          maxWidth: RIGHT_PANEL_MAX_WIDTH,
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
                            <SummaryPanel scenarioId="s0020" />
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
