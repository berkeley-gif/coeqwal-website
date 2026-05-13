/**
 * Radar tour. Structured to parallel LIST_TOUR so users get a
 * consistent rhythm across tools: a short hero, "get oriented"
 * cards for each region, the controls that live in that region,
 * a "read the chart" section anchored to the plot, and a closing
 * journey card.
 *
 * Order follows a spatial "like with like" grouping. Each "get
 * oriented" popper introduces a region, and the detail poppers for
 * that region follow immediately after.
 *
 * Anchor ids resolve into RadarPanel (chart + axes) and into the
 * shared ToolToolbar + radar-only ChartControlsBar (chips + capture).
 */

import type { TourStep } from "../../tour/types"

export const RADAR_TOUR: TourStep[] = [
  {
    id: "radar.hero",
    eyebrow: "start here",
    title: "The Radar chart visualizes your shortlist as shapes",
    body: "Each selected scenario is viewed as polygon across the outcome axes you choose, so trade-offs appear as shape. Arrange the chart, read the polygons, and switch hydroclimates to see the shape of the data change.",
  },

  // Orientation + details for the sidebar (scenario library).
  {
    id: "radar.step0.sidebar",
    anchorId: "radar.sidebar",
    eyebrow: "get oriented",
    title: "Your scenario list lives in the sidebar",
    body: "The left column is the same scenario library as the list view. Select scenarios here to add polygons to the chart, and hover a row to highlight that scenario's polygon. The chart on the right draws what the sidebar selects. If no scenarios are selected, the chart will show the whole scenario library, which shows the overall shape of the data.",
    placement: "right",
  },
  {
    id: "radar.step0.sidebarControls",
    anchorId: "radar.sidebarControls",
    eyebrow: "tune the sidebar",
    title: "Tune the scenario list from these controls",
    body: "Searching narrows the list by keyword. The chips below toggle definitions, baselines, selected-only, group-by-theme, and key operations. These are the same controls as in the list view.",
    placement: "right",
  },

  // Shared top toolbar (hydroclimate + map). Same strip the list tour
  // covers. Introduced here as a single orientation step so the radar
  // tour does not have to repeat the per-control walkthrough.
  {
    id: "radar.step0.viewArea",
    anchorId: "radar.viewArea",
    eyebrow: "get oriented",
    title: "These controls set the data view",
    body: "This is the same toolbar as in the list view. This toolbar is shared across all the Explore tools.",
    placement: "bottom-end",
  },

  // Orientation + details for the chart-side toolbars (radar chips
  // and the view-level hydroclimate chips above them).
  {
    id: "radar.step0.chartToolbar",
    anchorId: "radar.chartToolbar",
    eyebrow: "get oriented",
    title: "These controls configure the chart",
    body: "The toolbar above the chart is radar-specific. The chips here choose which outcomes become axes, overlay the library range, show all scenarios at once, and capture the current view. The next steps walk through each one.",
    placement: "bottom-start",
  },
  {
    id: "radar.step1.axisChooser",
    // Anchor to the opened panel (not the chip) so the popper lands
    // just past the panel's right edge and the panel stays fully
    // visible while the step is active. The panel is programmatically
    // opened by ToolTour's axisSelectorDemoRef effect for this step,
    // so the anchor is guaranteed to be mounted.
    anchorId: "radar.axisChooserPanel",
    eyebrow: "arrange the radar chart",
    title: "Choose outcome axes",
    body: "Open the axis picker to decide which outcomes are visible on the radar.",
    placement: "right-start",
  },
  {
    id: "radar.step1.showAll",
    anchorId: "radar.showAll",
    eyebrow: "arrange the radar chart",
    title: "Show all scenarios",
    body: "Turn this on to compare your shortlist against the full library. Turn it off to focus only on the scenarios you've selected.",
    placement: "bottom-start",
  },
  {
    id: "radar.step1.highlightBaseline",
    anchorId: "radar.highlightBaseline",
    eyebrow: "arrange the radar chart",
    title: "Highlight current operations",
    body: "Turn this on to overlay the current operations baseline scenario (s0020) on the chart. This gives you a reference to compare changes and trade-offs against.",
    // Sit below the chart controls toolbar and shift the popper left
    // of the chip so the popper's right edge aligns with the chip's
    // left edge. Leaves the chart center unobstructed while the
    // baseline overlay draws on the chart.
    placement: "bottom-end",
    anchorSkidMultiplier: -1,
    disableFlip: true,
  },
  {
    id: "radar.step1.libraryRange",
    anchorId: "radar.libraryRange",
    eyebrow: "arrange the radar chart",
    title: "Show range",
    body: "Toggle this control to show the range of the scenario library on the chart. This will vary with hydroclimate.",
    // Mirror of highlightBaseline: sit below the toolbar and shift
    // right of the chip so the popper's left edge aligns with the
    // chip's right edge. Leaves the chart center unobstructed while
    // the library range band draws on the chart.
    placement: "bottom-start",
    anchorSkidMultiplier: 1,
    disableFlip: true,
  },
  {
    id: "radar.step1.capture",
    anchorId: "radar.capture",
    eyebrow: "arrange the radar chart",
    title: "Save snapshot",
    titleIcon: "share",
    body: "Use save snapshot to stage the chart you see in the Share drawer, then find it in the Share tab when you are ready to save the chart and its data.",
    placement: "bottom-end",
  },
  // Reading the radar chart itself.
  {
    id: "radar.step2.polygon",
    anchorId: "radar.polygon",
    eyebrow: "read the radar",
    title: "Each polygon is one scenario",
    body: "Read a polygon vertex by vertex to see how the scenario performs across outcomes. Further from the center is better. Points near the center mean the outcome is in a critical state, while points near the edge are in an optimal state.",
    placement: "right",
  },
  {
    id: "radar.step2.infoIcon",
    anchorId: "radar.infoIcon",
    eyebrow: "read the radar",
    title: "Outcome summary",
    body: "Click the {{infoIcon}} next to an axis label when you need a reminder of what the outcome measures.",
    // This step programmatically opens the outcome summary tooltip
    // above the info icon (placement: top, ~320px wide, ~120px tall).
    // Using placement "left" here centered the popper on the icon and
    // overlapped the tooltip in the upper-left quadrant by ~150 x ~100
    // px. "left-start" aligns the popper's top with the icon's top,
    // so the popper hangs downward on the left side and can't overlap
    // the tooltip (which sits entirely above the icon).
    placement: "left-start",
  },

  {
    id: "radar.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links above to move to the Distribution view to carefully compare two scenarios in detail, or the Resilience view when you are ready to test what holds across potential future hydroclimates.",
  },
]
