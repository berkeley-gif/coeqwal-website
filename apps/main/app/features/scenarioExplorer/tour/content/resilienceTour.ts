/**
 * Resilience tour. Full port of ResilienceHowToRead.tsx callouts plus
 * hero and closing note. Anchor ids map into ResiliencePanel's mode
 * rail, sidebar, matrix rows, and the Leverage entry point.
 */

import type { TourStep } from "../types"

export const RESILIENCE_TOUR: TourStep[] = [
  {
    id: "resilience.hero",
    eyebrow: "THE CLIMATE STRESS TEST",
    title:
      "This is where a shortlist meets climate and starts to reveal its breaking points.",
    body: "Resilience turns the same scenarios you shortlisted in List and shaped in Radar into a matrix of outcomes by hydroclimate. It is less about choosing a winner at a glance and more about seeing where performance bends, where it breaks, and where operations still matter.",
  },
  {
    id: "resilience.step1.sidebar",
    anchorId: "resilience.sidebar",
    eyebrow: "STEP 1 - SCENARIOS MODE",
    title: "Sidebar drives the small multiples",
    body: "Each selected scenario becomes a tile. Deselecting all returns to the Overview aggregate.",
    placement: "right",
  },
  {
    id: "resilience.step1.matrixRow",
    anchorId: "resilience.matrix.row",
    eyebrow: "STEP 1 - SCENARIOS MODE",
    title: "Rows are the aggregate outcomes",
    body: "Read left to right to see how the same outcome responds as climate conditions change.",
    placement: "top",
  },
  {
    id: "resilience.step1.regionalExpand",
    anchorId: "resilience.regionalExpand",
    eyebrow: "STEP 1 - SCENARIOS MODE",
    title: "Regional detail unfolds rows",
    body: "Expand an outcome to add its NOD and SOD rows just below the parent, exactly like axis expand in Radar.",
    placement: "right",
  },
  {
    id: "resilience.step2.primaryOutcome",
    anchorId: "resilience.primaryOutcomePicker",
    eyebrow: "STEP 2 - OUTCOME MODE",
    title: "Primary outcome fixes the matrix",
    body: "Scenarios run down the Y axis, hydroclimates across the X. The rest of the field becomes context for the focus outcome.",
    placement: "bottom",
  },
  {
    id: "resilience.step2.sidebarFilters",
    anchorId: "resilience.sidebar",
    eyebrow: "STEP 2 - OUTCOME MODE",
    title: "Sidebar filters the rows",
    body: "Selecting scenarios in the sidebar restricts the Y axis to those rows. Selecting none returns all 24 scenarios.",
    placement: "right",
  },
  {
    id: "resilience.step2.compare",
    anchorId: "resilience.compare",
    eyebrow: "STEP 2 - OUTCOME MODE",
    title: "Compare adds outcome tiles",
    body: "Use Compare to read several outcomes side by side without losing the scenario ordering.",
    placement: "bottom",
  },
  {
    id: "resilience.step3.moreAnalysis",
    anchorId: "resilience.moreAnalysis",
    eyebrow: "STEP 3 - MORE ANALYSIS",
    title: "Leverage is reached from More analysis",
    body: "Leverage swaps the matrix for a scatter so you can ask what is climate-driven, what operations can move, and where the highest stakes lie.",
    placement: "bottom",
  },
  {
    id: "resilience.step3.leverageX",
    anchorId: "resilience.leverage",
    eyebrow: "STEP 3 - LEVERAGE",
    title: "X axis is climate sensitivity, Y axis is operational leverage",
    body: "Further right means the outcome shifts more as climates warm. Higher means sibling scenarios change the result more under the same climate.",
    placement: "top",
  },
  {
    id: "resilience.step3.topRight",
    anchorId: "resilience.leverage",
    eyebrow: "STEP 3 - LEVERAGE",
    title: "Top-right is where climate and management both matter",
    body: "Those outcomes are often the highest-value targets for deeper investigation.",
    placement: "top",
  },
  {
    id: "resilience.close",
    title: "Hovering still matters",
    body: "Tooltips expose the scenario, outcome, hydroclimate, continuous tier value, and tier label behind each cell. In Distribution, interaction goes further: scenario squares tie back to the shortlist, and location squares can open the mapped outcome layer and pin an LOI.",
  },
]
