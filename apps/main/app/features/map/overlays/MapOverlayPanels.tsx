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
import { Box, Typography, InfoIcon } from "@repo/ui/mui"
import { CallResponsePanel } from "@repo/ui"
import { Scrollama, Step } from "react-scrollama"
import { themeValues } from "@repo/ui/themes/theme"
import { PanelEyebrow } from "./PanelEyebrow"
import type { SectionId } from "../config/sectionLayers"
import { useLearnScrollama, SCROLLAMA_CONFIG } from "../hooks/useLearnScrollama"
import { WelcomePanel, WaterIssuesPanel, HydroclimateFuturesPanel, KeyOutcomesPanel, DataInDepthPanel, InterpretingOutcomesPanel, ChooseScenariosPanel, BeforeYouBeginPanel } from "../../scenarioExplorer/getStarted/panels"
import TierAnimationSection from "../../scenarioExplorer/animation/TierAnimationSection"


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MapOverlayPanels() {
  const theme = useTheme()

  // react-scrollama callbacks
  const { onStepEnter, onStepExit, onStepProgress } = useLearnScrollama()

  const ACCENT_TEXT_SX = {
    fontFamily: themeValues.fontFamily.accent,
    fontStyle: "italic",
    fontWeight: 500,
    fontSize: "1.4rem",
  } as const

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
        { /* ==================== Intro =========================== */}
        <Step data={"intro" as SectionId}>
          <Box
            id="intro"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <CallResponsePanel
              id="intro-call"
              side="left"
              variant="call"
              isVisible
            >
              <Typography variant="body1">
                Review this section to learn how you can explore the COEQWAL scenario library, evaluate the effects of different water management strategies on communities, farms, and the environment, and gather information to share with others.
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
        <Step data={"california" as SectionId}>
          <Box sx={{ height: "50vh", pointerEvents: "none" }} />
        </Step>

        {/* ==================== Central Valley ==================== */}
        <Step data={"central-valley" as SectionId}>
          <Box
            id="central-valley"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
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

        {/* ==================== Rivers (sticky with progress) ==================== */}
        <Step data={"rivers" as SectionId} progress>
          <Box
            id="rivers"
            sx={{
              minHeight: "150vh",
              position: "relative",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
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

        {/* ==================== Water Distribution ==================== */}
        <Step data={"distribution" as SectionId}>
          <Box
            id="distribution"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
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
                Water is stored, diverted and distributed to multiple points
                throughout the Valley and to cities along the coast. All of it
                must be carefully accounted for.
              </Typography>
            </CallResponsePanel>
          </Box>
        </Step>

        {/* ==================== CalSim ==================== */}
        <Step data={"calsim" as SectionId}>
          <Box
            id="calsim"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
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
        <Step data={"coeqwal" as SectionId}>
          <Box
            id="coeqwal"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <WelcomePanel />
          </Box>
        </Step>
        <Step data={"water-issues" as SectionId}>
          <Box
            id="water-issues"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <WaterIssuesPanel />
          </Box>
        </Step>


        <Step data={"hydroclimates" as SectionId}>
          <Box
            id="hydroclimates"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <HydroclimateFuturesPanel />
          </Box>
        </Step>
        <Step data={"key-outcomes" as SectionId}>
          <Box
            id="key-outcomes"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <KeyOutcomesPanel />
          </Box>
        </Step>

        {/* ==================== Storyboard ====================
        300vh runway gives the click-driven storyboard room to sit.
        sticky + 100vh pins it in view while the user is in this section.
        progress={true} is prep for scroll-driven migration — onStepProgress
        will eventually write the storyboard's MotionValue instead of Next/Back.
        */}
        <Step data={"outcomes-viz" as SectionId} progress>
          <Box
            sx={{
              minHeight: "100vh",
              position: "relative",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: 0,
                height: "100vh",
                // Re-enable pointer events for Play/Next/Back controls
                // and interactive squares.
                pointerEvents: "auto",
              }}
            >
              <TierAnimationSection />
            </Box>
          </Box>
        </Step>


        <Step data={"data-in-depth-intro" as SectionId}>
          <Box
            id="data-in-depth-intro"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <DataInDepthPanel />
          </Box>
        </Step>

        <Step data={"interpreting-outcomes" as SectionId}>
          <Box
            id="interpreting-outcomes"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <InterpretingOutcomesPanel />
          </Box>
        </Step>

        <Step data={"choosing-scenarios" as SectionId}>
          <Box
            id="choosing-scenarios"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <ChooseScenariosPanel />
          </Box>
        </Step>


        <Step data={"before-exploring" as SectionId}>
          <Box
            id="before-exploring"
            sx={{
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              pointerEvents: "none",
              paddingLeft: (theme) => theme.space.panel.paddingXl,
              paddingRight: (theme) => theme.space.panel.padding,
            }}
          >
            <BeforeYouBeginPanel />
          </Box>
        </Step>
      </Scrollama>
    </Box>
  )
}
