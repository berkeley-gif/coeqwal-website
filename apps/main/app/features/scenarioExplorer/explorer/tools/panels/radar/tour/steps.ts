/**
 * Radar tour. Structured to parallel `LIST_TOUR` so users get a
 * consistent rhythm across tools: a short hero, "get oriented" cards
 * for each region, the controls that live in that region, a "read the
 * chart" section anchored to the plot, and a closing journey card.
 *
 * Order follows a spatial "like with like" grouping. Each "get
 * oriented" popper introduces a region, and the detail poppers for
 * that region follow immediately after.
 *
 * Anchor ids resolve into `RadarPanel` (chart + axes) and into the
 * shared `ToolToolbar` + radar-only `ChartControlsBar` (chips + capture).
 */

import type { TourStep } from "../../../tour/types"

export const RADAR_TOUR: TourStep[] = [
  {
    id: "radar.hero",
    eyebrow: "start here",
    title: "Start here",
    body: "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },

  // Orientation + details for the sidebar (scenario library).
  {
    id: "radar.step0.sidebar", // edit this
    anchorId: "radar.sidebar", // edit this
    eyebrow: "radar plot",
    title: "The radar chart tool displays each key outcome for selected scenarios",
    body: "Add or remove scenarios by changing your selection on the sidebar.",
    placement: "right", // edit this
  },
  {
    id: "radar.step0.sidebarControls", // edit this
    anchorId: "radar.sidebarControls", // edit this
    eyebrow: "reading the data",
    title: "Each point represents an average outcome level",
    body: "Hover over each point to view the average value and outcome level category. Points near the inside of the circle indicate critical (poor) performance and points near the outside of the circle indicate optimal (or good) performance.",
    placement: "right", // edit this
  },
  {
    id: "radar.step0.viewArea", // edit this
    anchorId: "radar.viewArea", // edit this
    eyebrow: "key outcomes",
    title: "Scenario results are summarized by nine key outcomes",
    body: "To understand how each key outcome is defined, click on the {{infoIcon}}.",
    placement: "bottom-end", // edit this
  },
  {
    id: "radar.step0.chartToolbar", // edit this
    anchorId: "radar.chartToolbar", // edit this
    eyebrow: "hydroclimates",
    title: "Scenario outcomes change with climate stress",
    body: "Click on the hydroclimate icons to see outcomes change with different levels of climate stress.",
    placement: "bottom-start", // edit this
  },
  {
    id: "radar.step1.axisChooser", // edit this
    // Anchor to the opened panel (not the chip) so the popper lands
    // just past the panel's right edge and the panel stays fully
    // visible while the step is active. The panel is programmatically
    // opened by RadarTourEffects for this step, so the anchor is
    // guaranteed to be mounted.
    anchorId: "radar.axisChooserPanel", // edit this
    eyebrow: "chart controls",
    title: "These controls configure the chart",
    body: "Click on the buttons to change how data on the radar plot is displayed.",
    placement: "right-start", // edit this
  },
  // Meli - id, anchorId, placement for the next several steps just need to be incremented one.
  {
    id: "radar.step1.showAll", // edit this
    anchorId: "radar.showAll", // edit this
    eyebrow: "choose outcomes",
    title: "Change which outcomes are displayed on the chart",
    body: "Click on the button to select which key outcomes to display. The results of some key outcomes are separated by region: North of Delta and South of Delta.",
    placement: "bottom-start", // edit this
  },
  {
    id: "radar.step1.dotsOnly", // edit this
    anchorId: "radar.dotsOnly", // edit this
    eyebrow: "show all scenarios",
    title: "Display selected scenarios against the full list",
    body: "Click on the button to display results for the full set of scenarios.",
    placement: "bottom-start", // edit this
  },
  {
    id: "radar.step1.highlightBaseline", // edit this
    anchorId: "radar.highlightBaseline", // edit this
    eyebrow: "dots only",
    title: "Make the lines connecting dots translucent",
    body: "If the chart gets too busy, click on this button.",
    // Sit below the chart controls toolbar and shift the popper left
    // of the chip so the popper's right edge aligns with the chip's
    // left edge. Leaves the chart center unobstructed while the
    // baseline overlay draws on the chart.
    placement: "bottom-end", // edit this
    anchorSkidMultiplier: -1, // edit this
    disableFlip: true, // edit this
  },
  {
    id: "radar.step1.libraryRange",
    anchorId: "radar.libraryRange",
    eyebrow: "highlight current operations",
    title: "Compare selected scenarios against current operations",
    body: "Click on this button to display the current operations – a baseline reference for comparison with other scenarios.",
    // Mirror of highlightBaseline: sit below the toolbar and shift
    // right of the chip so the popper's left edge aligns with the
    // chip's right edge. Leaves the chart center unobstructed while
    // the library range band draws on the chart.
    placement: "bottom-start", // edit this
    anchorSkidMultiplier: 1, // edit this
    disableFlip: true, // edit this
  },
  {
    id: "radar.step1.capture", // edit this
    anchorId: "radar.capture", // edit this
    eyebrow: "show range",
    title: "Show the full range of results for all scenarios in the library",
    titleIcon: "share", // edit this
    body: "Click on this button to display the range of results for key outcomes across all scenarios in the library.",
    placement: "bottom-end", // edit this
  },
  {
    id: "radar.step2.polygon", // edit this
    anchorId: "radar.polygon", // edit this
    eyebrow: "save snapshot",
    title: "Save one or more radar plots using this button",
    body: "Click the save snapshot button to export the radar chart to the SHARE folder. All shared items will be saved here to revisit later.",
    placement: "right", // edit this
  },
  {
    id: "radar.step2.infoIcon", // edit this
    anchorId: "radar.infoIcon", // edit this
    eyebrow: "explore other views",
    title: "Select other tools to view scenario results in differ ways",
    body: "Use the links above to go to the next tool when you are ready. Your shortlist of scenarios stays with you.",
    // This step programmatically opens the outcome summary tooltip
    // above the info icon (placement: top, ~320px wide, ~120px tall).
    // Using placement "left" here centered the popper on the icon and
    // overlapped the tooltip in the upper-left quadrant by ~150 x ~100
    // px. "left-start" aligns the popper's top with the icon's top,
    // so the popper hangs downward on the left side and can't overlap
    // the tooltip (which sits entirely above the icon).
    placement: "left-start", // edit this
  },
  // this step is not needed anymore
  {
    id: "radar.journey", // remove this
    eyebrow: "take your shortlist forward", // remove this
    title: "What to do after this chart", // remove this
    body: "Your shortlist stays with you in the other views. Use the links above to move to the Distribution view to carefully compare two scenarios in detail, or the Resilience view when you are ready to test what holds across potential future hydroclimates.", // remove this
  },
]
