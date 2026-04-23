"use client"

import React, { useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { HowToReadBody } from "./Section"
import { StoryHero, AnnotatedStage, JourneyStrip } from "./HowToReadScaffold"
import { InlineToggleChip } from "../InlineToggleChip"
import {
  ListHeroGraphic,
  ListToolbarGraphic,
  OutcomeViewsGraphic,
  ShortlistFocusGraphic,
  SortedOutcomeGraphic,
} from "./ListIllustrations"

export function ListHowToRead() {
  const theme = useTheme()
  const [demoOnlyChosen, setDemoOnlyChosen] = useState(false)

  return (
    <HowToReadBody>
      <StoryHero
        eyebrow="START HERE"
        title="This table is your scenario library."
        deck="Start on the left with the scenarios themselves, then read the outcomes on the right. The List view is where you tune the library, sort by what matters, and gather a shortlist to carry forward."
        points={[
          {
            label: "Tune the library first.",
            description:
              "Search, chips, theme organization, pinning, and sharing help you decide which scenarios deserve attention.",
          },
          {
            label: "Read the outcomes next.",
            description:
              "Info buttons refresh what an outcome means. Sort controls rank the library by average performance.",
          },
          {
            label: "Switch the view when the question changes.",
            description:
              "Average is the fast scan, Bar shows relative tier mix, and Distribution exposes where vulnerability is concentrated.",
          },
        ]}
        visual={<ListHeroGraphic />}
        accentColor={theme.palette.blue.bright}
      />

      <AnnotatedStage
        eyebrow="STEP 1"
        title="Start with the scenario library on the left"
        deck="Use search and the chips to decide which scenarios deserve attention before you study any outcome cells. The same library can be organized by theme, narrowed to selected rows, or expanded to show alternative baselines."
        visual={<ListToolbarGraphic />}
        accentColor={theme.palette.blue.bright}
        minHeight={360}
        calloutLayout="stacked"
        callouts={[
          {
            number: "01",
            title: "Search and chips tune the library",
            body: "Search, definitions, baselines, key operations, selected only, and group by theme all change what you see first.",
            top: 2,
            left: 1,
            maxWidth: "240px",
          },
          {
            number: "02",
            title: "Theme organization helps you scan families",
            body: "Grouping by theme keeps similar interventions together so you can compare like with like before sorting.",
            top: 2,
            right: 3,
            maxWidth: "236px",
          },
          {
            number: "03",
            title: "Pin and share are collection tools",
            body: "Pinning floats a scenario to the top of the library. Sharing stages the current scenario card into the Share drawer and Share tab.",
            bottom: 1,
            right: 2,
            maxWidth: "248px",
          },
        ]}
      />

      <AnnotatedStage
        eyebrow="STEP 2"
        title="Now look at the outcomes"
        deck="The outcome columns are the questions each scenario is answering. These outcomes were introduced earlier in the site, so the info button is your quick refresher. When you want to rank the library, use the sort control to order scenarios by average outcome."
        visual={<SortedOutcomeGraphic />}
        accentColor={theme.palette.blue.bright}
        minHeight={360}
        calloutLayout="stacked"
        callouts={[
          {
            number: "01",
            title: "Outcome summary",
            body: "Click the i when you need a reminder of what the outcome measures and why it matters.",
            top: 2,
            left: 1,
            maxWidth: "232px",
          },
          {
            number: "02",
            title: "Sorting ranks rows by average",
            body: "Use the sort button to rank scenarios by average outcome, then reverse the order to inspect the other end of the library.",
            top: 4,
            right: 1,
            maxWidth: "236px",
          },
          {
            number: "03",
            title: "Read down the column to compare",
            body: "Leaders, laggards, and trade-offs appear faster when you compare one question down the column instead of many across the row.",
            bottom: 2,
            right: 3,
            maxWidth: "242px",
          },
        ]}
      />

      <AnnotatedStage
        eyebrow="STEP 3"
        title="Use both sides together to gather a shortlist"
        deck="Tune the library on the left, then keep the scenarios that survive the outcome test on the right. Select rows as you go, turn on selected only when the set is small enough, and bring back alternative baselines when the reference case matters."
        visual={<ShortlistFocusGraphic showOnlyChosen={demoOnlyChosen} />}
        accentColor={theme.palette.blue.bright}
        minHeight={340}
        calloutLayout="stacked"
        callouts={[
          {
            number: "01",
            title: "Select the scenarios that you want to keep",
            body: "Use the row check controls to gather a working set without losing the rest of the library.",
            top: 8,
            left: 3,
            maxWidth: "228px",
          },
          {
            number: "02",
            title: "Selected only turns a long list into a working table",
            body: "Once the strongest candidates are checked, hide the rest so the shortlist becomes easier to compare.",
            top: 6,
            right: 2,
            maxWidth: "234px",
          },
          {
            number: "03",
            title: "Baselines stay nearby when better than what matters",
            body: "Reveal alternative baselines when your shortlist looks strong only relative to one reference case.",
            bottom: 3,
            right: 4,
            maxWidth: "230px",
          },
        ]}
      />

      <AnnotatedStage
        eyebrow="STEP 4"
        title="Switch the outcome view to match the question"
        deck="The new control beside How to read changes the way each outcome cell speaks. Average is the first scan and the sort anchor. Bar shows the relative distribution across tiers. Distribution shows location-by-location spread so you can see which places are vulnerable and how that pattern changes by climate."
        visual={<OutcomeViewsGraphic />}
        accentColor={theme.palette.blue.bright}
        minHeight={360}
        calloutLayout="stacked"
        callouts={[
          {
            number: "01",
            title: "Average is for quick scans and first sorting passes",
            body: "Use it when you need a clean read across many rows and want the sort order to stay legible.",
            top: 6,
            left: 3,
            maxWidth: "232px",
          },
          {
            number: "02",
            title: "Bar shows the relative tier mix",
            body: "Use it when you want to see whether an outcome is concentrated in stronger or weaker tiers without opening the full distribution.",
            top: 6,
            right: 3,
            maxWidth: "236px",
          },
          {
            number: "03",
            title: "Distribution works with map, locations, climate, and change",
            body: "Use it when you need to inspect which locations are driving the result, compare climates, or connect the cell back to spatial detail.",
            bottom: 2,
            right: 4,
            maxWidth: "244px",
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
          In the live tool, turn on
        </Typography>
        <InlineToggleChip
          label="show only chosen"
          active={demoOnlyChosen}
          onClick={() => setDemoOnlyChosen((v) => !v)}
        />
        <Typography variant="storyBody" component="span">
          once you have selected a few scenarios and want to focus only on the shortlist you are carrying forward.
        </Typography>
      </Box>

      <JourneyStrip
        eyebrow="TAKE YOUR SHORTLIST FORWARD"
        title="What to do after the List view"
        steps={[
          {
            number: "01",
            label: "List",
            description: "Use the master table to narrow the field and choose a shortlist.",
            state: "current",
          },
          {
            number: "02",
            label: "Radar",
            description: "Compare the shortlisted scenarios across every chosen outcome at once instead of isolated cells.",
            state: "next",
          },
          {
            number: "03",
            label: "Distribution",
            description: "Coming soon: inspect the spread across locations more directly.",
            state: "comingSoon",
          },
          {
            number: "04",
            label: "Resilience",
            description: "Test the same scenarios across climate futures and operational leverage.",
            state: "next",
          },
        ]}
      />
    </HowToReadBody>
  )
}

export default ListHowToRead
