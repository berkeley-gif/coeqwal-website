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
 * Anchor ids resolve into ResiliencePanel (cell + corner controls),
 * ResilienceControls (the one-sentence pivot / outcomes / encoding
 * phrase buttons, preset rows, and row options), the shared
 * ToolToolbar map strip (resilience.viewArea; no global hydroclimate
 * chooser), and ScenarioExplorer (the chart toolbar wrapper + save snapshot).
 */

import type { TourStep } from "../types"

export const RESILIENCE_TOUR: TourStep[] = [
  {
    id: "resilience.hero",
    eyebrow: "start here",
    title: "Revealing climate stress",
    body: "Each selected scenario is viewed as a grid of colored cells, one cell for each outcome and hydroclimate pairing, shaded by how that pairing performs. You can choose any pairwise combination of scenarios, outcomes, and hydroclimates to lay out the chart, with the third dimension splitting the view into small multiples. If no scenarios are selected, the chart falls back to an aggregate overview of the whole library, so the view is never blank.",
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
    body: "Show map matches the other tools: turn it on to send an outcome to the map when you click a cell. Which hydroclimate columns appear on the heatmap is chosen in the chart controls, not in this row.",
    placement: "bottom-end",
  },

  // Orientation for the chart-side controls.
  {
    id: "resilience.step0.chartToolbar",
    anchorId: "resilience.chartToolbar",
    eyebrow: "get oriented",
    title: "These controls configure the chart",
    body: "The row above the chart is resilience-specific. The sentence reshapes the chart one phrase at a time. Presets jump to common layouts. Save snapshot stages what you see in the Share drawer. The next steps walk through each one.",
    placement: "bottom-start",
  },

  // Arrange the chart: the three phrase buttons in the sentence, then
  // the preset menu and snapshot.
  {
    id: "resilience.step1.pivot",
    anchorId: "resilience.pivot",
    eyebrow: "arrange the chart",
    title: "Pick which dimension the chart is built around",
    body: "This third phrase picks the dimension the chart is arranged around, and whether the chart shows it as small multiples (one tile per scenario, outcome, or hydroclimate) or a single averaged chart (the dimension is meaned away). This is the biggest lever on what question the chart answers.",
    placement: "bottom-start",
  },
  {
    id: "resilience.step1.axes",
    anchorId: "resilience.axes",
    eyebrow: "arrange the chart",
    title: "Pick what is inside each chart",
    body: "Whichever two dimensions you didn't pick for the third phrase become the rows and columns inside each chart. Click across or down to rotate which dimension reads along that axis. Use Switch rows and columns in the Rows row of the chart controls when you want the axes flipped.",
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
    id: "resilience.step1.snapshot",
    anchorId: "resilience.snapshot",
    eyebrow: "arrange the chart",
    title: "Save snapshot",
    titleIcon: "share",
    body: "Save snapshot stages the chart and its underlying data in the Share drawer, the same way capture view does in Radar. Find it in the Share tab when you are ready to export.",
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
    id: "resilience.step2.cornerControls",
    anchorId: "resilience.cornerControls",
    eyebrow: "read the chart",
    title: "Fine-tune what the cells show",
    body: "The top-right toolbar on the chart toggles numeric cell values. In the chart controls, the Rows row clusters similar scenarios and has Switch rows and columns.",
    placement: "bottom-end",
  },

  {
    id: "resilience.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you across the other views. For high-stakes outcomes, the Leverage view under More analysis swaps the heatmap for a scatter that asks what is climate-driven versus operations-driven. When you are done here, circle back to the shortlist and keep refining.",
  },
]
