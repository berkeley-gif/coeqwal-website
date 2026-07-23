"use client"

import { Box, Stack } from "@repo/ui/mui"
import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import {
  appActions,
  useActiveSectionStore,
  useMetroRiverPlaygroundMode,
  type MetroRiverPlaygroundMode,
} from "../store"

const transparencyText = {
  en: {
    title: { text: "Why transparency matters" },
    sections: [
      [
        [
          {
            text: "Today, water managers rely on complex technical models, such as CalSim, to guide allocation decisions.",
          },
          {
            text: "These tools are powerful, but they are also highly technical and difficult for non-experts to interpret.",
          },
        ],
      ],
      [
        [
          {
            text: "As a result, many communities cannot easily see how decisions are made, what assumptions shape outcomes, or whose priorities are embedded in the models.",
          },
          {
            text: "For example, a rule that allows more water to be diverted during dry periods may increase supplies for farms and cities, while reducing river flows needed for fish and ecosystems.",
          },
        ],
      ],
      [
        [
          {
            text: "It also becomes difficult to understand how conditions differ across the system, from upstream sources to downstream communities and ecosystems.",
          },
        ],
        [
          {
            text: "Without transparency, communities are marginalized from planning and negotiation.",
          },
          {
            text: "Their needs, values, and vulnerabilities remain invisible, even as decisions directly affect their water security.",
          },
        ],
      ],
      [
        [
          {
            text: "Understanding California's water system, both historically and technically, is essential for building a future that is resilient, fair, and shared.",
          },
        ],
      ],
    ],
  },
} as const

const metroRiverOptions: Array<{
  mode: MetroRiverPlaygroundMode
  label: string
}> = [
  { mode: "off", label: "Original" },
  { mode: "metro-map", label: "Metro map" },
]

export default function Transparency() {
  return (
    <>
      <MetroRiverPlaygroundControls />
      <StickyScrollSection
        id="frame-6"
        ariaLabel="Why transparency matters"
        height="680vh"
        stickyTop="15vh"
        stickyHeight="70vh"
        offset={["start start", "end center"]}
      >
        <Box
          className="container text-section"
          sx={{
            width: "min(75ch, calc(100vw - 6rem))",
            maxWidth: "75ch",
            minHeight: "70vh",
            display: "grid",
            alignItems: "center",
          }}
        >
          {transparencyText.en.sections.map((groups, index) => {
            const start = index / transparencyText.en.sections.length
            const end = (index + 1) / transparencyText.en.sections.length
            return (
              <ScrollElement
                key={index}
                enter={[start, start + 0.04]}
                hold={[start + 0.04, end - 0.04]}
                exit={[end - 0.04, end]}
                animation="slideUp"
                style={{ gridArea: "1 / 1" }}
              >
                {index === 0 ? (
                  <Box component="header">
                    <SectionTitle text={transparencyText.en.title} />
                  </Box>
                ) : null}
                <Stack component="section" spacing={2}>
                  {groups.map((sentences, paragraphIndex) => (
                    <Box key={paragraphIndex} component="article">
                      <Paragraph blocks={sentences} />
                    </Box>
                  ))}
                </Stack>
              </ScrollElement>
            )
          })}
        </Box>
      </StickyScrollSection>
    </>
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
        {metroRiverOptions.map((option) => {
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
