/**
 * Resilience tour. Structured to parallel RADAR_TOUR so users get a
 * consistent rhythm across tools: a short hero, "get oriented" cards
 * for each region, the controls that live in that region, a "read the
 * chart" section anchored to the matrix, and a closing journey card.
 *
 * Order follows a spatial "like with like" grouping. Each "get
 * oriented" popper introduces a region, and the detail poppers for
 * that region follow immediately after. The resilience chart has no
 * programmatic demos (per the plan), so every popper describes what
 * the user can go try without the tour moving the UI for them.
 *
 * Anchor ids resolve into ResiliencePanel (the first heatmap cell),
 * ResilienceControls (the one-sentence phrase buttons, the Presets
 * row, and the Rows row), the shared ToolToolbar map strip
 * (resilience.viewArea; no global hydroclimate chooser), and
 * ScenarioExplorer (the chart toolbar wrapper + save snapshot).
 * Show cell values and transpose both live in the Rows row now, so
 * there is no floating chart-corner toolbar to anchor onto.
 *
 * Within the chart controls region, steps progress in the same
 * visual order a user's eye reads the controls: the sentence top
 * to bottom and left to right (pivot, axes, outcomes, encoding),
 * then the Presets row, then the Rows row, and finally Save
 * snapshot at the top-right corner of the toolbar.
 */

import type { TourStep } from "../types"

export const RESILIENCE_TOUR: TourStep[] = [
  {
    id: "resilience.hero",
    eyebrow: "start here",
    title: "Revealing climate stress",
    body: "Each cell shows how one scenario performs for one outcome under one hydroclimate, colored by its tier. Pivot the chart around scenarios, outcomes, or hydroclimates to ask different questions. If nothing is selected, you see an aggregate across the whole library.",
  },

  // Orientation + details for the sidebar (scenario library).
  {
    id: "resilience.step0.sidebar",
    anchorId: "resilience.sidebar",
    eyebrow: "get oriented",
    title: "Your scenario list lives in the sidebar",
    body: "The left column is the same scenario library as the other views. Select scenarios here to build the chart. With nothing selected, the chart falls back to an aggregate overview, so you always see something meaningful.",
    placement: "right",
  },
  {
    id: "resilience.step0.sidebarControls",
    // The search + chips row reuses the same anchor the radar tour
    // does; SearchAndChips registers it in every non-list mode.
    anchorId: "radar.sidebarControls",
    eyebrow: "tune the sidebar",
    title: "Tune the scenario list from these controls",
    body: "Searching narrows the list by keyword. The chips below toggle definitions, baselines, selected-only, group-by-theme, and key operations. These are the same controls as in the list and radar views.",
    placement: "right",
  },

  // Shared top toolbar (map; no global hydroclimate switch in this tool).
  {
    id: "resilience.step0.viewArea",
    anchorId: "resilience.viewArea",
    eyebrow: "get oriented",
    title: "These controls set the data view",
    body: "Show map works like in other tools: turn it on, then click a cell to send that outcome to the map. The hydroclimates shown on the heatmap are picked in the chart controls just below.",
    placement: "bottom-end",
  },

  // Orientation for the chart-side controls.
  {
    id: "resilience.step0.chartToolbar",
    anchorId: "resilience.chartToolbar",
    eyebrow: "get oriented",
    title: "These controls configure the chart",
    body: "The bar above the chart is resilience-specific. The sentence reshapes the chart one phrase at a time. Presets jump to common layouts. The Rows row tunes how scenarios line up. Save snapshot stages what you see in the Share drawer. The next steps walk through these options.",
    placement: "bottom-start",
  },

  // Arrange the chart. Steps here follow the chart controls left to
  // right and top to bottom: the sentence reads pivot -> axes ->
  // outcomes -> encoding, then the Presets row, then the Rows row
  // (which also hosts Save snapshot at its right edge).
  {
    id: "resilience.step1.pivot",
    anchorId: "resilience.pivot",
    eyebrow: "arrange the chart",
    title: "Pick which dimension the chart is built around",
    body: "The leading phrase picks the dimension the chart is built around, and whether the chart shows it as small multiples (one tile per scenario, outcome, or hydroclimate) or a single averaged chart. This is the biggest lever on what question the chart answers.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.axes",
    anchorId: "resilience.axes",
    eyebrow: "arrange the chart",
    title: "Pick what is inside each chart",
    body: "The next two phrases set the rows and columns inside each chart. Each phrase opens a chooser. Click one to swap which dimension runs across or down.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.outcomes",
    anchorId: "resilience.outcomes",
    eyebrow: "arrange the chart",
    title: "Pick which outcomes to show",
    body: "Click this phrase to open the outcome picker. Narrow to a handful of outcomes to keep the chart legible, or expand a parent outcome to see its regional rows. In the per-outcome layout, this is also where you set the primary outcome and pick outcomes to compare against it.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.encoding",
    anchorId: "resilience.encoding",
    eyebrow: "arrange the chart",
    title: "Choose what color means",
    body: "Click this phrase to change how each cell is colored. Tier paints the performance category. Delta compares against a baseline with a diverging palette. Glyph splits each cell into a grid, one sub-tile per scenario.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.presets",
    anchorId: "resilience.presets",
    eyebrow: "arrange the chart",
    title: "Jump to a ready-made layout",
    body: "Presets apply a set of sentence choices in one click. Good starting points when you are not sure how to arrange the chart for a given question.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.rows",
    anchorId: "resilience.rows",
    eyebrow: "arrange the chart",
    title: "Tune how the rows read",
    body: "Group similar rows clusters scenarios that behave alike so patterns pop. Show cell values prints each tier number inside the cell; numbers drop out when tiles get too tight. Switch rows and columns flips which dimension runs down versus across.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.snapshot",
    anchorId: "resilience.snapshot",
    eyebrow: "arrange the chart",
    title: "Save snapshot",
    titleIcon: "share",
    body: "Save snapshot sits at the right edge of the Rows row. It stages the chart and its underlying data in the Share drawer, the same way capture view does in Radar. Find it in the Share tab when you are ready to export.",
    placement: "bottom-end",
  },

  // Reading the chart itself.
  {
    id: "resilience.step2.cell",
    anchorId: "resilience.cell",
    eyebrow: "read the chart",
    title: "Each cell is one pairing",
    body: "A cell is a scenario under one hydroclimate. Its color is the performance tier; the number inside, when shown, is the continuous tier value behind that color. The X axis is always climate. The Y axis depends on the layout you chose above.",
    placement: "right-start",
    illustration: "resilienceTierLegend",
  },
  {
    id: "resilience.step2.hoverClick",
    anchorId: "resilience.cell",
    eyebrow: "read the chart",
    title: "Hover and click wire back to the rest of the tool",
    body: "Hovering a cell highlights the matching row in the sidebar so you can trace it back to a scenario. Clicking a cell sends that outcome to the map when the map is open, so you can see where the tier is driven from geographically.",
    placement: "right-start",
  },
  {
    id: "resilience.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you across the other views. For high-stakes outcomes, the Leverage view under More analysis swaps the heatmap for a scatter that asks what is climate-driven versus operations-driven. When you are done here, circle back to the shortlist and keep refining.",
  },
]
