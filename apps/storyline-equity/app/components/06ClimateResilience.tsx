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
            text: "Environmental protections such as the Endangered Species Act and Clean Water Act, recognition of the human right to water, and groundwater regulation under the Sustainable Groundwater Management Act (SGMA) reflect changing priorities in how California manages water.",
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
            text: " adds further pressure. As droughts and floods intensify and water availability becomes more variable, meeting all needs becomes increasingly difficult.",
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
