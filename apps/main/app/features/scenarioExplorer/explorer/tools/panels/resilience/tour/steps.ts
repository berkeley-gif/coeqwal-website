/**
 * Resilience tour. The ordered, anchored steps that walk a first-time user
 * through the Resilience view. Hero and journey-strip bookends render as
 * centered cards (no `anchorId`). *
 */

import type { TourStep } from "../../../tour/types"

export const RESILIENCE_TOUR: TourStep[] = [
  {
    id: "resilience.hero",
    eyebrow: "start here",
    title: "Start here",
    body: "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },
  {
    id: "resilience.step1.intro",
    eyebrow: "heatmap",
    title: "",
    body: "The Heatmap displays scenario results for different hydroclimates. The colors of the heat map chart correspond to optimal (green), acceptable (blue), at-risk (orange), and critical (red) outcomes.",
  },
  {
    id: "resilience.step2.cell",
    anchorId: "resilience.heatmapGrid",
    eyebrow: "reading the data",
    title: "Each box in the grid represents an average outcome level",
    body: "Hover over each point to view the average value and outcome level category. The entire grid displays how outcomes shift under different hydroclimates.",
    placement: "right",
  },
  {
    id: "resilience.step3.chartToolbar",
    anchorId: "resilience.chartToolbar",
    eyebrow: "chart controls",
    title: "These controls configure the chart",
    body: "Click on the buttons to change how data on the heatmap is displayed.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step4.pivot",
    anchorId: "resilience.pivot",
    eyebrow: "arrange chart",
    title: "Select the data to display",
    body: "The chart can be arranged by scenario, outcomes, or hydroclimate.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step5.outcomes",
    anchorId: "resilience.outcomes",
    eyebrow: "select outcomes",
    title: "Select the outcomes to display",
    body: "Select one or more outcomes to display on the chart.",
    placement: "bottom",
  },
  {
    id: "resilience.step5.climates",
    anchorId: "resilience.climates",
    eyebrow: "select hydroclimates",
    title: "Select the hydroclimates to display",
    body: "Select one or more hydroclimates to display on the chart.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step6.showCellValues",
    anchorId: "resilience.showCellValues",
    eyebrow: "outcome values",
    title: "Display the average values of outcome levels in the boxes",
    body: "Higher values indicate worse performance.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step7.switchOrientation",
    anchorId: "resilience.switchOrientation",
    eyebrow: "switch heatmap orientation",
    title: "Switch the axes of the heatmap grid",
    placement: "bottom-start",
  },
  {
    id: "resilience.step8.saveSnapshot",
    anchorId: "resilience.saveSnapshot",
    eyebrow: "save snapshot",
    title: "Save one or more distribution plots using this button",
    body: "Click the save snapshot button to export the radar chart to the SHARE folder. All shared items will be saved here to revisit later.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step9.showMap",
    anchorId: "toolbar.showMap",
    eyebrow: "map view",
    title: "The locations of outcomes can be viewed on a map",
    body: "Open the map and click on a box in the heatmap. All locations of interest for that outcome are displayed on the map.",
    placement: "bottom",
  },
  {
    id: "resilience.journey",
    eyebrow: "explore other views",
    title: "Select other tools to view scenario results in differ ways",
    body: "Use the links above to go to the next tool when you are ready. Your shortlist of scenarios stays with you.",
  },
]
