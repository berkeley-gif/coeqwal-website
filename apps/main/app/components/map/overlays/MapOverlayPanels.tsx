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
import ScrollTooltip from "./ScrollTooltip"
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
import { useScroll, useTransform, motion } from "@repo/motion"
import {
  useLearnScrollama,
  SCROLLAMA_CONFIG,
} from "../hooks/useLearnScrollama"

export default function MapOverlayPanels() {
  const map = useMap()
  const geocodingResetCounter = useGeocodingResetCounter()

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

  // UI state
  const [isFirstPanelVisible, setIsFirstPanelVisible] = useState(false)

  // Ref for multi-step sticky animation (Framer Motion)
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

  // ============================================================================
  // Framer Motion: Scenario-intro choreography
  // ============================================================================

  // Multi-step sticky choreography:
  // Tracks scroll through the scenario-intro-wrapper section
  const { scrollYProgress: scenarioIntroProgress } = useScroll({
    target: scenarioIntroRef,
    offset: ["start end", "end start"],
  })

  // Animate paragraph position: starts at 45vh (midpoint), moves to 15vh (top)
  const paragraphTop = useTransform(
    scenarioIntroProgress,
    [0, 0.25, 0.4, 1],
    ["45vh", "45vh", "15vh", "15vh"],
  )

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

  const summaryPanelOpacity = useTransform(
    scenarioIntroProgress,
    [0.68, 0.74],
    [0, 1],
  )

  // Panel pointer events - disable when not visible
  const strategyInfoPointerEvents = useTransform(
    strategyInfoPanelOpacity,
    (v) => (v > 0.1 ? "auto" : "none"),
  )
  const keyOperationsPointerEvents = useTransform(
    keyOperationsPanelOpacity,
    (v) => (v > 0.1 ? "auto" : "none"),
  )
  const keyOutcomesPointerEvents = useTransform(keyOutcomesPanelOpacity, (v) =>
    v > 0.1 ? "auto" : "none",
  )
  const summaryPointerEvents = useTransform(summaryPanelOpacity, (v) =>
    v > 0.1 ? "auto" : "none",
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
                and cities across the state.
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
              minHeight: "120vh", // Extended to keep arrows visible longer
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
                  centralValleyBasins as FeatureCollection<Polygon | MultiPolygon>
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
            ref={scenarioIntroRef}
            id="scenario-intro-wrapper"
            sx={{
              minHeight: "550vh",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            {/* Sticky intro text - animated position from midpoint to top */}
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
                  <Typography variant="body1" sx={{ maxWidth: "460px" }}>
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
                  pl: { xs: 2, sm: 3, md: 4 },
                  pr: { xs: 4, sm: 8, md: 12, lg: 16 },
                  pointerEvents: "none",
                }}
              >
                {/* Strategy info panel */}
                <motion.div
                  style={{
                    opacity: strategyInfoPanelOpacity,
                    pointerEvents: strategyInfoPointerEvents,
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
                          maxWidth: "500px",
                          pointerEvents: "none",
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
                  </Box>
                </motion.div>

                {/* Key operations panel */}
                <motion.div
                  style={{
                    opacity: keyOperationsPanelOpacity,
                    pointerEvents: keyOperationsPointerEvents,
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
                          maxWidth: "500px",
                          pointerEvents: "none",
                        }}
                      >
                        <Box
                          ref={keyOperationsRef}
                          sx={{ pointerEvents: "auto" }}
                        >
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
                                sx={{
                                  fontWeight: 600,
                                  display: "block",
                                  mb: 0.5,
                                }}
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
                      </Box>
                    </Box>
                  </Box>
                </motion.div>

                {/* Key outcomes panel */}
                <motion.div
                  style={{
                    opacity: keyOutcomesPanelOpacity,
                    pointerEvents: keyOutcomesPointerEvents,
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
                          maxWidth: "500px",
                          pointerEvents: "none",
                        }}
                      >
                        <Box
                          ref={keyOutcomesRef}
                          sx={{ pointerEvents: "auto" }}
                        >
                          <KeyOutcomesPanel
                            scenarioId="s0020"
                            onTitleClick={() =>
                              setKeyOutcomesTooltipClosed(false)
                            }
                          />
                        </Box>

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
                              These outcomes show how this strategy affects water
                              supply, ecosystems, agriculture, and communities.
                              <Box
                                component="span"
                                sx={{ display: "block", mt: 1 }}
                              >
                                Some outcomes record values from multiple
                                locations in a bar chart that shows the number of
                                locations in each tier. Other outcomes are
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
                    pointerEvents: summaryPointerEvents,
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
                          pointerEvents: "auto",
                          width: "100%",
                          maxWidth: "500px",
                        }}
                      >
                        <SummaryPanel strategy="current-ops" />
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
