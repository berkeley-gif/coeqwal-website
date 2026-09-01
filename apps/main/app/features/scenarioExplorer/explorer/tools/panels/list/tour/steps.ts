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
    id: "list.hero", // edit this 
    eyebrow: "START HERE",
    title: "Start here",
    body: "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },

  // Orientation + details for the scenario-list controls band.
  {
    id: "list.step0.scenarioArea", // edit this
    anchorId: "list.scenarioArea", // edit this
    eyebrow: "home view",
    title: "These controls tune the scenario list below",
    body: "The Home view displays the list of all scenarios that can be explored.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.search", // edit this
    anchorId: "list.toolbar.search", // edit this
    eyebrow: "select",
    title: "Select a scenario of interest",
    body: "Select scenarios of interest by checking the box on the left.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.chips", // edit this
    anchorId: "list.toolbar.chips", // edit this
    eyebrow: "search",
    title: "Type in key words to search for a scenario of interest",
    body: "The search words will filter scenarios. Use the x to clear the field and bring the full list back.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.themeFilterChip", // edit this
    anchorId: "list.toolbar.themeFilterChip", // edit this
    eyebrow: "refine the list",
    title: "These controls refine the scenario list below",
    body: "Click the buttons to filter or rearrange the scenario list.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step3.showOnlyChosen", // edit this
    anchorId: "list.select.showOnlyChosen", // edit this
    eyebrow: "definitions",
    title: "The definitions button displays the detailed description of the scenario",
    body: "Click to display or hide the text.",
    placement: "bottom", // edit this
  },
  {
    id: "list.step1.operations", // edit this
    anchorId: "list.toolbar.keyOperationsChip", // edit this
    eyebrow: "baselines",
    title: "The baselines button displays alternative versions of the current operations scenario",
    body: "Click this button to see other scenarios that can serve as a baseline for comparison.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.operationsIcons", // edit this
    anchorId: "list.row.operations", // edit this
    eyebrow: "water issues",
    title: "Scenarios are grouped by water issues",
    body: "Click on this button to group selected scenarios by water issue.",
    placement: "left-start", // edit this
  },
  {
    id: "list.step1.share", // edit this
    anchorId: "list.row.share", // edit: anchor ID for the share button
    eyebrow: "view selected",
    title: "Selected scenarios can be filtered",
    body: "Click on this button to view only selected scenarios. The others are hidden so the shortlist becomes easier to compare.",
    placement: "left-start", // edit this
  },
  {
    id: "list.step3.row", // edit this
    anchorId: "list.select.checkbox", // edit this
    eyebrow: "key operations",
    title: "Icons summarize key features of each scenario",
    body: "Click on this button to display the icons.",
    placement: "right", // edit this
  },
  {
    id: "list.journey", // edit this
    anchorId: "", // edit this
    eyebrow: "filter by key operation",
    title: "Click an icon to filter by that operation",
    body: "Selecting an icon selects every scenario in the library that shares it, so you can build a shortlist around one water-management decision.",
    placement: "", // edit this
  },
  {
    id: "list.journey", // edit this
    anchorId: "", // edit this
    eyebrow: "visualize data",
    title: "Click on panel or one of the explore tools to visualize scenario outcomes",
    body: "You can now visualize the data for the scenarios you selected.",
    placement: "", // edit this
  },
]
