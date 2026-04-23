"use client"

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HowToReadBody } from "./Section"
import { StoryHero, AnnotatedStage, JourneyStrip } from "./HowToReadScaffold"
import { InlineToggleChip } from "../InlineToggleChip"
import {
  RadarAxisSliceGraphic,
  RadarHeroGraphic,
} from "./RadarIllustrations"

export function RadarHowToRead() {
  const theme = useTheme()
  const [demoShowLibrary, setDemoShowLibrary] = useState(true)

  return (
    <HowToReadBody>
      <StoryHero
        eyebrow="THE RADAR VIEW"
        title="Read a shortlist as shapes, not isolated cells."
        deck="Radar is where the shortlist stops behaving like a spreadsheet. Each selected scenario becomes a polygon across the outcomes you chose, so trade-offs appear as shape, balance, and deformation instead of as row-by-row arithmetic."
        points={[
          {
            label: "Closer to the center is better.",
            description: "The rings still use the same tier logic as the list: tier 1 near the center, tier 4 farther out.",
          },
          {
            label: "The shape tells you where a scenario wins and gives up ground.",
            description: "A broad, even polygon reads as balanced; spikes and pinches reveal trade-offs.",
          },
          {
            label: "Context matters as much as geometry.",
            description: "Use the library envelope and climate chips to see whether a shape is merely tidy or actually distinctive.",
          },
        ]}
        visual={<RadarHeroGraphic showLibraryRange={demoShowLibrary} />}
        accentColor={theme.palette.nature.forest}
      />

      <AnnotatedStage
        eyebrow="STEP 1"
        title="The polygon tells the trade-off story. The envelope tells you whether it is unusual."
        deck="A single shape can look persuasive until you learn what the rest of the library does on the same axes. Turn on the library range when you need context, then ask whether your shortlist sits comfortably inside it or breaks through it."
        visual={<RadarHeroGraphic showLibraryRange={demoShowLibrary} />}
        accentColor={theme.palette.nature.forest}
        minHeight={420}
        callouts={[
          {
            number: "01",
            title: "Each polygon is one selected scenario",
            body: "Carry your shortlist over from the list view so the shapes you see here belong to rows you already trust.",
            top: 17,
            left: 4,
            maxWidth: "220px",
          },
          {
            number: "02",
            title: "Tier rings keep the read grounded",
            body: "A shape that stays inside the inner rings is performing well across more outcomes.",
            top: 6,
            left: 24,
            maxWidth: "210px",
          },
          {
            number: "03",
            title: "The library range is your context band",
            body: "If a polygon pushes outside the envelope on an axis, it is doing something the broader library rarely does.",
            top: 10,
            right: 2,
            maxWidth: "230px",
          },
          {
            number: "04",
            title: "Hydroclimate changes the shape",
            body: "Switch climates and watch each polygon contract or stretch. That is climate exposure made legible.",
            bottom: 3,
            right: 3,
            maxWidth: "220px",
          },
        ]}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mt: -1,
        }}
      >
        <Typography variant="storyBody" component="span">
          In the live chart, toggle
        </Typography>
        <InlineToggleChip
          label="show library range"
          active={demoShowLibrary}
          onClick={() => setDemoShowLibrary((value) => !value)}
        />
        <Typography variant="storyBody" component="span">
          to add or remove the context band in the figure above.
        </Typography>
      </Box>

      <AnnotatedStage
        eyebrow="STEP 2"
        title="Axes and climate chips turn the radar from a picture into a comparison tool."
        deck="The labels around the chart are not passive. They are handles into more detail: choose which outcomes become axes, open the per-axis scenario slice, and switch hydroclimates to see whether each scenario keeps its shape."
        visual={<RadarAxisSliceGraphic />}
        accentColor={theme.palette.nature.forest}
        minHeight={380}
        callouts={[
          {
            number: "01",
            title: "Choose outcome axes before you compare",
            body: "Three to eight axes keeps the chart readable and tuned to the question in front of you.",
            top: 6,
            left: 2,
            maxWidth: "220px",
          },
          {
            number: "02",
            title: "Axis labels open a scenario slice",
            body: "Click an axis to rank the selected scenarios along that one outcome and understand what the polygon is summarizing.",
            bottom: 4,
            left: 18,
            maxWidth: "220px",
          },
          {
            number: "03",
            title: "The info icon opens the definition",
            body: "Use it when an outcome name is familiar enough to recognize but too compressed to interpret with confidence.",
            bottom: 5,
            right: 3,
            maxWidth: "210px",
          },
          {
            number: "04",
            title: "Climate chips let you compare the same shape across futures",
            body: "Historical, cc50, and cc95 are not separate charts. They are separate conditions for the same shortlist.",
            top: 5,
            right: 3,
            maxWidth: "230px",
          },
        ]}
      />

      <JourneyStrip
        eyebrow="NEXT STEP"
        title="What the radar cannot tell you on its own"
        steps={[
          {
            number: "02",
            label: "Radar",
            description: "See balance across outcomes and trade-offs at a glance.",
            state: "current",
          },
          {
            number: "03",
            label: "Distribution",
            description: "Coming soon: inspect the spread across locations hidden inside each vertex mean.",
            state: "comingSoon",
          },
          {
            number: "04",
            label: "Resilience",
            description: "Take the same shortlist into a climate-by-outcome matrix and test what holds.",
            state: "next",
          },
        ]}
      />
    </HowToReadBody>
  )
}

export default RadarHowToRead
