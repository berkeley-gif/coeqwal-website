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

import type { TourStep } from "../types"

export const RADAR_TOUR: TourStep[] = [
  {
    id: "radar.hero",
    eyebrow: "start here",
    title: "The Radar view reads your shortlist as shapes.",
    body: "Each selected scenario is viewed as polygon across the outcome axes you choose, so trade-offs appear as shape. Arrange the chart, read the polygons, and switch hydroclimates to see the shape of the data change.",
  },

  // Orientation + details for the sidebar (scenario library).
  {
    id: "radar.step0.sidebar",
    anchorId: "radar.sidebar",
    eyebrow: "get oriented",
    title: "Your scenario list lives in the sidebar",
    body: "The left column is the same scenario library as the list view. Select scenarios here to add polygons to the chart, and hover a row to highlight its shape. The chart on the right only draws what the sidebar selects.",
    placement: "right",
  },
  {
    id: "radar.step0.sidebarControls",
    anchorId: "radar.sidebarControls",
    eyebrow: "tune the sidebar",
    title: "Tune the scenario list from these controls",
    body: "Search narrows the list by name. The chips below toggle definitions, baselines, selected-only, group-by-theme, and key operations. These are the same controls the list view covers one by one; they filter and label the rows, not the chart.",
    placement: "right",
  },

  // Orientation + details for the chart-side toolbars (radar chips
  // and the view-level hydroclimate chips above them).
  {
    id: "radar.step0.chartToolbar",
    anchorId: "radar.chartToolbar",
    eyebrow: "get oriented",
    title: "These controls configure the chart",
    body: "The toolbar above the chart is radar-specific. The chips here choose which outcomes become axes, overlay the library range, show all scenarios at once, and capture the current view. A second strip above it switches the hydroclimate the polygons are read under. The next steps walk through each one.",
    placement: "bottom-start",
  },
  {
    id: "radar.step1.axisChooser",
    anchorId: "radar.axisChooser",
    eyebrow: "arrange the radar",
    title: "Choose outcome axes",
    body: "Open the axis picker to decide which outcomes are visible on the radar.",
  },
  {
    id: "radar.step1.showAll",
    anchorId: "radar.showAll",
    eyebrow: "arrange the radar",
    title: "Show all scenarios",
    body: "Turn this on to compare your shortlist against the full library at once. Turn it off to focus only on the scenarios you selected in the list view.",
    placement: "bottom-start",
  },
  {
    id: "radar.step1.libraryRange",
    anchorId: "radar.libraryRange",
    eyebrow: "arrange the radar",
    title: "Show range",
    body: "Toggle the library range to draw a context band behind the polygons. If a shape pushes outside that band on any axis, it is doing something the broader library rarely does.",
    placement: "bottom-start",
  },
  {
    id: "radar.step1.capture",
    anchorId: "radar.capture",
    eyebrow: "arrange the radar",
    title: "Capture view",
    titleIcon: "share",
    body: "Use capture view to stage the chart you see in the Share drawer, then find it in the Share tab when you are ready to save the chart and its data.",
    placement: "bottom-end",
  },
  {
    id: "radar.step3.climate",
    anchorId: "radar.climateChips",
    eyebrow: "switch the hydroclimate",
    title: "",
    illustration: "listHydroclimate",
    body: "Switch hydroclimates to see how the same shortlist performs under different conditions. Every polygon updates to reflect that climate, so you can test a shape against historical, cc50, and cc95 futures without leaving the chart.",
    placement: "bottom-end",
  },

  // Reading the radar chart itself.
  {
    id: "radar.step2.polygon",
    anchorId: "radar.polygon",
    eyebrow: "read the radar",
    title: "Each polygon is one scenario",
    body: "Read a polygon vertex by vertex to see how one scenario performs across outcomes. A broad, even shape is balanced; spikes and pinches reveal trade-offs. Compare polygons to compare scenarios on the same axes.",
    placement: "right",
  },
  {
    id: "radar.step2.rings",
    anchorId: "radar.rings",
    eyebrow: "read the radar",
    title: "Tier rings keep the read grounded",
    body: "The rings use the same tier logic as the list: closer to the center is better. A shape that stays inside the inner rings is performing well across more outcomes.",
    placement: "right",
  },
  {
    id: "radar.step2.axisLabel",
    anchorId: "radar.axisLabel",
    eyebrow: "read the radar",
    title: "Click an axis to rank the shortlist",
    body: "Click an axis label to open a ranked slice of your shortlist on that single outcome. Use it to understand what the polygon is summarizing, then reverse to inspect the other end of the library.",
    placement: "left",
  },
  {
    id: "radar.step2.infoIcon",
    anchorId: "radar.infoIcon",
    eyebrow: "read the radar",
    title: "Outcome summary",
    body: "Click the {{infoIcon}} next to an axis label when you need a reminder of what the outcome measures.",
    placement: "left",
  },

  {
    id: "radar.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links above to move to Resilience when you are ready to test what holds across a climate-by-outcome matrix.",
  },
]
