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
    title: "",
    body: "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },
  {
    id: "list.step1.homeView",
    anchorId: "list.homeTab",
    eyebrow: "home view",
    title: "",
    body: "The Home view displays the list of all scenarios that can be explored.",
    placement: "bottom-start",
  },
  {
    id: "list.step2.select",
    anchorId: "list.select.checkbox",
    eyebrow: "select",
    title: "Select a scenario of interest",
    body: "Select scenarios of interest by checking the box on the left.",
    placement: "bottom-start",
  },
  {
    id: "list.step3.search",
    anchorId: "list.toolbar.search",
    eyebrow: "search",
    title: "Type in key words to search for a scenario of interest",
    body: "The search words will filter scenarios. Use the x to clear the field and bring the full list back.",
    placement: "bottom-start",
  },
  {
    id: "list.step4.refineList",
    anchorId: "list.toolbar.chips",
    eyebrow: "refine the list",
    title: "These controls refine the scenario list below",
    body: "Click the buttons to filter or rearrange the scenario list.",
    placement: "bottom-start",
  },
  {
    id: "list.step5.definitions",
    anchorId: "list.select.showDefinitions",
    eyebrow: "definitions",
    title:
      "The definitions button displays the detailed description of the scenario",
    body: "Click to display or hide the text.",
    placement: "bottom",
  },
  {
    id: "list.step6.baselines",
    anchorId: "list.select.showBaselines",
    eyebrow: "baselines",
    title:
      "The baselines button displays alternative versions of the current operations scenario",
    body: "Click this button to see other scenarios that can serve as a baseline for comparison.",
    placement: "bottom-start",
  },
  {
    id: "list.step7.groupByIssue",
    anchorId: "list.toolbar.themeGroup",
    eyebrow: "water issues",
    title: "Scenarios are grouped by water issues",
    body: "Click on this button to group selected scenarios by water issue.",
    placement: "left-start",
  },
  {
    id: "list.step8.selectedOnly",
    anchorId: "list.select.showOnlyChosen",
    eyebrow: "view selected",
    title: "Selected scenarios can be filtered",
    body: "Click on this button to view only selected scenarios. The others are hidden so the shortlist becomes easier to compare.",
    placement: "left-start",
  },
  {
    id: "list.step9.keyOperations",
    anchorId: "list.toolbar.keyOperationsChip",
    eyebrow: "key operations",
    title: "Icons summarize key features of each scenario",
    body: "Click on this button to display the icons.",
    placement: "bottom-start",
  },
  {
    id: "list.step10.filterByOperation",
    anchorId: "list.row.operations",
    eyebrow: "filter by key operation",
    title: "Click an icon to filter by that operation",
    body: "Selecting an icon selects every scenario in the library that shares it, so you can build a shortlist around one water-management decision.",
    placement: "right",
  },
  {
    id: "list.journey",
    anchorId: "list.startVisualizing",
    eyebrow: "visualize data",
    title:
      "Click on this panel or one of the explore tools to visualize scenario outcomes",
    body: "You can now visualize the data for the scenarios you selected.",
    placement: "top",
  },
]
