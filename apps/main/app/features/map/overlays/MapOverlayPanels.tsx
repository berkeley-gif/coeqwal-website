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

import { useState, useEffect, useRef, useCallback, type RefObject } from "react"

import { useTheme } from "@repo/ui/mui"
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { CallResponsePanel } from "@repo/ui"
import { Scrollama, Step } from "react-scrollama"
import {
  motion,
  MotionValue,
  useTransform,
  useMotionValueEvent,
} from "@repo/motion"

import {
  useScrollProgress,
  ScrollSectionContext,
  StickyElement,
  useScrollPhase,
  type ProgressRange,
} from "@repo/scrollytelling"
import ScrollTooltip from "../../tooltips/ScrollTooltip"

import { PanelEyebrow } from "./PanelEyebrow"
import {
  StrategyInfoPanel,
  KeyOperationsPanel,
  KeyOutcomesPanel,
  // SummaryPanel temporarily disabled - fetches heavy GeoJSON for polygon centroids
  // SummaryPanel,
} from "./scenarioPanels"
import { mapActions, useIsOutcomeVisualizationActive } from "../store"
import type { SectionId } from "../config/sectionLayers"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"

// Phase thresholds for useScrollPhase.stable module-level constants so
// the hook's internal useEffect dep array never triggers unnecessary re-runs.
// Phase 1: Panels enter one at a time (0.03–0.55), each sliding up with easing
const STRATEGY_PHASE_THRESHOLDS = {
  enter: [0.03, 0.14] as ProgressRange,
  hold: [0.14, 1.0] as ProgressRange,
}
const KEY_OPERATIONS_PHASE_THRESHOLDS = {
  enter: [0.18, 0.29] as ProgressRange,
  hold: [0.29, 1.0] as ProgressRange,
}
const KEY_OUTCOMES_PHASE_THRESHOLDS = {
  enter: [0.33, 0.44] as ProgressRange,
  hold: [0.44, 1.0] as ProgressRange,
}
const SUMMARY_PHASE_THRESHOLDS = {
  enter: [0.48, 0.59] as ProgressRange,
  hold: [0.59, 1.0] as ProgressRange,
}

// Ease-out cubic.fast start, gentle deceleration into final position
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

const PANEL_POSITIONS = {
  // Sticky top for the left intro paragraph. Unchanged, since the
  // paragraph is short and reads well at this vertical position.
  paragraphTop: "15vh",
} as const

// Sticky top for the right-side panel stack, in pixels. The Learn
// page's visual top-chrome (site header + any tab/sub-nav rows) is
// ~90px on production builds; we add a small pad below that so the
// panels sit just clear of the header stack. Kept as a single
// explicit pixel constant (rather than adding theme tokens for every
// sticky band) so it's trivial to tune for demo.
const RIGHT_PANELS_TOP_PX = 110

const ACCENT_TEXT_SX = {
  fontFamily: themeValues.fontFamily.accent,
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: "1.4rem",
} as const

const LEARN_SCENARIO_ID = "s0020" // for the Scenario Intro panels
const RIGHT_PANEL_MAX_WIDTH = "540px"

const SLIDE_DISTANCE = 500 // px, starting Y-offset for the Scenario Intro slide-up animation; used in useTransform so can't be css value

/** Pairs opacity (0-1) and Y translation (SLIDE_DISTANCE->0) for a panel entrance. */
function usePanelEntrance(progress: MotionValue<number>, range: ProgressRange) {
  const opacity = useTransform(progress, range, [0, 1], {
    ease: easeOutCubic,
  })
  const y = useTransform(progress, range, [SLIDE_DISTANCE, 0], {
    ease: easeOutCubic,
  })
  return { opacity, y }
}

/** Shared wrapper for the 4 right-side scenario intro panels (strategy, key ops, outcomes, summary). */
function RightPanelSlot({
  entrance,
  pointerEvents,
  containerRef,
  targetRef,
  children,
  tooltip,
}: {
  entrance: { opacity: MotionValue<number>; y: MotionValue<number> }
  pointerEvents: React.CSSProperties["pointerEvents"]
  containerRef: RefObject<HTMLDivElement | null>
  targetRef: RefObject<HTMLDivElement | null>
  children: React.ReactNode
  tooltip: React.ReactNode
}) {
  return (
    <motion.div
      style={{
        opacity: entrance.opacity,
        y: entrance.y,
        pointerEvents: "none",
        display: "flex",
        justifyContent: "flex-end",
        width: "100%",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: RIGHT_PANEL_MAX_WIDTH,
          pointerEvents,
        }}
      >
        <div ref={targetRef} style={{ pointerEvents }}>
          {children}
        </div>
        {tooltip}
      </Box>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapOverlayPanels() {
  const theme = useTheme()

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

  // Ref for multi-step sticky animation (Framer Motion)
  // Attached directly to the JSX element via ref={scenarioIntroRef} below,
  // so no MutationObserver needed.
  const scenarioIntroRef = useRef<HTMLDivElement>(null)

  // Tooltip target/container ref pairs.one per right-side panel
  const panelRefs = {
    strategy: {
      target: useRef<HTMLDivElement>(null),
      container: useRef<HTMLDivElement>(null),
    },
    keyOperations: {
      target: useRef<HTMLDivElement>(null),
      container: useRef<HTMLDivElement>(null),
      hydroclimateTarget: useRef<HTMLDivElement>(null),
    },
    keyOutcomes: {
      target: useRef<HTMLDivElement>(null),
      container: useRef<HTMLDivElement>(null),
    },
    summary: {
      target: useRef<HTMLDivElement>(null),
      container: useRef<HTMLDivElement>(null),
    },
  }

  // Tracks which tooltips the user (or the system) has manually closed.
  // A tooltip is "closed" when its key is in the set.
  const [closedTooltips, setClosedTooltips] = useState<Set<string>>(
    () => new Set(),
  )
  const _closeTooltip = useCallback(
    (key: string) =>
      setClosedTooltips((prev) => {
        if (prev.has(key)) return prev
        const next = new Set(prev)
        next.add(key)
        return next
      }),
    [],
  )
  const reopenTooltip = useCallback(
    (key: string) =>
      setClosedTooltips((prev) => {
        if (!prev.has(key)) return prev
        const next = new Set(prev)
        next.delete(key)
        return next
      }),
    [],
  )
  const closeAllTooltips = useCallback(
    () =>
      setClosedTooltips(
        new Set([
          "strategy",
          "keyOps",
          "viewByClimate",
          "keyOutcomes",
          "summary",
        ]),
      ),
    [],
  )

  // Close tooltips when outcome visualization is activated
  const isOutcomeActive = useIsOutcomeVisualizationActive()

  useEffect(() => {
    if (isOutcomeActive) closeAllTooltips()
  }, [isOutcomeActive, closeAllTooltips])

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

  // Panel phases.useScrollPhase replaces the manual useTransform + latch +
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
  const _summaryPE = summaryPhase === "before" ? "none" : "auto"

  // Track when scenario-intro has been scrolled into, to reduce left/right padding
  const [scenarioIntroPaddingReduced, setScenarioIntroPaddingReduced] =
    useState(false)

  // Simplified progress listener: drives the padding transition and early
  // camera shift. When the scroll section first enters the viewport bottom
  // (progress > 0.01), we immediately set the active section so the map
  // camera pans left in sync with the paragraph padding reduction.rather
  // than waiting for Scrollama's step-enter (which fires at offset 0.5).
  useMotionValueEvent(scenarioIntroProgress, "change", (latest) => {
    const entering = latest > 0.01
    setScenarioIntroPaddingReduced(entering)
    if (entering) {
      mapActions.setActiveSection("scenario-intro")
    }
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

  // Phase 1: Panel entrance.each slides up from below the viewport
  // and fades in with ease-out cubic (fast start -> gentle settle).
  // Only one panel animates at a time; each waits for the previous to land.
  const strategy = usePanelEntrance(
    scenarioIntroProgress,
    STRATEGY_PHASE_THRESHOLDS.enter,
  )
  const keyOperations = usePanelEntrance(
    scenarioIntroProgress,
    KEY_OPERATIONS_PHASE_THRESHOLDS.enter,
  )
  const keyOutcomes = usePanelEntrance(
    scenarioIntroProgress,
    KEY_OUTCOMES_PHASE_THRESHOLDS.enter,
  )
  const _summary = usePanelEntrance(
    scenarioIntroProgress,
    SUMMARY_PHASE_THRESHOLDS.enter,
  )

  // Phase 2: Tooltip opacity.sequenced AFTER all panels are in position.
  // Panels finish entering at ~0.59, tooltips run 0.62–0.90.
  // Each: 0.02 fade in, 0.03 hold, 0.02 fade out = 0.07 per tooltip,
  // with ~0.005 gap between. Longer hold gives readers time to absorb.
  const strategyInfoTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.62, 0.64, 0.67, 0.69],
    [0, 1, 1, 0],
  )

  const keyOperationsTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.695, 0.715, 0.745, 0.765],
    [0, 1, 1, 0],
  )

  const viewByClimateTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.77, 0.79, 0.82, 0.84],
    [0, 1, 1, 0],
  )

  const keyOutcomesTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.845, 0.865, 0.895, 0.915],
    [0, 1, 1, 0],
  )

  const summaryTooltipOpacity = useTransform(
    scenarioIntroProgress,
    [0.92, 0.935, 0.965, 0.98],
    [0, 1, 1, 0],
  )

  // Reset tooltip closed states when scrolling away (opacity goes to 0)
  // This allows tooltips to reappear when user scrolls back to that section
  useMotionValueEvent(strategyInfoTooltipOpacity, "change", (latest) => {
    if (latest === 0) reopenTooltip("strategy")
  })
  useMotionValueEvent(keyOperationsTooltipOpacity, "change", (latest) => {
    if (latest === 0) reopenTooltip("keyOps")
  })
  useMotionValueEvent(viewByClimateTooltipOpacity, "change", (latest) => {
    if (latest === 0) reopenTooltip("viewByClimate")
  })
  useMotionValueEvent(keyOutcomesTooltipOpacity, "change", (latest) => {
    if (latest === 0) reopenTooltip("keyOutcomes")
  })
  useMotionValueEvent(summaryTooltipOpacity, "change", (latest) => {
    if (latest === 0) reopenTooltip("summary")
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
            Short scroll runway.no visible content.
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
              isVisible
            >
              <Box
                id="central-valley-content"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.space.component.lg,
                }}
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
                  in the world, supplies drinking water to millions of people,
                  and protects sensitive species and health of ecosystems.
                </Typography>
              </Box>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 3: Rivers (sticky with progress) ==================== */}
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
                isVisible
                sx={{ minHeight: "auto", mb: 0 }}
              >
                <Typography variant="body1">
                  The{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    Sacramento River
                  </Box>{" "}
                  flows through the Valley from the north and the{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    San Joaquin River
                  </Box>{" "}
                  flows from the south. These rivers meet in the{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    Delta
                  </Box>
                  , a unique ecosystem of low-lying islands, farms, and
                  wetlands. Here river water mixes with salty tides from San
                  Francisco Bay. Pumps and canals move water from the Delta to
                  cities and farms to the south.
                </Typography>
              </CallResponsePanel>
            </Box>
          </Box>
        </Step>

        {/* ==================== SECTION 7: Water Distribution ==================== */}
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
              isVisible
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
              isVisible
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.space.component.lg,
                }}
              >
                <PanelEyebrow>Central Valley Water Modeling</PanelEyebrow>
                <Typography
                  variant="body1"
                  sx={{ mb: theme.space.component.lg }}
                >
                  The federal{" "}
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
                  </Box>{" "}
                  to do this accounting.
                </Typography>
                <Typography variant="body1">
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    CalSim
                  </Box>{" "}
                  represents the water management system as a network and
                  simulates how much water flows into reservoirs, how much is
                  stored or released, and where it gets delivered.
                </Typography>
              </Box>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== SECTION 10: COEQWAL ==================== */}
        <Step data={"coeqwal" as SectionId}>
          <Box
            sx={{
              minHeight: "120vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
            }}
          >
            <CallResponsePanel
              id="coeqwal-call"
              side="left"
              variant="call"
              isVisible
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: theme.space.component.lg,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ mb: theme.space.component.lg }}
                >
                  The COEQWAL project uses{" "}
                  <Box component="span" sx={ACCENT_TEXT_SX}>
                    CalSim
                  </Box>{" "}
                  to explore a wide range of different water management
                  strategies and climate futures – and makes these scenarios
                  available to the public.
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Let&apos;s look at a scenario that represents how we currently
                  manage water.
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
              sectionRef: scenarioIntroRef as RefObject<HTMLElement | null>,
            }}
          >
            <Box
              ref={scenarioIntroRef}
              id="scenario-intro-wrapper"
              sx={{
                minHeight: "1100vh",
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
                        paddingLeft: theme.space.component.lg,
                        paddingRight: theme.space.component.lg,
                      }),
                    },
                  }}
                >
                  <CallResponsePanel
                    id="scenario-intro-call"
                    side="left"
                    variant="call"
                    isVisible
                    minHeight="auto"
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: theme.space.component.lg,
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
                        Every{" "}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          scenario
                        </Box>{" "}
                        has three main elements: water management{" "}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          strategy
                        </Box>
                        ,{" "}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          hydroclimate
                        </Box>{" "}
                        and{" "}
                        <Box component="span" sx={{ fontWeight: 700 }}>
                          outcomes
                        </Box>
                        .
                      </Typography>
                    </Box>
                  </CallResponsePanel>
                </Box>
              </StickyElement>

              {/* All right-side panels in a single sticky container.
                  Anchored a fixed pixel distance from the top so the
                  stack always clears the full header chrome (header +
                  any sub-nav rows) on any viewport while still having
                  room to fit without overflowing the bottom. */}
              <Box
                sx={{
                  position: "sticky",
                  top: `${RIGHT_PANELS_TOP_PX}px`,
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
                      ? theme.space.component.lg
                      : theme.space.panel.padding,
                    transition:
                      "padding-right 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
                    pointerEvents: "none",
                  }}
                >
                  {/* Strategy info panel */}
                  <RightPanelSlot
                    entrance={strategy}
                    pointerEvents={strategyPE}
                    containerRef={panelRefs.strategy.container}
                    targetRef={panelRefs.strategy.target}
                    tooltip={
                      <ScrollTooltip
                        targetRef={panelRefs.strategy.target}
                        containerRef={panelRefs.strategy.container}
                        content={
                          <>
                            <Typography
                              variant="tooltipHeader"
                              sx={{ mb: theme.space.component.xs }}
                            >
                              Water management strategy
                            </Typography>
                            This panel describes the decisions, priorities, and
                            policies that determine how water is allocated.
                          </>
                        }
                        position="left"
                        offsetY={30}
                        opacity={strategyInfoTooltipOpacity}
                        isClosed={closedTooltips.has("strategy")}
                      />
                    }
                  >
                    <StrategyInfoPanel
                      scenarioId={LEARN_SCENARIO_ID}
                      onTitleClick={() => reopenTooltip("strategy")}
                    />
                  </RightPanelSlot>

                  {/* Key operations panel */}
                  <RightPanelSlot
                    entrance={keyOperations}
                    pointerEvents={keyOperationsPE}
                    containerRef={panelRefs.keyOperations.container}
                    targetRef={panelRefs.keyOperations.target}
                    tooltip={
                      <>
                        <ScrollTooltip
                          targetRef={panelRefs.keyOperations.target}
                          containerRef={panelRefs.keyOperations.container}
                          content={
                            <>
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                Key operations
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
                              <Box component="span" sx={{ display: "block" }}>
                                Hover over the icons to see what key operations
                                they represent.
                              </Box>
                            </>
                          }
                          position="left"
                          offsetY={20}
                          opacity={keyOperationsTooltipOpacity}
                          isClosed={closedTooltips.has("keyOps")}
                        />

                        <ScrollTooltip
                          targetRef={panelRefs.keyOperations.target}
                          containerRef={panelRefs.keyOperations.container}
                          alignTargetRef={
                            panelRefs.keyOperations.hydroclimateTarget
                          }
                          content={
                            <>
                              <Typography
                                variant="tooltipHeader"
                                sx={{ mb: theme.space.component.xs }}
                              >
                                Hydroclimate
                              </Typography>
                              This describes the temperature and patterns of
                              rainfall and snow that determine how much water is
                              available over time. Choose a hydroclimate to see
                              how the outcomes below change under different
                              conditions.
                              <Typography
                                variant="tooltipHeader"
                                sx={{
                                  mt: theme.space.component.sm,
                                  mb: theme.space.component.xs,
                                }}
                              >
                                Try this:
                              </Typography>
                              <Box component="span" sx={{ display: "block" }}>
                                Click an icon to update the key outcomes; hover
                                to learn about each hydroclimate.
                              </Box>
                            </>
                          }
                          position="left"
                          offsetY={20}
                          opacity={viewByClimateTooltipOpacity}
                          isClosed={closedTooltips.has("viewByClimate")}
                        />
                      </>
                    }
                  >
                    <KeyOperationsPanel
                      scenarioId={LEARN_SCENARIO_ID}
                      onTitleClick={() => reopenTooltip("keyOps")}
                      hydroclimateRef={
                        panelRefs.keyOperations.hydroclimateTarget
                      }
                    />
                  </RightPanelSlot>

                  {/* Key outcomes panel */}
                  <RightPanelSlot
                    entrance={keyOutcomes}
                    pointerEvents={keyOutcomesPE}
                    containerRef={panelRefs.keyOutcomes.container}
                    targetRef={panelRefs.keyOutcomes.target}
                    tooltip={
                      <ScrollTooltip
                        targetRef={panelRefs.keyOutcomes.target}
                        containerRef={panelRefs.keyOutcomes.container}
                        content={
                          <>
                            <Typography
                              variant="tooltipHeader"
                              sx={{ mb: theme.space.component.xs }}
                            >
                              Key outcomes
                            </Typography>
                            Each scenario produces different outcomes for
                            agriculture, communities, and the environment.
                            <Box
                              component="span"
                              sx={{
                                display: "block",
                                mt: theme.space.component.sm,
                              }}
                            >
                              Outcomes represented by a bar chart show the
                              percentage of locations in each tier. For other
                              outcomes, there is only one location.
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
                            <Box component="span" sx={{ display: "block" }}>
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
                            <Box
                              component="span"
                              sx={{
                                display: "block",
                                mt: theme.space.component.sm,
                              }}
                            >
                              When outcomes are visible on the map, you can
                              hover over them to get more information.
                            </Box>
                          </>
                        }
                        position="left"
                        offsetY={20}
                        opacity={keyOutcomesTooltipOpacity}
                        isClosed={closedTooltips.has("keyOutcomes")}
                      />
                    }
                  >
                    <KeyOutcomesPanel
                      scenarioId={LEARN_SCENARIO_ID}
                      onTitleClick={() => reopenTooltip("keyOutcomes")}
                    />
                  </RightPanelSlot>

                  {/* SummaryPanel temporarily disabled - fetches heavy GeoJSON
                     for polygon centroids. Re-enable once centroids are available
                     from a lightweight endpoint or hardcoded. */}
                  {/* <RightPanelSlot
                    entrance={_summary}
                    pointerEvents={_summaryPE}
                    containerRef={panelRefs.summary.container}
                    targetRef={panelRefs.summary.target}
                    tooltip={...}
                  >
                    <SummaryPanel scenarioId={LEARN_SCENARIO_ID} />
                  </RightPanelSlot> */}
                </Box>
              </Box>

              {/* Scroll spacer.gives the summary tooltip (progress 0.74–0.84)
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
              isVisible
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
