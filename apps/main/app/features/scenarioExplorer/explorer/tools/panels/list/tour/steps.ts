/**
 * List tour. The ordered, anchored steps that walk a first-time user
 * through the List view. Hero and journey-strip bookends render as
 * centered cards (no `anchorId`).
 *
 * Order follows a spatial "like with like" grouping: each "get
 * oriented" popper introduces a region, and the detail poppers for
 * that region follow immediately after. Read-the-outcomes and
 * shortlist steps close the tour.
 */

import type { TourStep } from "../../../tour/types"

export const LIST_TOUR: TourStep[] = [
  {
    id: "list.hero",
    eyebrow: "start here",
    title: "The List view lets you browse scenarios and compare outcomes",
    body: "Start with the scenario list on the left, then read across each row to compare the key outcomes on the right. This is where you can arrange the view, sort by outcomes, and build a shortlist to carry forward.",
  },

  // Orientation + details for the scenario-list controls band.
  {
    id: "list.step0.scenarioArea",
    anchorId: "list.scenarioArea",
    eyebrow: "get oriented",
    title: "These controls tune the scenario list below",
    body: "Everything in this band filters or rearranges the scenario sidebar rows below.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.search",
    anchorId: "list.toolbar.search",
    eyebrow: "arrange the list",
    title: "Search",
    body: "Type here to optionally filter scenarios. Use the x to clear the field and bring the full set back.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.chips",
    anchorId: "list.toolbar.chips",
    eyebrow: "arrange the list",
    title: "Chips",
    body: "Use these toggles to show definitions, baselines, key operations, selected rows only, and group by theme. Each one changes what appears in the list.",
    placement: "bottom-start",
  },
  {
    id: "list.step3.showOnlyChosen",
    anchorId: "list.select.showOnlyChosen",
    eyebrow: "arrange the list",
    title: "Selected only turns a long list into a working table",
    body: "Once selected scenario listings are checked, you can hide the rest so the shortlist becomes easier to compare.",
    placement: "bottom",
  },
  {
    id: "list.step1.operations",
    anchorId: "list.toolbar.keyOperationsChip",
    eyebrow: "arrange the list",
    title: "Key operations",
    body: "Toggle key operations to add a column of icons that summarize the key operations of each scenario.",
    placement: "bottom-start",
  },
  {
    id: "list.step1.pin",
    anchorId: "list.row.pin",
    eyebrow: "arrange the list",
    title: "Pin",
    titleIcon: "pin",
    body: "Pin a scenario to float it to the top of the list while you compare.",
    placement: "left-start",
  },
  {
    id: "list.step1.share",
    anchorId: "list.row.share",
    eyebrow: "arrange the list",
    title: "Share",
    titleIcon: "share",
    body: "Use share to stage the chart you see in the Share drawer, then find it in the Share tab when you are ready to save the chart and its data.",
    placement: "left-start",
  },

  // Orientation + details for the top toolbar view controls.
  {
    id: "list.step0.viewArea",
    anchorId: "list.viewArea",
    eyebrow: "get oriented",
    title: "These controls set the data view",
    body: "The controls apply to the chart. The map toggle opens the map pane, and the climate chips switch the hydroclimate.",
    placement: "bottom-end",
  },
  {
    id: "list.step4.map",
    anchorId: "list.toolbar.map",
    eyebrow: "open the map",
    title: "",
    illustration: "listMapLegend",
    body: "Turn on Show map to open the map panel beside the list. Try clicking on an outcome chart to see it on the map. Use this to see where outcomes are strongest or weakest, compare scenarios in place, and view changes by hydroclimate. Pan and zoom as you would in any web map.",
    placement: "bottom-start",
  },
  {
    id: "list.step4.climate",
    anchorId: "list.toolbar.climate",
    eyebrow: "switch the hydroclimate",
    title: "",
    illustration: "listHydroclimate",
    body: "Switch hydroclimates to see how the same scenarios perform under different conditions. The outcomes across every row update to reflect that climate, as does the map, so you can test a shortlist against different futures.",
    placement: "bottom-end",
  },

  // Reading the outcomes (outcome columns + per-cell controls).
  {
    id: "list.step4.bar",
    anchorId: "list.outcome.barChart",
    eyebrow: "read the outcomes",
    title: "",
    illustration: "listBarTiers",
    body: "Each bar shows what percentage of the locations fall into each tier. Longer bars mean a larger share of the locations is in that tier. Read across a row to compare one scenario across outcomes, or down a column to compare scenarios on the same outcome.",
    placement: "left",
  },
  {
    id: "list.step2.info",
    anchorId: "list.outcome.infoButton",
    eyebrow: "read the outcomes",
    title: "Outcome summary",
    body: "Click the {{infoIcon}} when you need a reminder of what the outcome measures.",
    placement: "bottom",
  },
  {
    id: "list.step2.sort",
    anchorId: "list.outcome.sortButton",
    eyebrow: "read the outcomes",
    title: "Sorting ranks rows by average",
    illustration: "listSortButton",
    body: "Use the sort button to rank scenarios by average outcome, then reverse the order to inspect the other end of the library.",
    placement: "bottom",
  },

  // Gather a shortlist (row-level selection).
  {
    id: "list.step3.row",
    anchorId: "list.select.checkbox",
    eyebrow: "gather a shortlist",
    title: "Select the scenarios that you want to focus on",
    illustration: "listCheckbox",
    body: "Use the checkboxes to gather a working set without losing the rest of the library.",
    placement: "right",
  },

  /*
   * Outcome view toolbar toggles (Average / Bar / Distribution) are not
   * mounted in the list toolbar while the toggle is feature-flagged off.
   * The bar tour step anchors to a live `list.outcome.barChart` cell instead.
   */
  {
    id: "list.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links above to go to the next tool when you are ready.",
  },
]
