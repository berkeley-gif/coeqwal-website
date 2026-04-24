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
    body: "Pin a scenario to float it to the top of the list while you compare.",
    placement: "left-start",
  },
  {
    id: "list.step1.share",
    anchorId: "list.row.share",
    eyebrow: "ARRANGE THE LIST",
    title: "Share",
    titleIcon: "share",
    body: "Use share to stage a scenario in the Share drawer, then find it in the Share tab when you are ready.",
    placement: "left-start",
  },
  {
    id: "list.step1.operations",
    anchorId: "list.toolbar.keyOperationsChip",
    eyebrow: "KNOW EACH SCENARIO",
    title: "Key operations",
    body: "Toggle Key operations to add a column of icons that summarize the key operations of each scenario.",
    placement: "bottom-start",
  },
  {
    id: "list.step2.outcomes",
    anchorId: "list.outcome.column",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "The columns are the key outcomes",
    body: "Each column is one key outcome. Read down one column to compare scenarios on the same outcome, or read across a row to see one scenario's full profile.",
    placement: "left",
  },
  {
    id: "list.step2.info",
    anchorId: "list.outcome.infoButton",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Outcome summary",
    body: "Click the {{infoIcon}} when you need a reminder of what the outcome measures.",
    placement: "bottom",
  },
  {
    id: "list.step2.sort",
    anchorId: "list.outcome.sortButton",
    eyebrow: "STEP 2 - READ THE OUTCOMES",
    title: "Sorting ranks rows by average",
    body: "Use the sort button to rank scenarios by average outcome, then reverse the order to inspect the other end of the library.",
    placement: "bottom",
  },
  {
    id: "list.step3.row",
    anchorId: "list.select.checkbox",
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
    id: "list.step4.bar",
    anchorId: "list.outcome.barChart",
    eyebrow: "READ THE OUTCOMES",
    title: "",
    illustration: "listBarTiers",
    body: "Each bar shows what percentage of the locations fall into each tier. Longer bars mean a larger share of the locations is in that tier. Read across a row to compare one scenario across outcomes, or down a column to compare scenarios on the same outcome.",
    placement: "left",
  },
  {
    id: "list.step4.climate",
    anchorId: "list.toolbar.climate",
    eyebrow: "Switch the hydroclimate contex",
    title: "",
    body: "Switch hydroclimates to see how the same scenarios perform under different conditions. The outcomes across every row update to reflect that climate, as does the map, so you can test a shortlist against different futures.",
    placement: "bottom-end",
  },
  {
    id: "list.step4.map",
    anchorId: "list.toolbar.map",
    eyebrow: "Open the map",
    title: "",
    illustration: "listMapLegend",
    body: "Turn on Show map to open the map panel beside the list. Click on an outcome to see it on the map. Use this to see where conditions are strongest or weakest, compare scenarios in place, and view changes by hydroclimate. Pan and zoom as you would in any web map.",
    placement: "bottom-start",
  },
  /*
   * Outcome view toolbar toggles (Average / Bar / Distribution) are not
   * mounted in the list toolbar while the toggle is feature-flagged off.
   * The bar tour step anchors to a live `list.outcome.barChart` cell instead.
   */
  {
    id: "list.journey",
    eyebrow: "TAKE YOUR SHORTLIST FORWARD",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links above to go to the next tool when you are ready.",
  },
]
