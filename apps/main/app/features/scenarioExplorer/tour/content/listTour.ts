/**
 * List tour. Full port of ListHowToRead.tsx callouts, each becoming an
 * ordered, anchored step. Hero and journey-strip bookends render as
 * centered cards (no `anchorId`). Copy is lifted verbatim so the tour
 * reads the same as the modal.
 */

import type { TourStep } from "../types"

export const LIST_TOUR: TourStep[] = [
  {
    id: "list.hero",
    eyebrow: "START HERE",
    title: "This table is your scenario library.",
    body: "Start on the left with the scenarios themselves, then read the outcomes on the right. The List view is where you tune the library, sort by what matters, and gather a shortlist to carry into Radar and Resilience.",
  },
  {
    id: "list.step1.search",
    anchorId: "list.toolbar.search",
    eyebrow: "STEP 1 - TUNE THE LIBRARY",
    title: "Search and chips tune the library",
    body: "Search, definitions, baselines, key operations, selected only, and group by theme all change what you see first.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.themeGroup",
    anchorId: "list.toolbar.themeGroup",
    eyebrow: "STEP 1 - TUNE THE LIBRARY",
    title: "Theme organization helps you scan families",
    body: "Grouping by theme keeps similar interventions together so you can compare like with like before sorting.",
    placement: "bottom",
  },
  {
    id: "list.step1.pinShare",
    anchorId: "list.toolbar.pinShare",
    eyebrow: "STEP 1 - TUNE THE LIBRARY",
    title: "Pin and share are collection tools",
    body: "Pinning floats a scenario to the top of the library. Sharing stages the current scenario card into the Share drawer and Share tab.",
    placement: "right-start",
  },
  {
    id: "list.step2.info",
    anchorId: "list.outcome.infoButton",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Info brings back the outcome summary",
    body: "Click the i when you need a reminder of what the outcome measures and why it matters.",
    placement: "bottom",
  },
  {
    id: "list.step2.sort",
    anchorId: "list.outcome.sortButton",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Sort ranks rows by average",
    body: "Use the sort button to rank scenarios by average outcome, then reverse the order to inspect the other end of the library.",
    placement: "bottom",
  },
  {
    id: "list.step2.column",
    anchorId: "list.outcome.column",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Read down one column for the answer",
    body: "Leaders, laggards, and trade-offs appear faster when you compare one question down the column instead of many across the row.",
    placement: "left",
  },
  {
    id: "list.step3.row",
    anchorId: "list.select.row",
    eyebrow: "STEP 3 - GATHER A SHORTLIST",
    title: "Select the scenarios you want to keep",
    body: "Use the row check controls to gather a working set without losing the rest of the library.",
    placement: "right",
  },
  {
    id: "list.step3.showOnlyChosen",
    anchorId: "list.select.showOnlyChosen",
    eyebrow: "STEP 3 - GATHER A SHORTLIST",
    title: "Selected only turns a long list into a working table",
    body: "Once the strongest candidates are checked, hide the rest so the shortlist becomes easier to compare.",
    placement: "bottom",
  },
  {
    id: "list.step3.showBaselines",
    anchorId: "list.select.showBaselines",
    eyebrow: "STEP 3 - GATHER A SHORTLIST",
    title: "Baselines stay nearby when better than what matters",
    body: "Reveal alternative baselines when your shortlist looks strong only relative to one reference case.",
    placement: "bottom",
  },
  {
    id: "list.step4.average",
    anchorId: "list.viewControl.average",
    eyebrow: "STEP 4 - SWITCH THE OUTCOME VIEW",
    title: "Average is for quick scans and first sorting passes",
    body: "Use it when you need a clean read across many rows and want the sort order to stay legible.",
    placement: "bottom",
  },
  {
    id: "list.step4.bar",
    anchorId: "list.viewControl.bar",
    eyebrow: "STEP 4 - SWITCH THE OUTCOME VIEW",
    title: "Bar shows the relative tier mix",
    body: "Use it when you want to see whether an outcome is concentrated in stronger or weaker tiers without opening the full distribution.",
    placement: "bottom",
  },
  {
    id: "list.step4.distribution",
    anchorId: "list.viewControl.distribution",
    eyebrow: "STEP 4 - SWITCH THE OUTCOME VIEW",
    title: "Distribution works with map, locations, climate, and change",
    body: "Use it when you need to inspect which locations are driving the result, compare climates, or connect the cell back to spatial detail.",
    placement: "bottom",
  },
  {
    id: "list.journey",
    eyebrow: "TAKE YOUR SHORTLIST FORWARD",
    title: "What to do after the List view",
    body: "Radar compares the shortlisted scenarios as full portfolios instead of isolated cells. Resilience tests the same scenarios across climate futures and operational leverage. Distribution inspects the spread across locations more directly.",
  },
]
