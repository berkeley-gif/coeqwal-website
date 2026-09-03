"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { motion } from "@repo/motion"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { FloatingBubbles } from "./helpers/FloatingBubbles"
import { useConclusionProgress } from "../store"

const conclusionText = {
  en: {
    title: { text: "Putting equity into practice" },
    sections: [
      [
        [
          {
            text: "Within COEQWAL's broader approach to equity, the shared evaluation framework helps us understand distributional equity: how benefits and burdens are shared across people, places, and ecosystems.",
          },
        ],
        [
          {
            text: "The same water management strategy can produce very different conditions depending on where you are, what you depend on, and the conditions you experience.",
          },
        ],
      ],
      [
        [
          {
            text: "Making these differences visible allows us to ask:",
          },
        ],
        [
          {
            text: "Who benefits?",
          },
          { text: "Who bears the costs?" },
          {
            text: "Where are needs being met, and where are they not?",
          },
          {
            text: "How do those patterns change under different management strategies and climate conditions?",
          },
        ],
        [
          {
            text: "COEQWAL does not determine what California’s water future should be. ",
          },
          {
            text: "It helps make the consequences of different choices visible.",
          },
        ],
        [
          {
            text: "These insights can bring the needs of communities and ecosystems more clearly into water planning and decision-making, and help more people participate in shaping California’s water future.",
          },
        ],
      ],
    ],
  },
} as const

const LOAD_CONCLUSION_VISUAL = true

// Keep the visual timing explicit so the icon-to-photo transition is easy to
// tune independently of the map-circle exit. The second text frame begins at
// 0.50, and the completed photos remain visible for the rest of the section.
const BUBBLES_REVEAL_START = 0.48
const BUBBLES_REVEAL_END = 0.56
const PHOTOS_REVEAL_START = 0.56
const PHOTOS_REVEAL_END = 0.72

export default function Conclusion() {
  return (
    <StickyScrollSection
      id="frame-9"
      ariaLabel="Putting equity into practice"
      height="240vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <ConclusionVisual />
      <Box
        className="container text-section"
        sx={{
          width: "min(75ch, calc(100vw - 6rem), calc(55dvw - 5rem))",
          maxWidth: "calc(55dvw - 5rem)",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        {conclusionText.en.sections.map((groups, index) => {
          const start = index / conclusionText.en.sections.length
          const end = (index + 1) / conclusionText.en.sections.length
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
                  <SectionTitle text={conclusionText.en.title} />
                </Box>
              ) : null}
              <Stack component="section" spacing={3.5}>
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
  )
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function ConclusionVisual() {
  const conclusionProgress = useConclusionProgress()
  const revealOpacity = clamp01(
    (conclusionProgress - BUBBLES_REVEAL_START) /
      (BUBBLES_REVEAL_END - BUBBLES_REVEAL_START),
  )
  const photoRevealProgress = clamp01(
    (conclusionProgress - PHOTOS_REVEAL_START) /
      (PHOTOS_REVEAL_END - PHOTOS_REVEAL_START),
  )

  if (!LOAD_CONCLUSION_VISUAL) return null

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "15dvh",
        right: "-1dvw",
        width: "45dvw",
        height: "85dvh",
        opacity: revealOpacity,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "min(45dvw, 72dvh)", aspectRatio: "1 / 1" }}>
        <FloatingBubbles
          align="center"
          showPhotos
          iconProgress={1 - photoRevealProgress}
          iconColorsBySrc={{
            "/map-icons/urban.svg": themeValues.palette.tiers.tier1,
            "/map-icons/agriculture.svg": themeValues.palette.tiers.tier2,
            "/map-icons/wetland.svg": themeValues.palette.tiers.tier3,
            "/map-icons/salmon.svg": themeValues.palette.tiers.tier4,
          }}
        />
      </Box>
    </motion.div>
  )
}
