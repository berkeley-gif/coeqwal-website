"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const historicalContextText = {
  title: { text: "How Indigenous communities relate to water" },
  opening: [
    {
      text: "For thousands of years, California’s Indigenous communities have lived in sync with the seasons, rivers, and wildlife.",
    },
    {
      text: "To many California Tribes, salmon are relatives and rivers are sacred sites.",
    },
  ],
  mcCloud: [
    {
      text: 'For the Winnemem Wintu of the McCloud "Middle Water" River, cold-water springs of Mount Shasta gave birth to humans and the Nur.',
    },
    {
      text: "In the creation story, these Winter-Run Chinook Salmon gave their voice to humans.",
    },
    {
      text: "In return, the Winnemem People feel an obligation to speak for the salmon.",
    },
    {
      text: "Through fishing practices, traditions, and ceremonies, the Winnemem Wintu honor the Nur as relatives.",
    },
    {
      text: "By protecting their springs and rivers, they protect salmon and their Tribe’s traditional way of life.",
    },
  ],
  closing: [
    {
      text: "Across California, Tribes have managed their waters collectively according to traditional ecological knowledge.",
    },
    {
      text: "These locally-adapted practices sustained their people for millennia.",
    },
    {
      text: "With the arrival of European settlers, forced removal of Indigenous communities from their homelands severed their sacred relationship with water as a source of life.",
    },
    {
      text: "In many ways, inequities take root in the state's history.",
    },
  ],
} as const

export default function HistoricalContext() {
  return (
    <StickyScrollSection
      id="frame-2"
      ariaLabel="Historical context for water equity"
      height="650vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
      <Box
        className="container text-section"
        sx={{
          width: "75ch",
          minHeight: "70vh",
          display: "grid",
          alignItems: "center",
        }}
      >
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 0.18]}
          exit={[0.18, 0.22]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={historicalContextText.title} />
          </Box>
          <Stack component="section" spacing={1.25}>
            <Paragraph blocks={historicalContextText.opening} />
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.22, 0.26]}
          hold={[0.26, 0.68]}
          exit={[0.68, 0.72]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={1.25}>
            {historicalContextText.mcCloud.slice(1).map((sentence, index) => {
              const start = 0.3 + index * 0.07

              return (
                <ScrollElement
                  key={sentence.text}
                  enter={[start, start + 0.035]}
                  hold={[start + 0.035, 0.68]}
                  exit={[0.68, 0.72]}
                >
                  <Paragraph blocks={[sentence]} />
                </ScrollElement>
              )
            })}
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.72, 0.76]}
          hold={[0.76, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Stack spacing={1.25}>
              <Paragraph blocks={historicalContextText.closing.slice(0, 3)} />
            </Stack>
            <Paragraph blocks={[historicalContextText.closing[3]]} />
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
