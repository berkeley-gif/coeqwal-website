"use client"

import { ScrollElement, StickyScrollSection } from "@repo/scrollytelling"
import { getWaterStoryUrl, Paragraph, SectionTitle } from "@repo/ui"
import { Box, LibraryBooksIcon, Stack, Typography } from "@repo/ui/mui"

const climateResilienceText = {
  en: {
    title: { text: "Addressing persistent inequities" },
    sections: [
      [
        [
          {
            text: "Over recent decades, California has taken steps to address some of the inequities and environmental harms embedded in its water system.",
          },
        ],
        [
          {
            segments: [
              { text: "Environmental protections such as the " },
              { text: "Endangered Species Act", mark: "strong" },
              { text: " and " },
              { text: "Clean Water Act", mark: "strong" },
              {
                text: ", recognition of the human right to water, and groundwater regulation under the ",
              },
              {
                text: "Sustainable Groundwater Management Act (SGMA)",
                mark: "strong",
              },
              {
                text: " reflect changing priorities in how California manages water.",
              },
            ],
          },
        ],
      ],
      [
        [
          {
            text: "Yet significant inequities and environmental challenges remain.",
          },
        ],
        [
          {
            climateStoryLink: "Climate change",
            text: " adds further pressure.",
          },
          {
            text: "As droughts and floods intensify and water availability becomes more variable, meeting all needs becomes increasingly difficult.",
          },
        ],
        [
          {
            text: "Some communities and sectors are better protected from shortages, while many Tribes, rural and disadvantaged communities, and ecosystems remain particularly vulnerable.",
          },
        ],
        [
          {
            text: "Facing rising pressures and deepening inequities, water managers seek new strategies.",
          },
        ],
      ],
    ],
  },
} as const

export default function ClimateResilience() {
  return (
    <StickyScrollSection
      id="frame-5"
      ariaLabel="Climate change and resilience"
      height="250vh"
      stickyTop="15vh"
      stickyHeight="70vh"
      offset={["start start", "end center"]}
    >
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
        <ScrollElement
          enter={[0, 0.04]}
          hold={[0.04, 0.46]}
          exit={[0.46, 0.5]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Box component="header">
            <SectionTitle text={climateResilienceText.en.title} />
          </Box>
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={climateResilienceText.en.sections[0][0]} />
            </Box>
            <Box component="article">
              <Paragraph blocks={climateResilienceText.en.sections[0][1]} />
            </Box>
          </Stack>
        </ScrollElement>

        <ScrollElement
          enter={[0.5, 0.54]}
          hold={[0.54, 1]}
          animation="slideUp"
          style={{ gridArea: "1 / 1" }}
        >
          <Stack component="section" spacing={3.5}>
            <Box component="article">
              <Paragraph blocks={climateResilienceText.en.sections[1][0]} />
            </Box>
            <Box component="article">
              <Typography variant="body1">
                <a
                  href={getWaterStoryUrl("climate")}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "inherit",
                    textDecoration: "underline",
                    pointerEvents: "auto",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <span>
                    {
                      climateResilienceText.en.sections[1][1][0]
                        .climateStoryLink
                    }
                  </span>
                  <LibraryBooksIcon
                    sx={{ fontSize: "1.5rem", flexShrink: 0 }}
                  />
                </a>{" "}
                {climateResilienceText.en.sections[1][1][0].text}
              </Typography>
              <Paragraph
                blocks={[climateResilienceText.en.sections[1][1][1]]}
              />
            </Box>
            <Box component="article">
              <Paragraph blocks={climateResilienceText.en.sections[1][2]} />
            </Box>
            <Box component="article">
              <Paragraph blocks={climateResilienceText.en.sections[1][3]} />
            </Box>
          </Stack>
        </ScrollElement>
      </Box>
    </StickyScrollSection>
  )
}
