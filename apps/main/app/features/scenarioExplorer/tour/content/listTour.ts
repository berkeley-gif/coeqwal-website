/**
 * List tour. Full port of ListHowToRead.tsx callouts, each becoming an
 * ordered, anchored step. Hero and journey-strip bookends render as
 * centered cards (no `anchorId`). List how-to copy may diverge from
 * the modal for clarity; anchored steps can stay aligned.
 */

import type { TourStep } from "../types"

export const LIST_TOUR: TourStep[] = [
  {
    id: "list.hero",
    eyebrow: "START HERE",
    title: "The List view lets you browse scenarios and compare outcomes.",
    body: "Start with the scenario list on the left, then read across each row to compare the key outcomes on the right. This is where you can arrange the view, sort by what matters, and build a shortlist to carry forward.",
  },
  {
    id: "list.step1.search",
    anchorId: "list.toolbar.search",
    eyebrow: "ARRANGE THE LIST",
    title: "Search",
    body: "Type here to optionally filter scenarios. Use the x to clear the field and bring the full set back.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.chips",
    anchorId: "list.toolbar.chips",
    eyebrow: "ARRANGE THE LIST",
    title: "Chips",
    body: "Use these toggles to show definitions, baselines, key operations, selected rows only, and group by theme. Each one changes what appears in the list.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.pin",
    anchorId: "list.row.pin",
    eyebrow: "ARRANGE THE LIST",
    title: "Pin",
    titleIcon: "pin",
    body: "Pin a scenario to float it to the top of the list while you compare. Use share on the same control when you want to stage the current card to the Share drawer and Share tab.",
    placement: "left-start",
  },
  {
    id: "list.step2.info",
    anchorId: "list.outcome.infoButton",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Info brings back the outcome summary",
    body: "Click the i when you need a reminder of what the outcome measures.",
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
    body: "You can compare down the column instead of many across the row.",
    placement: "left",
  },
  {
    id: "list.step3.row",
    anchorId: "list.select.row",
    eyebrow: "STEP 3 - GATHER A SHORTLIST",
    title: "Select the scenarios that you want to focus on",
    body: "Use the checkboxes to gather a working set without losing the rest of the library.",
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
    body: "Radar compares the shortlisted scenarios across every chosen outcome at once instead of isolated cells. Distribution inspects the spread across locations more directly.  Resilience tests the same scenarios across climate futures and operational leverage.",
  },
]
