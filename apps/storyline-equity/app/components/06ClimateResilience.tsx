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
            text: "California has taken important steps to address inequities and environmental harms created by past water decisions.",
          },
        ],
        [
          {
            text: "Environmental protections such as the Endangered Species Act and Clean Water Act, recognition of the human right to water, and groundwater regulation under the Sustainable Groundwater Management Act (SGMA) reflect changing priorities in how California manages water.",
          },
        ],
      ],
      [
        [
          {
            text: "Yet inequities remain embedded in the water system. Water rights, contracts, infrastructure, and operating rules continue to protect some water users more than others.",
          },
        ],
        [
          {
            text: "Some communities and sectors are better protected from shortages, while many Tribes, rural and disadvantaged communities, and ecosystems remain particularly vulnerable.",
          },
        ],
        [
          {
            climateStoryLink: "Climate change",
            text: " adds further pressure. As droughts and floods intensify and water availability becomes more variable, meeting all needs becomes increasingly difficult.",
          },
        ],
        [
          {
            text: "These pressures can deepen existing inequities, with those already most vulnerable often bearing the greatest burden.",
          },
        ],
        [
          {
            text: "The central question is not whether trade-offs exist, but why the same groups so often bear the costs.",
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
      height="360vh"
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
        {climateResilienceText.en.sections.map((groups, index) => {
          const start = index / climateResilienceText.en.sections.length
          const end = (index + 1) / climateResilienceText.en.sections.length
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
                  <SectionTitle text={climateResilienceText.en.title} />
                </Box>
              ) : null}
              <Stack component="section" spacing={3.5}>
                {groups.map((sentences, paragraphIndex) => {
                  const [block] = sentences
                  const linkLabel =
                    block && "climateStoryLink" in block
                      ? block.climateStoryLink
                      : undefined

                  return (
                    <Box key={paragraphIndex} component="article">
                      {linkLabel ? (
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
                            <span>{linkLabel}</span>
                            <LibraryBooksIcon
                              sx={{ fontSize: "1.5rem", flexShrink: 0 }}
                            />
                          </a>{" "}
                          {block.text}
                        </Typography>
                      ) : (
                        <Paragraph blocks={sentences} />
                      )}
                    </Box>
                  )
                })}
              </Stack>
            </ScrollElement>
          )
        })}
      </Box>
    </StickyScrollSection>
  )
}
