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

import { useTheme } from "@repo/ui/mui"
import { Box, Typography } from "@repo/ui/mui"
import { CallResponsePanel } from "@repo/ui"
import { Scrollama, Step } from "react-scrollama"
import { PanelEyebrow } from "./PanelEyebrow"
import type { SubSectionId } from "../config/sectionLayers"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"
import {
  WelcomePanel,
  WaterIssuesPanel,
  HydroclimateFuturesPanel,
  KeyOutcomesPanel,
  DataInDepthPanel,
  InterpretingOutcomesPanel,
  ChooseScenariosPanel,
  BeforeYouBeginPanel,
} from "./learnPanels"
import TierAnimationSection from "../animation/TierAnimationSection"
import { StickyScrollSection } from "@repo/scrollytelling"
import { GlossaryTermLink } from "../../glossary"
interface MapOverlayPanelsProps {
  navWidth: number
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapOverlayPanels({ navWidth }: MapOverlayPanelsProps) {
  const theme = useTheme()
  const defaultLeftPadding = `calc(${theme.space.panel.paddingXl} + ${navWidth}px)`
  const defPaddingTransition = "padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)"

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

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
        {/* ==================== Intro =========================== */}
        <Step data={"intro" as SubSectionId}>
          <Box
            id="intro"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
            }}
          >
            <CallResponsePanel
              id="intro-call"
              side="left"
              variant="call"
              isVisible
            >
              <PanelEyebrow>Get Started</PanelEyebrow>
              <Typography variant="body1">
                Review this section to learn how you can explore the{" "}
                <GlossaryTermLink>COEQWAL</GlossaryTermLink>{" "}
                <GlossaryTermLink>scenario</GlossaryTermLink> library, evaluate
                the effects of different water{" "}
                <GlossaryTermLink>management strategies</GlossaryTermLink> on
                communities, farms, and the environment, and gather information
                to share with others.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== California overview ====================
            Short scroll runway.no visible content.
            Fires the Scrollama "california" step as soon as the section enters
            the viewport, triggering the Central Valley zoom via useLearnScrollama.
            50vh gives the zoom animation time to play and the momentum of an
            active scroll to settle before the central-valley paragraph slides in. */}
        <Step data={"california" as SubSectionId}>
          <Box sx={{ height: "50vh", pointerEvents: "none" }} />
        </Step>

        {/* ==================== Central Valley ==================== */}
        <Step data={"central-valley" as SubSectionId}>
          <Box
            id="central-valley"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              transition: defPaddingTransition,
              paddingRight: (theme) => theme.space.panel.padding,
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
                <PanelEyebrow>
                  California&apos;s Central Valley Water System
                </PanelEyebrow>
                <Typography variant="body1">
                  The <GlossaryTermLink>Central Valley</GlossaryTermLink> is a
                  long, low valley that collects much of California&apos;s water
                  from surrounding mountains. This water is stored, divided up,
                  and used to irrigate the most productive farmland in the
                  world, supply drinking water to millions of people, and
                  protect sensitive species and health of ecosystems.
                </Typography>
              </Box>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== Rivers (sticky with progress) ==================== */}
        <Step data={"rivers" as SubSectionId} progress>
          <Box
            id="rivers"
            sx={{
              minHeight: "150vh",
              position: "relative",
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              transition: defPaddingTransition,
              paddingRight: (theme) => theme.space.panel.padding,
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
                sx={{
                  minHeight: "auto",
                  mb: 0,
                  backgroundColor: (theme) => theme.background.paragraph,
                  padding: (theme) => theme.space.card.xs,
                  borderRadius: (theme) => theme.borderRadius.md,
                }}
              >
                <Typography variant="body1">
                  The <GlossaryTermLink>Sacramento River</GlossaryTermLink>{" "}
                  flows through the Valley from the north and the{" "}
                  <GlossaryTermLink>San Joaquin River</GlossaryTermLink> flows
                  from the south. These rivers meet in the Delta, a unique
                  ecosystem of low-lying islands, farms, and wetlands. Here
                  river water mixes with salty tides from San Francisco Bay.
                  Pumps and canals move water from the Delta to cities and farms
                  to the south.
                </Typography>
              </CallResponsePanel>
            </Box>
          </Box>
        </Step>

        {/* ==================== Water Distribution ==================== */}
        <Step data={"distribution" as SubSectionId}>
          <Box
            id="distribution"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              transition: defPaddingTransition,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <CallResponsePanel
              id="distribution-call"
              side="left"
              variant="call"
              isVisible
            >
              <Typography variant="body1">
                Water is stored, diverted, and distributed to multiple points
                throughout the Central Valley and to cities along the coast,
                including Los Angeles. All of the water must be carefully
                accounted for.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== CalSim ==================== */}
        <Step data={"calsim" as SubSectionId}>
          <Box
            id="calsim"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              transition: defPaddingTransition,
              paddingRight: (theme) => theme.space.panel.padding,
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
                  <GlossaryTermLink>
                    U.S. Bureau of Reclamation
                  </GlossaryTermLink>{" "}
                  and the state{" "}
                  <GlossaryTermLink term="California Department of Water Resources (DWR)">
                    Department of Water Resources
                  </GlossaryTermLink>{" "}
                  use a computer model called{" "}
                  <GlossaryTermLink>CalSim3</GlossaryTermLink> to do this
                  accounting.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mb: theme.space.component.lg }}
                >
                  <GlossaryTermLink>CalSim3</GlossaryTermLink> represents the
                  water management system as a network of interconnected nodes,
                  spanning most of the Sacramento and San Joaquin Valley. The
                  Tulare Basin and other parts of the southern San Joaquin
                  Valley are only partially represented. The model simulates how
                  much water flows through rivers and into reservoirs, how much
                  is stored or released, and where it gets delivered – both
                  within and outside of the{" "}
                  <GlossaryTermLink>Central Valley</GlossaryTermLink>.
                </Typography>
                <Typography variant="body1">
                  <GlossaryTermLink>CalSim3</GlossaryTermLink> also calculates
                  how water flowing into the{" "}
                  <GlossaryTermLink>Delta</GlossaryTermLink> affects{" "}
                  <GlossaryTermLink>salinity</GlossaryTermLink>, how much water
                  is pumped out of the{" "}
                  <GlossaryTermLink>Delta</GlossaryTermLink>, and how much water
                  flows into the San Francisco Bay. In addition,{" "}
                  <GlossaryTermLink>CalSim3</GlossaryTermLink> estimates how{" "}
                  <GlossaryTermLink term="Groundwater basin">
                    groundwater basins
                  </GlossaryTermLink>{" "}
                  below the <GlossaryTermLink>Central Valley</GlossaryTermLink>{" "}
                  are affected by pumping.
                </Typography>
              </Box>
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

      <Scrollama onStepEnter={onStepEnter} offset={SCROLLAMA_CONFIG.offset}>
        <Step data={"coeqwal" as SubSectionId}>
          <Box
            id="coeqwal"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <WelcomePanel />
          </Box>
        </Step>
        <Step data={"water-issues" as SubSectionId}>
          <Box
            id="water-issues"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <WaterIssuesPanel />
          </Box>
        </Step>

        <Step data={"hydroclimates" as SubSectionId}>
          <Box
            id="hydroclimates"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <HydroclimateFuturesPanel />
          </Box>
        </Step>
        <Step data={"key-outcomes" as SubSectionId}>
          <Box
            id="key-outcomes"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <KeyOutcomesPanel />
          </Box>
        </Step>

        {/* ==================== Storyboard ====================
        StickyScrollSection gives the click-driven storyboard a real 300vh
        runway to sit in — same pinning primitive the homepage panels use
        (AboutCoeqwalPanel, WaterThemesPanel). The hand-rolled sticky+minHeight
        version this replaced never actually held the panel in place: minHeight
        just floors the runway, so it silently grew to match the sticky child's
        own height instead of exceeding it, collapsing the dwell window to zero.
        progress={true} on the Step is prep for scroll-driven migration —
        onStepProgress will eventually write the storyboard's MotionValue
        instead of Next/Back.
        */}
        <Step data={"outcomes-viz" as SubSectionId} progress>
          <StickyScrollSection
            height="200vh"
            stickyTop={theme.layout.headerHeight}
            stickyHeight={`calc(100vh - ${theme.layout.headerHeight}px)`}
            style={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              transition: defPaddingTransition,
              paddingRight: theme.space.panel.padding,
            }}
            // Re-enable pointer events for Play/Next/Back controls and
            // interactive squares.
            stickyStyle={{ pointerEvents: "auto" }}
          >
            <TierAnimationSection />
          </StickyScrollSection>
        </Step>

        <Step data={"data-in-depth-intro" as SubSectionId}>
          <Box
            id="data-in-depth-intro"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <DataInDepthPanel />
          </Box>
        </Step>

        <Step data={"interpreting-outcomes" as SubSectionId}>
          <Box
            id="interpreting-outcomes"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <InterpretingOutcomesPanel />
          </Box>
        </Step>

        <Step data={"choosing-scenarios" as SubSectionId}>
          <Box
            id="choosing-scenarios"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              my: theme.space.section.xl,
            }}
          >
            <ChooseScenariosPanel />
          </Box>
        </Step>

        <Step data={"before-exploring" as SubSectionId}>
          <Box
            id="before-exploring"
            sx={{
              pointerEvents: "none",
              paddingLeft: defaultLeftPadding,
              paddingRight: (theme) => theme.space.panel.padding,
              transition: defPaddingTransition,
              mt: theme.space.section.xl,
            }}
          >
            <BeforeYouBeginPanel />
          </Box>
        </Step>
      </Scrollama>
    </Box>
  )
}
