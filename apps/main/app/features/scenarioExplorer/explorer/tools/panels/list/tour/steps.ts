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
    title: "The List view lets you select the scenarios that you want to compare",
    body: "Select your scenarios and use the top bar to move between tools",
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
    id: "list.step1.themeFilterChip",
    eyebrow: "arrange the list",
    title: "Filtering shows a removable chip",
    body: "Click a scenario's theme badge to filter the list to that theme, or select any scenarios to reveal a Clear all chip. Both appear next to the chips above and let you back out of a filter in one click.",
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
    id: "list.step1.operationsIcons",
    anchorId: "list.row.operations",
    eyebrow: "arrange the list",
    title: "Click an icon to filter by that operation",
    body: "Selecting an operation icon selects every scenario in the library that shares it, so you can quickly build a shortlist around one water-management choice.",
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

  // Move forward with your shortlist
  {
    id: "list.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links in the top toolbar to go to the next tool when you are ready, or click the Start Visualizing rail on the right to get started",
  },
]
