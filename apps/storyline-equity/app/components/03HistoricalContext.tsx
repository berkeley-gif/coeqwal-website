"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { Paragraph, SectionTitle } from "@repo/ui"
import { Box, Stack } from "@repo/ui/mui"

const historicalContextText = {
  title: { text: "How Indigenous communities relate to water" },
  opening: [
    {
      text: "Across California, Indigenous communities have lived in sync with the seasons, rivers, fish and wildlife for millennia.",
    },
  ],
  tribalRelations: [
    {
      text: "To many California Tribes, salmon are relatives and rivers are sacred places.",
    },
    {
      text: "Through place-based ecological knowledge and practices, Tribes have sustained relationships with rivers and wildlife as kin. Indigenous names for rivers and other places reflect these enduring relationships, carrying histories, knowledge, and responsibilities that today’s commonly used names often obscure.",
    },
  ],
  mcCloud: [
    {
      text: 'For the Winnemem Wintu of the McCloud "Middle Water" River, cold-water springs of Mount Shasta gave birth to humans and the Nur. In the creation story, the Nur (Winter-Run Chinook Salmon) gave their voice to humans. In return, the Winnemem People speak for the salmon.',
    },
    {
      text: "Through fishing practices, traditions, and ceremonies, the Winnemem Wintu honor the Nur as relatives. By protecting their springs and rivers, they protect salmon and their Tribe’s traditional way of life.",
    },
  ],
  closing: [
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
          hold={[0.04, 0.42]}
          exit={[0.42, 0.44]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={historicalContextText.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={historicalContextText.opening} />
            </Box>
            <ScrollElement
              enter={[0.26, 0.3]}
              hold={[0.3, 0.42]}
              exit={[0.42, 0.44]}
              animation="slideUp"
            >
              <Box component="article">
                <Paragraph blocks={historicalContextText.tribalRelations} />
              </Box>
            </ScrollElement>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.44, 0.48]}
          hold={[0.48, 0.68]}
          exit={[0.68, 0.72]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            {historicalContextText.mcCloud.map((sentence) => (
              <Box key={sentence.text} component="article">
                <Paragraph blocks={[sentence]} />
              </Box>
            ))}
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.72, 0.76]}
          hold={[0.76, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={historicalContextText.closing.slice(0, 1)} />
            </Box>
            <Box component="article">
              <Paragraph blocks={[historicalContextText.closing[1]]} />
            </Box>
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
