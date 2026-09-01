/**
 * Resilience tour. The ordered, anchored steps that walk a first-time user
 * through the Resilience view. Hero and journey-strip bookends render as
 * centered cards (no `anchorId`). *
 */

import type { TourStep } from "../../../tour/types"

export const RESILIENCE_TOUR: TourStep[] = [
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
    eyebrow: "heatmap",
    title: "",
    body: "The Heatmap displays scenario results for different hydroclimates. The colors of the heat map chart correspond to optimal (green), acceptable (blue), at-risk (orange), and critical (red) outcomes.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.search", // edit this
    anchorId: "list.toolbar.search", // edit this
    eyebrow: "reading the data",
    title: "Each box in the grid represents an average outcome level",
    body: "Hover over each point to view the average value and outcome level category. The entire grid displays how outcomes shift under different hydroclimates.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.chips", // edit this
    anchorId: "list.toolbar.chips", // edit this
    eyebrow: "chart controls",
    title: "These controls configure the chart",
    body: "Click on the buttons to change how data on the heatmap is displayed.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.themeFilterChip", // edit this
    anchorId: "list.toolbar.themeFilterChip", // edit this
    eyebrow: "arrange chart",
    title: "Select the data to display",
    body: "The chart can be arranged by scenario, outcomes, or hydroclimate.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step3.showOnlyChosen", // edit this
    anchorId: "list.select.showOnlyChosen", // edit this
    eyebrow: "select outcomes",
    title: "Select the outcomes to display",
    body: "Select one or more outcomes to display on the chart.",
    placement: "bottom", // edit this
  },
  {
    id: "list.step1.operations", // edit this
    anchorId: "list.toolbar.keyOperationsChip", // edit this
    eyebrow: "select hydroclimates",
    title: "Select the hydroclimates to display",
    body: "Select one or more hydroclimates to display on the chart.",
    placement: "bottom-start", // edit this
  },
  {
    id: "list.step1.operationsIcons", // edit this
    anchorId: "list.row.operations", // edit this
    eyebrow: "outcome values",
    title: "Display the average values of outcome levels in the boxes",
    body: "Higher values indicate worse performance.",
    placement: "left-start", // edit this
  },
  {
    id: "list.step1.share", // edit this
    anchorId: "list.row.share", // edit: anchor ID for the share button
    eyebrow: "switch heatmap orientation",
    title: "",
    body: "Switch the axes of the heatmap grid.",
    placement: "left-start", // edit this
  },
  {
    id: "list.step3.row", // edit this
    anchorId: "list.select.checkbox", // edit this
    eyebrow: "save snapshot",
    title: "Save one or more distribution plots using this button",
    body: "Click the save snapshot button to export the radar chart to the SHARE folder. All shared items will be saved here to revisit later.",
    placement: "right", // edit this
  },
  {
    id: "list.journey", // edit this
    anchorId: "", // edit this
    eyebrow: "map view",
    title: "The locations of outcomes can be viewed on a map",
    body: "Open the map and click on a box in the heatmap. All locations of interest for that outcome are displayed on the map.",
    placement: "", // edit this
  },
  {
    id: "list.journey", // edit this
    anchorId: "", // edit this
    eyebrow: "explore other views",
    title: "Select other tools to view scenario results in differ ways",
    body: "Use the links above to go to the next tool when you are ready. Your shortlist of scenarios stays with you.",
    placement: "", // edit this
  },
]
