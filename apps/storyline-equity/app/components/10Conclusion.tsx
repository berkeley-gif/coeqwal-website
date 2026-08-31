"use client"

import {
  ScrollElement,
  StickyScrollSection,
  useScrollProgress,
} from "@repo/scrollytelling"
import { motion, useTransform } from "@repo/motion"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { FloatingBubbles } from "./01Opener"

const conclusionText = {
  en: {
    title: { text: "Putting equity into practice" },
    sections: [
      [
        [
          {
            text: "Within COEQWAL's broader approach to equity, the shared evaluation framework helps us understand distributional equity: how benefits and impacts are shared across people, places, and ecosystems.",
          },
          {
            text: "The same water management strategy can produce very different conditions depending on where you are and what you depend on. This distributional lens complements other dimensions of equity by making those differences visible.",
          },
        ],
      ],
      [
        [
          {
            text: "By making trade-offs and their impacts visible and comparable, COEQWAL gives communities, Tribes, and decision-makers a clearer understanding of who benefits, who faces greater risk, and what alternatives exist.",
          },
          {
            text: "These insights can help bring the needs of communities and ecosystems more clearly into water planning and decision-making.",
          },
        ],
      ],
    ],
  },
} as const

export default function Conclusion() {
  return (
    <StickyScrollSection
      id="frame-9"
      ariaLabel="Putting equity into practice"
      height="340vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <ConclusionVisual />
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

function ConclusionVisual() {
  const progress = useScrollProgress()
  const openerVisualOpacity = useTransform(progress, [0.64, 0.76], [0, 1])
  const openerVisualScale = useTransform(progress, [0.64, 0.78], [0.82, 1])

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "50%",
        right: "-1dvw",
        width: "30dvw",
        maxWidth: "52rem",
        aspectRatio: "1 / 1",
        y: "-50%",
        opacity: openerVisualOpacity,
        scale: openerVisualScale,
        transformOrigin: "50% 50%",
        pointerEvents: "none",
      }}
    >
      <FloatingBubbles
        iconColorsBySrc={{
          "/map-icons/urban.svg": themeValues.palette.tiers.tier1,
          "/map-icons/agriculture.svg": themeValues.palette.tiers.tier2,
          "/map-icons/wetland.svg": themeValues.palette.tiers.tier3,
          "/map-icons/salmon.svg": themeValues.palette.tiers.tier4,
        }}
      />
    </motion.div>
  )
}
