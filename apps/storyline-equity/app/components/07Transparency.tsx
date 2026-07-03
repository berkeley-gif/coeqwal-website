"use client"

import { motion } from "@repo/motion"
import type { ReactNode } from "react"
import {
  ScrollElement,
  ScrollSection,
  StickyElement,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import {
  appActions,
  useActiveSectionStore,
  useMetroRiverPlaygroundMode,
  type MetroRiverPlaygroundMode,
} from "../store"

const METRO_RIVER_OPTIONS: Array<{
  mode: MetroRiverPlaygroundMode
  label: string
}> = [
  { mode: "off", label: "Original" },
  { mode: "metro-map", label: "Metro map" },
]

export default function Transparency() {
  return (
    <Box component="section" id="frame-6" aria-label="Why transparency matters">
      <MetroRiverPlaygroundControls />

      <ScrollSection height="250vh" offset={["start start", "end center"]}>
        <StickyElement top="15vh" style={{ height: "35vh" }}>
          <TransparencyModelsPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="155vh">
        <StickyElement top="15vh">
          <TransparencyAssumptionsPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="165vh">
        <StickyElement top="15vh">
          <TransparencyCommunityPanel />
        </StickyElement>
      </ScrollSection>

      <ScrollSection height="170vh">
        <StickyElement top="15vh">
          <TransparencyFuturePanel />
        </StickyElement>
      </ScrollSection>
    </Box>
  )
}

function MetroRiverPlaygroundControls() {
  const activeSection = useActiveSectionStore()
  const mode = useMetroRiverPlaygroundMode()

  if (activeSection !== "Transparency") return null

  return (
    <Box
      sx={{
        position: "fixed",
        right: "1.5rem",
        top: "6rem",
        zIndex: 4,
        width: "min(23rem, calc(100vw - 3rem))",
        padding: 1.25,
        borderRadius: 2,
        pointerEvents: "auto",
        color: "common.white",
        backgroundColor: "rgba(8, 16, 24, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 14px 36px rgba(0, 0, 0, 0.28)",
      }}
    >
      <Box
        sx={{
          fontSize: "0.72rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          opacity: 0.72,
          marginBottom: 0.75,
        }}
      >
        Metro river playground
      </Box>
      <Stack spacing={0.75}>
        {METRO_RIVER_OPTIONS.map((option) => {
          const selected = option.mode === mode

          return (
            <Box
              key={option.mode}
              component="button"
              type="button"
              onClick={() =>
                appActions.setMetroRiverPlaygroundMode(option.mode)
              }
              sx={{
                width: "100%",
                border: "1px solid",
                borderColor: selected
                  ? "rgba(255, 255, 255, 0.72)"
                  : "rgba(255, 255, 255, 0.18)",
                borderRadius: 1,
                padding: "0.55rem 0.7rem",
                cursor: "pointer",
                color: "common.white",
                font: "inherit",
                fontSize: "0.82rem",
                textAlign: "left",
                backgroundColor: selected
                  ? "rgba(80, 177, 231, 0.34)"
                  : "rgba(255, 255, 255, 0.06)",
                transition:
                  "background-color 160ms ease, border-color 160ms ease",
                "&:hover": {
                  backgroundColor: selected
                    ? "rgba(80, 177, 231, 0.42)"
                    : "rgba(255, 255, 255, 0.12)",
                },
              }}
            >
              {option.label}
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}

function PanelContainer({ children }: { children: ReactNode }) {
  return (
    <Box
      className="container"
      sx={{
        maxWidth: "60%",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  )
}

function TransparencyModelsPanel() {
  const progress = useScrollProgress()
  const titleOpacity = useScrollValue(progress, [0.04, 0.12], [0, 1])
  const paragraphOpacity = useScrollValue(progress, [0.08, 0.18], [0, 1])

  return (
    <PanelContainer>
      <motion.div style={{ opacity: titleOpacity }}>
        <Box className="paragraph" component="header" role="banner">
          <SectionTitle text={"Why transparency matters"} />
        </Box>
      </motion.div>

      <motion.div style={{ opacity: paragraphOpacity }}>
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "Today, water managers rely on complex technical models, such as CalSim, to guide allocation decisions.",
              "These tools are powerful, but they are also highly technical and difficult for non-experts to interpret.",
            ]}
          />
        </Box>
      </motion.div>
    </PanelContainer>
  )
}

function TransparencyAssumptionsPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.86]}
        exit={[0.86, 0.98]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "As a result, many communities cannot easily see how decisions are made, what assumptions shape outcomes, or whose priorities are embedded in the models.",
              "For example, a rule that allows more water to be diverted during dry periods may increase supplies for farms and cities, while reducing river flows needed for fish and ecosystems.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}

function TransparencyCommunityPanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.8]}
        exit={[0.8, 0.94]}
        animation="slideUp"
      >
        <Stack spacing={2} direction="column">
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "It also becomes difficult to understand how conditions differ across the system, from upstream sources to downstream communities and ecosystems.",
              ]}
            />
          </Box>
          <Box className="paragraph" component="article">
            <Paragraph
              blocks={[
                "Without transparency, communities are marginalized from planning and negotiation.",
                "Their needs, values, and vulnerabilities remain invisible, even as decisions directly affect their water security.",
              ]}
            />
          </Box>
        </Stack>
      </ScrollElement>
    </PanelContainer>
  )
}

function TransparencyFuturePanel() {
  return (
    <PanelContainer>
      <ScrollElement
        enter={[0.12, 0.28]}
        hold={[0.28, 0.78]}
        exit={[0.78, 0.92]}
        animation="slideUp"
      >
        <Box className="paragraph" component="article">
          <Paragraph
            blocks={[
              "Understanding California's water system, both historically and technically, is essential for building a future that is resilient, fair, and shared.",
            ]}
          />
        </Box>
      </ScrollElement>
    </PanelContainer>
  )
}
