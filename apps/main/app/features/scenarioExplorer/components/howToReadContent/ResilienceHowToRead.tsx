"use client"

/**
 * How-to-read body for the resilience heatmap tool. Reframed around
 * the three primary Z-role picks in the sentence header ("scenarios
 * as small multiples", "outcomes as small multiples", "averaged
 * across the library"), with Leverage teed up at the end as a
 * secondary analysis surface reached from More analysis.
 */

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HowToReadBody } from "./Section"
import { StoryHero, AnnotatedStage } from "./HowToReadScaffold"
import { InlineToggleChip } from "../InlineToggleChip"
import {
  EncodingModesGraphic,
  QuadrantStageGraphic,
  ResilienceHeroGraphic,
} from "./ResilienceIllustrations"

export function ResilienceHowToRead() {
  const theme = useTheme()
  const [demoShowAll, setDemoShowAll] = useState(false)

  return (
    <HowToReadBody>
      <StoryHero
        eyebrow="Reslilience heatmap"
        title="Revealing climate stress"
        deck="Resilience turns the same scenarios you shortlisted in List and shaped in Radar into a matrix of outcomes by hydroclimate. It is less about choosing a winner at a glance and more about seeing where performance bends, where it breaks, and where operations still matter."
        points={[
          {
            label: "Scenarios is sidebar-driven, like Radar.",
            description:
              "Select scenarios in the sidebar and they appear as small multiples. Select none and the chart shows the Overview aggregate across the full field instead of an empty panel.",
          },
          {
            label: "Outcome mirrors that rule on the Y axis.",
            description:
              "Pick a primary outcome and the matrix becomes scenarios down the Y axis. Sidebar selection filters which scenarios show as rows; with nothing selected, all scenarios appear.",
          },
          {
            label: "Regional detail is one click away.",
            description:
              "Any outcome with North-of-Delta and South-of-Delta variants can be unfolded row-by-row, just like axis expand in Radar. Hydroclimate columns sit above the matrix so you can read the climate shift without leaving the chart.",
          },
        ]}
        visual={<ResilienceHeroGraphic showAllScenarios={demoShowAll} />}
        accentColor={theme.palette.blue.bright}
      />

      <AnnotatedStage
        eyebrow="STEP 1"
        title="Scenarios as small multiples: selection in, tiles out."
        deck="Pin scenarios in the sidebar and picking scenario as the third dimension renders one tile per selection, each with the nine aggregate outcomes down the Y axis and three hydroclimate columns across the X. With nothing selected, the chart falls through to the library aggregate across all 24 scenarios. When the mean for an outcome hides important North/South differences, unfold its row from Regional detail."
        visual={<ResilienceHeroGraphic showAllScenarios={demoShowAll} />}
        accentColor={theme.palette.blue.bright}
        minHeight={420}
        callouts={[
          {
            number: "01",
            title: "Sidebar drives the small multiples",
            body: "Each selected scenario becomes a tile. Deselecting all returns to the Overview aggregate.",
            top: 6,
            left: 2,
            maxWidth: "230px",
          },
          {
            number: "02",
            title: "Rows are the aggregate outcomes",
            body: "Read left to right to see how the same outcome responds as climate conditions change.",
            top: 10,
            right: 3,
            maxWidth: "220px",
          },
          {
            number: "03",
            title: "Regional detail unfolds rows",
            body: "Expand an outcome to add its NOD and SOD rows just below the parent, exactly like axis expand in Radar.",
            top: 19,
            right: 3,
            maxWidth: "230px",
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
          In the illustration, toggle
        </Typography>
        <InlineToggleChip
          label="populate tiles"
          active={demoShowAll}
          onClick={() => setDemoShowAll((value) => !value)}
        />
        <Typography variant="storyBody" component="span">
          to preview what additional sidebar selections look like.
        </Typography>
      </Box>

      <AnnotatedStage
        eyebrow="STEP 2"
        title="Outcomes as small multiples: pick one, let the sidebar choose the rows."
        deck="Pick outcome as the third dimension and the matrix becomes scenarios down the Y axis, one tile per outcome. Sidebar selection filters which scenarios appear as rows; with nothing selected, all 24 scenarios show. Compare adds more outcome tiles so you can track one climate question across the field."
        visual={<EncodingModesGraphic />}
        accentColor={theme.palette.blue.bright}
        minHeight={380}
        callouts={[
          {
            number: "01",
            title: "Primary outcome fixes the matrix",
            body: "Scenarios run down the Y axis, hydroclimates across the X. The rest of the field becomes context for the focus outcome.",
            top: 10,
            left: 2,
            maxWidth: "220px",
          },
          {
            number: "02",
            title: "Sidebar filters the rows",
            body: "Selecting scenarios in the sidebar restricts the Y axis to those rows. Selecting none returns all 24 scenarios.",
            top: 10,
            left: 32,
            maxWidth: "220px",
          },
          {
            number: "03",
            title: "Compare adds outcome tiles",
            body: "Use Compare to read several outcomes side by side without losing the scenario ordering.",
            top: 10,
            right: 2,
            maxWidth: "230px",
          },
        ]}
      />

      <AnnotatedStage
        eyebrow="STEP 3"
        title="More analysis: Leverage turns outcomes into points."
        deck="Leverage is reached from More analysis in the mode rail. It swaps the matrix for a scatter so you can ask what is climate-driven, what operations can move, and where the highest stakes lie."
        visual={<QuadrantStageGraphic />}
        accentColor={theme.palette.blue.bright}
        minHeight={360}
        callouts={[
          {
            number: "01",
            title: "X axis = climate sensitivity",
            body: "Further right means the outcome shifts more as climates warm.",
            top: 9,
            right: 4,
            maxWidth: "200px",
          },
          {
            number: "02",
            title: "Y axis = operational leverage",
            body: "Higher means sibling scenarios change the result more under the same climate.",
            bottom: 6,
            left: 3,
            maxWidth: "210px",
          },
          {
            number: "03",
            title: "Top-right is where climate and management both matter",
            body: "Those outcomes are often the highest-value targets for deeper investigation.",
            bottom: 7,
            right: 3,
            maxWidth: "220px",
          },
        ]}
      />

      <Box
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: theme.space.section.sm,
        }}
      >
        <Typography variant="storyBody" component="p" sx={{ m: 0 }}>
          Hovering still matters. Tooltips expose the scenario, outcome,
          hydroclimate, continuous tier value, and tier label behind each cell.
          In Distribution, interaction goes further: scenario squares tie back
          to the shortlist, and location squares can open the mapped outcome
          layer and pin an LOI.
        </Typography>
      </Box>
    </HowToReadBody>
  )
}

export default ResilienceHowToRead
