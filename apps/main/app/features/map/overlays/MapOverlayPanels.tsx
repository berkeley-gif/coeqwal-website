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
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson"
import { useTheme } from "@repo/ui/mui"
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { CallResponsePanel } from "@repo/ui"
import { Scrollama, Step } from "react-scrollama"
import { useTransform, useMotionValueEvent } from "@repo/motion"
import { useMap } from "@repo/map"
import { centralValleyBasins } from "@repo/data"
import {
  useScrollProgress,
  ScrollSectionContext,
  ScrollElement,
  StickyElement,
  useScrollPhase,
  type ProgressRange,
} from "@repo/scrollytelling"
import ScrollTooltip from "../../tooltips/ScrollTooltip"
import { GeocodingPanel } from "./GeocodingPanel"
import { DeltaInfoPanel } from "./DeltaInfoPanel"
import { PanelEyebrow } from "./PanelEyebrow"
import {
  StrategyInfoPanel,
  KeyOperationsPanel,
  KeyOutcomesPanel,
  SummaryPanel,
} from "./scenarioPanels"
import {
  mapActions,
  useGeocodingResetCounter,
  useIsOutcomeVisualizationActive,
} from "../store"
import type { SectionId } from "../config/sectionLayers"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"

// Phase thresholds for useScrollPhase — stable module-level constants so
// the hook's internal useEffect dep array never triggers unnecessary re-runs.
const STRATEGY_PHASE_THRESHOLDS = {
  enter: [0.08, 0.14] as ProgressRange,
  hold: [0.14, 1.0] as ProgressRange,
}
const KEY_OPERATIONS_PHASE_THRESHOLDS = {
  enter: [0.22, 0.28] as ProgressRange,
  hold: [0.28, 1.0] as ProgressRange,
}
const KEY_OUTCOMES_PHASE_THRESHOLDS = {
  enter: [0.64, 0.68] as ProgressRange,
  hold: [0.68, 1.0] as ProgressRange,
}
const SUMMARY_PHASE_THRESHOLDS = {
  enter: [0.70, 0.74] as ProgressRange,
  hold: [0.74, 1.0] as ProgressRange,
}

const PANEL_POSITIONS = {
  paragraphTop: "15vh",
} as const

const ACCENT_TEXT_SX = {
  fontFamily: themeValues.fontFamily.accent,
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "1.4rem",
} as const

const RIGHT_PANEL_MAX_WIDTH = "540px"

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
  // Attached directly to the JSX element via ref={scenarioIntroRef} below,
  // so no MutationObserver needed.
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

  // Refs for summary tooltip
  const summaryRef = useRef<HTMLDivElement>(null)
  const summaryContainerRef = useRef<HTMLDivElement>(null)

  // State for manually closed tooltips
  const [strategyTooltipClosed, setStrategyTooltipClosed] = useState(false)
  const [keyOpsTooltipClosed, setKeyOpsTooltipClosed] = useState(false)
  const [viewByClimateTooltipClosed, setViewByClimateTooltipClosed] =
    useState(false)
  const [keyOutcomesTooltipClosed, setKeyOutcomesTooltipClosed] =
    useState(false)
  const [summaryTooltipClosed, setSummaryTooltipClosed] = useState(false)

  // Close tooltips when outcome visualization is activated
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  useEffect(() => {
    if (isOutcomeActive) {
      // Close all panel tooltips when showing outcome data on map
      setStrategyTooltipClosed(true)
      setKeyOpsTooltipClosed(true)
      setViewByClimateTooltipClosed(true)
      setKeyOutcomesTooltipClosed(true)
      setSummaryTooltipClosed(true)
    }
  }, [isOutcomeActive])

  // ============================================================================
  // Scenario-intro choreography
  // ============================================================================

  // Tracks scroll through the scenario-intro-wrapper section.
  // useScrollProgress wraps Framer Motion's useScroll with layoutEffect: false
  // so it works correctly even though the ref is attached to a child element
  // rendered later in the same component.
  // offset ["start end", "end start"] = 0 when element top hits viewport bottom,
  // 1 when element bottom hits viewport top.
  // This value is also provided to ScrollSectionContext so ScrollElement children
  // can read the same progress and animate their opacity automatically.
  const scenarioIntroProgress = useScrollProgress(scenarioIntroRef, {
    offset: ["start end", "end start"],
  })

  // Paragraph position: fixed at top (no animation, just scrolls naturally)
  const paragraphTop = PANEL_POSITIONS.paragraphTop

  // Panel phases — useScrollPhase replaces the manual useTransform + latch +
  // useState + useMotionValueEvent chains that previously managed each panel's
  // opacity and pointer events.
  //
  // ScrollElement handles opacity using the same context progress; useScrollPhase
  // gives us a React state value for pointer-events (which can't be a MotionValue).
  const { phase: strategyPhase } = useScrollPhase(
    scenarioIntroProgress,
    STRATEGY_PHASE_THRESHOLDS,
  )
  const { phase: keyOperationsPhase } = useScrollPhase(
    scenarioIntroProgress,
    KEY_OPERATIONS_PHASE_THRESHOLDS,
  )
  const { phase: keyOutcomesPhase } = useScrollPhase(
    scenarioIntroProgress,
    KEY_OUTCOMES_PHASE_THRESHOLDS,
  )
  const { phase: summaryPhase } = useScrollPhase(
    scenarioIntroProgress,
    SUMMARY_PHASE_THRESHOLDS,
  )

  // Derive pointer-events from phase: "none" only before the panel has entered.
  const strategyPE = strategyPhase === "before" ? "none" : "auto"
  const keyOperationsPE = keyOperationsPhase === "before" ? "none" : "auto"
  const keyOutcomesPE = keyOutcomesPhase === "before" ? "none" : "auto"
  const summaryPE = summaryPhase === "before" ? "none" : "auto"

  // Track when scenario-intro has been scrolled into, to reduce left/right padding
  const [scenarioIntroPaddingReduced, setScenarioIntroPaddingReduced] =
    useState(false)

  // Simplified progress listener: drives the padding transition only.
  // Pointer-events reset is now handled by useScrollPhase above.
  useMotionValueEvent(scenarioIntroProgress, "change", (latest) => {
    setScenarioIntroPaddingReduced(latest > 0.01)
  })

  // Clear the active outcome visualization when the strategy panel goes invisible
  // (user scrolled back above the section). Replaces the old strategyInfoWasVisible
  // ref + useMotionValueEvent pattern.
  const strategyWasVisibleRef = useRef(false)
  useEffect(() => {
    if (strategyPhase !== "before") {
      strategyWasVisibleRef.current = true
    } else if (strategyWasVisibleRef.current) {
      mapActions.clearOutcomeVisualization()
      strategyWasVisibleRef.current = false
    }
  }, [strategyPhase])

  // Tooltip opacity - fade in and out
  // Sequence (no overlaps): strategy → key ops → view by climate → key outcomes
  // Each tooltip: 0.03 fade in, 0.08 visible, 0.03 fade out (0.14 total), 0.04 gap between
  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.14, 0.17, 0.25, 0.28],
    [0, 1, 1, 0],
  )

  const keyOperationsTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.32, 0.35, 0.43, 0.46],
    [0, 1, 1, 0],
  )

  const viewByClimateTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.5, 0.53, 0.61, 0.64],
    [0, 1, 1, 0],
  )

  const keyOutcomesTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.68, 0.71, 0.79, 0.82],
    [0, 1, 1, 0],
  )

  // Summary tooltip: fades in after the panel is fully visible, fades out near
  // the end of the section. Follows the same 0.03/0.07/0.03 rhythm as others.
  const summaryTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.74, 0.77, 0.81, 0.84],
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
  useMotionValueEvent(summaryTooltipOpacity, "change", (latest) => {
    if (latest === 0) setSummaryTooltipClosed(false)
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
              minHeight: "80vh",
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
                id="central-valley-content"
                sx={{ display: "flex", flexDirection: "column", gap: "14px" }}
              >
                <PanelEyebrow>Central Valley Water</PanelEyebrow>
                <Typography variant="body1">
                  The{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
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
              minHeight: "80vh",
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
                <Box component="span" sx={ACCENT_TEXT_SX}>
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
              minHeight: "80vh",
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

        {/* ==================== SECTION 4.5: Arrows ==================== */}
        <Step data={"arrows" as SectionId}>
          <Box
            sx={{
              minHeight: "30vh",
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
              minHeight: "80vh",
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

        {/* ==================== SECTION 6: Rivers (sticky with progress) ==================== */}
        <Step data={"rivers" as SectionId} progress>
          <Box
            sx={{
              minHeight: "150vh",
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
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    Sacramento River
                  </Box>{" "}
                  flows from the north and the{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    San Joaquin River
                  </Box>{" "}
                  flows from the south. The rivers meet and mix in the low-lying{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    Delta
                  </Box>
                  .
                </Typography>
                <Typography variant="body1">
                  During{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
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
              minHeight: "80vh",
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
              minHeight: "80vh",
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
              minHeight: "80vh",
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
                <PanelEyebrow>Central Valley Water Modeling</PanelEyebrow>
                <Typography
                  variant="body1"
                  sx={{ mb: theme.space.component.lg }}
                >
                  To do this water planning and accounting, the federal{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    U.S. Bureau of Reclamation
                  </Box>{" "}
                  and the state{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    Department of Water Resources
                  </Box>{" "}
                  use a computer model called{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
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
              minHeight: "160vh",
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
                  decision-making. The COEQWAL project uses CalSim to explore
                  and report a wide range of different water management
                  strategies and climate futures. We are making these scenarios
                  available to the public so that communities can envision
                  alternative water futures for California.
                </Typography>
              </Box>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 12: Scenario intro ==================== */}
        {/*
          Scrollama detects entry. Internal animations use @repo/scrollytelling:
          - ScrollSectionContext.Provider shares scenarioIntroProgress with children
          - StickyElement pins the left call panel
          - ScrollElement handles opacity for each right-side panel (enter + hold)
          - useScrollPhase (above) derives pointer-events state per panel
        */}
        <Step data={"scenario-intro" as SectionId} progress>
          {/*
            ScrollSectionContext.Provider manually shares the same scroll progress
            that drives the tooltip animations with the ScrollElement children below.
            Both use the same scenarioIntroProgress MotionValue so all animations
            stay in sync without any extra useScroll calls.
          */}
          <ScrollSectionContext.Provider
            value={{
              progress: scenarioIntroProgress,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sectionRef: scenarioIntroRef as any,
            }}
          >
          <Box
            ref={scenarioIntroRef}
            id="scenario-intro-wrapper"
            sx={{
              minHeight: "550vh",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Sticky intro text at top */}
            <StickyElement
              top={paragraphTop}
              zIndex={2}
              style={{ pointerEvents: "none" }}
            >
              <Box
                sx={{
                  minHeight: "auto",
                  display: "flex",
                  alignItems: "flex-start",
                  pointerEvents: "none",
                  // Animate padding from default (paddingXl/padding) to narrow as user scrolls in
                  "& > #scenario-intro-call": {
                    transition:
                      "padding-left 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), padding-right 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    ...(scenarioIntroPaddingReduced && {
                      paddingLeft: "16px",
                      paddingRight: "16px",
                    }),
                  },
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
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
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
                      having five explanatory elements. Let&apos;s look at the
                      water management scenario for the way we currently manage
                      Central Valley water.
                    </Typography>
                  </Box>
                </CallResponsePanel>
              </Box>
            </StickyElement>

            {/* All right-side panels in a single sticky container */}
            <Box
              sx={{
                position: "sticky",
                top: "15vh",
                zIndex: 1,
                mt: "80vh",
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
                  pr: scenarioIntroPaddingReduced
                    ? "16px"
                    : theme.space.panel.padding,
                  transition:
                    "padding-right 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
                  pointerEvents: "none",
                }}
              >
                {/* Strategy info panel */}
                <ScrollElement
                  enter={[0.08, 0.14]}
                  hold={[0.14, 1.0]}
                  style={{ pointerEvents: "none" }}
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
                          pointerEvents: strategyPE,
                        }}
                      >
                        <div ref={strategyInfoRef}>
                          <Box
                            sx={{
                              pointerEvents: strategyPE,
                            }}
                          >
                            <StrategyInfoPanel
                              scenarioId="s0020"
                              onTitleClick={() =>
                                setStrategyTooltipClosed(false)
                              }
                            />
                          </Box>
                        </div>

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
                                to see the whole strategy description.
                                Underlined words appear in a glossary when
                                clicked.
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
                </ScrollElement>

                {/* Key operations panel */}
                <ScrollElement
                  enter={[0.22, 0.28]}
                  hold={[0.28, 1.0]}
                  style={{ pointerEvents: "none" }}
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
                          pointerEvents: keyOperationsPE,
                        }}
                      >
                        <div ref={keyOperationsRef}>
                          <Box
                            sx={{
                              pointerEvents: keyOperationsPE,
                            }}
                          >
                            <KeyOperationsPanel
                              scenarioId="s0020"
                              onTitleClick={() => setKeyOpsTooltipClosed(false)}
                            />
                          </Box>
                        </div>

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
                                Hover over the icons to see what key operations
                                they represent.
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
                              Choosing one of these climate icons will show you
                              how the scenario allocates water under different
                              potential future climates.
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
                </ScrollElement>

                {/* Key outcomes panel */}
                <ScrollElement
                  enter={[0.64, 0.68]}
                  hold={[0.68, 1.0]}
                  style={{ pointerEvents: "none" }}
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
                          pointerEvents: keyOutcomesPE,
                        }}
                      >
                        <div ref={keyOutcomesRef}>
                          <Box
                            sx={{
                              pointerEvents: keyOutcomesPE,
                            }}
                          >
                            <KeyOutcomesPanel
                              scenarioId="s0020"
                              onTitleClick={() =>
                                setKeyOutcomesTooltipClosed(false)
                              }
                            />
                          </Box>
                        </div>

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
                              While the strategy description, key operations,
                              and climate describe the key inputs into the
                              CalSim model, the outcomes listed here summarize
                              the outputs. They show how well the allocations
                              meet needs in each category.
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                  mt: theme.space.component.sm,
                                }}
                              >
                                Outcomes represented by a bar chart show the
                                percentage of locations in each tier. For other
                                outcomes, there is only one location of
                                interest.
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
                </ScrollElement>

                {/* Summary panel */}
                <ScrollElement
                  enter={[0.70, 0.74]}
                  hold={[0.74, 1.0]}
                  style={{ pointerEvents: "none" }}
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
                        ref={summaryContainerRef}
                        sx={{
                          position: "relative",
                          width: "100%",
                          maxWidth: RIGHT_PANEL_MAX_WIDTH,
                          pointerEvents: summaryPE,
                        }}
                      >
                        <div ref={summaryRef}>
                          <Box
                            sx={{
                              pointerEvents: summaryPE,
                            }}
                          >
                            <SummaryPanel scenarioId="s0020" />
                          </Box>
                        </div>

                        <ScrollTooltip
                          targetRef={summaryRef}
                          containerRef={summaryContainerRef}
                          content={
                            <>
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                5. Scenario summary
                              </Typography>
                              This panel synthesizes everything above into a
                              summary of the scenario&apos;s priorities and
                              trade-offs.
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
                                Click any outcome chart above to get a summary
                                specific to that outcome, including the
                                locations most affected. Click a location chip
                                to zoom the map directly to that location.
                              </Box>
                            </>
                          }
                          position="left"
                          offsetY={20}
                          opacity={summaryTooltipOpacity}
                          isClosed={summaryTooltipClosed}
                          onClose={() => setSummaryTooltipClosed(true)}
                        />
                      </Box>
                    </Box>
                  </Box>
                </ScrollElement>
              </Box>
            </Box>

            {/* Scroll spacer — gives the summary tooltip (progress 0.74–0.84)
                enough runway before the wrapper exits the viewport. */}
            <Box sx={{ height: "100vh" }} aria-hidden="true" />
          </Box>
          </ScrollSectionContext.Provider>
        </Step>

        {/* ==================== SECTION 13: Scenario Conclusion ==================== */}
        <Step data={"scenario-conclusion" as SectionId}>
          <Box
            sx={{
              minHeight: "80vh",
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
          height: "30vh",
          width: "100%",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </Box>
  )
}
