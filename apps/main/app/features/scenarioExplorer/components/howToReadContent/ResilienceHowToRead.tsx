"use client"

/**
 * How-to-read body for the resilience heatmap tool. Covers the three
 * heatmap views, cell encodings, picking what to show, the quadrant
 * view, and tooltips. Each section is paired with a small SVG
 * illustration keyed to the real chart's theme palettes.
 */

import React, { useState } from "react"
import { Box, Typography } from "@repo/ui/mui"
import { Section } from "./Section"
import { InlineToggleChip } from "../InlineToggleChip"
import {
  TierLegend,
  SummaryCellExample,
  DeltaCellExample,
  DensityCellExample,
  DistributionCellExample,
  DistributionCellLocationExample,
  QuadrantDiagram,
} from "./HeatmapIllustrations"

export function ResilienceHowToRead() {
  // Local mirror of the "show all scenarios" toggle, purely for the
  // demo chip embedded inline in the copy below. The real control is
  // in the chart's toolbar; we render this so readers can see what the
  // chip looks like without hunting for it.
  const [demoShowAll, setDemoShowAll] = useState(false)

  return (
    <>
      <Section title="What am I looking at?">
        <Typography variant="storyBody" component="p">
          A grid of outcomes by hydroclimates. Each cell summarizes how a
          scenario performs on one outcome under one climate. The resilience
          tool offers three views of the same data:
        </Typography>
        <ul>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>By scenario</strong> - one small-multiple tile per
              scenario, with outcomes on the Y axis and climates on the X
              axis.
            </Typography>
          </li>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>By outcome</strong> - one tile per outcome, with
              scenarios on the Y axis and climates on the X axis.
            </Typography>
          </li>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>Aggregate</strong> - a single consolidated grid that
              averages across the selected scenarios.
            </Typography>
          </li>
        </ul>
      </Section>

      <Section title="How a cell is colored and numbered">
        <Typography variant="storyBody" component="p">
          Colors map to the four categorical performance tiers from the
          COEQWAL scale - the same palette used in the list and radar views.
        </Typography>
        <TierLegend />
        <Typography variant="storyBody" component="p">
          The number inside each cell is the arithmetic mean tier across every
          location of interest (LOI) in that outcome, with each LOI weighted
          equally.
        </Typography>
        <SummaryCellExample />
        <Typography variant="storyBody" component="p">
          The number is only shown in summary mode. In the other encoding
          modes it is replaced by the encoding&rsquo;s own visual - see
          below.
        </Typography>
      </Section>

      <Section title="Encoding modes">
        <Typography variant="storyBody" component="p">
          Open the <strong>Cell:</strong> dropdown in the chart controls to
          switch how each cell is drawn. The <strong>Summary</strong> (mean
          tier) and <strong>Distribution</strong> encodings are available in
          all three views. The richer aggregate-only encodings below
          (<strong>Climate shift</strong>, <strong>Risk / opportunity
          density</strong>) only appear in the <strong>Aggregate</strong>{" "}
          view.
        </Typography>
        <Typography variant="storyBody" component="p">
          <strong>Climate shift (delta vs historical / vs baseline)</strong>{" "}
          - signed deviation from a reference, shown on a diverging palette.
          Warm colors mean worse-than-reference, cool colors mean better.
          This one lives next to the cell encoding as the{" "}
          <strong>Climate shift:</strong> dropdown.
        </Typography>
        <DeltaCellExample />
        <Typography variant="storyBody" component="p">
          <strong>Risk density / opportunity density</strong> - share of LOIs
          in the bottom tiers (risk, red) or in the top tiers (opportunity,
          green). Useful for spotting outcomes where the average hides a lot
          of stressed locations.
        </Typography>
        <DensityCellExample />
        <Typography variant="storyBody" component="p">
          <strong>Distribution</strong> - each cell becomes a small grid of
          rounded squares. Same visual language as the key-outcomes glyph in
          the get-started section. Reach for this when the mean hides bimodal
          behavior or when you want to identify the specific scenario or
          location driving a cell&rsquo;s color. When distribution is active,
          a <strong>Distribution:</strong> sub-toggle appears with two modes:
        </Typography>
        <ul>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>By scenario</strong> - one square per scenario in the
              current scope, colored by that scenario&rsquo;s tier for the
              cell&rsquo;s (outcome, climate). Hovering a square highlights
              that scenario in the sidebar and scrolls it into view - the
              same pattern as the radar chart. Clicking a square opens that
              outcome&rsquo;s layer on the map for the clicked scenario.
            </Typography>
          </li>
        </ul>
        <DistributionCellExample />
        <ul>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>By location</strong> - one square per LOI (location of
              interest) inside the outcome, colored by the mean tier across
              the scope&rsquo;s scenarios for that (outcome, climate).
              Hovering a square highlights that LOI on the map when the map
              panel is open, exactly like the get-started key-outcomes
              animation. Clicking a square opens that outcome&rsquo;s layer
              on the map and pins the LOI&rsquo;s popup so it persists after
              the cursor moves away (click again to unpin). NOD/SOD
              outcomes (which are already pre-aggregated regions) are not
              broken out by LOI in this mode.
            </Typography>
          </li>
        </ul>
        <DistributionCellLocationExample />
      </Section>

      <Section title="Picking what to show">
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
            mb: 1,
          }}
        >
          <Typography variant="storyBody" component="span">
            The scenario sidebar drives which tiles appear. With nothing
            selected, toggle
          </Typography>
          <InlineToggleChip
            label="show all scenarios"
            active={demoShowAll}
            onClick={() => setDemoShowAll((v) => !v)}
          />
          <Typography variant="storyBody" component="span">
            in the chart controls above to populate the grid.
          </Typography>
        </Box>
        <ul>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>Choose outcome rows</strong> adds or removes outcome
              rows, including their regional NOD/SOD variants where
              applicable.
            </Typography>
          </li>
          <li>
            <Typography variant="storyBody" component="span">
              The hydroclimate chip in the toolbar filters columns
              (historical, cc50, cc95, or all three).
            </Typography>
          </li>
        </ul>
      </Section>

      <Section title="The quadrant view">
        <Typography variant="storyBody" component="p">
          The fourth toggle swaps the heatmap for a scatter. One dot per
          outcome (or per outcome + LOI, depending on the scope toggle).
        </Typography>
        <QuadrantDiagram />
        <ul>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>X axis - climate sensitivity.</strong> How much the
              tier shifts between historical and warmer climates. Points to
              the right are more climate-exposed.
            </Typography>
          </li>
          <li>
            <Typography variant="storyBody" component="span">
              <strong>Y axis - operational leverage.</strong> How much the
              tier varies across sibling scenarios under the same climate.
              Points higher up respond more to management choices.
            </Typography>
          </li>
        </ul>
      </Section>

      <Section title="Tooltips">
        <Typography variant="storyBody" component="p">
          Hover a cell for scenario, outcome, hydroclimate, continuous tier
          value, and categorical tier label. Hover a row or column header for
          its short definition.
        </Typography>
      </Section>
    </>
  )
}

export default ResilienceHowToRead
