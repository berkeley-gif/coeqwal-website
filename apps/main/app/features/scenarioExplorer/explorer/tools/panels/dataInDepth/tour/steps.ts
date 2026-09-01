/**
 * Data in Depth tour. Same rhythm as the list and radar tours: a short hero,
 * a "get oriented" card per region followed by that region's controls, a
 * "read the chart" section anchored to the figure, and a closing card that
 * points at the next step of the journey.
 *
 * Step copy is drafted from the tool's own behavior and is expected to be
 * replaced verbatim by the website-copy document's Data in Depth section.
 * Keep the ids and anchor ids stable when that swap happens: they are React
 * keys and sessionStorage payload bits.
 */

import type { TourStep } from "../../../tour/types"

export const DATA_TOUR: TourStep[] = [
  {
    id: "data.hero",
    eyebrow: "start here",
    title: "Data in Depth shows the numbers behind the outcomes",
    body: "Pick a variable, choose what to compare, and read one chart at a time. Every figure can be saved to your story together with the data behind it.",
  },

  // Orientation and controls for the left rail.
  {
    id: "data.step0.rail",
    anchorId: "data.rail",
    eyebrow: "get oriented",
    title: "Variables live in the left rail, grouped by sector",
    body: "Pick any variable to load its chart. Variables that feed a key outcome say so in a chip beside the chart title.",
    placement: "right",
  },

  // The shared toolbar above the tool.
  {
    id: "data.step0.viewArea",
    anchorId: "data.viewArea",
    eyebrow: "get oriented",
    title: "These controls set the data view",
    body: "This is the same toolbar as the other Explore tools. View by hydroclimate switches the climate future every chart on this page is computed under.",
    placement: "bottom-end",
  },

  // Arranging the chart.
  {
    id: "data.step1.compareBy",
    anchorId: "data.compareBy",
    eyebrow: "arrange the chart",
    title: "Choose one comparison axis",
    body: "Compare your selected scenarios, compare hydroclimates for a single scenario, or compare locations. Whichever you pick, the other dimensions are held constant by the selectors beside this control.",
    placement: "bottom-start",
  },
  {
    id: "data.step1.views",
    anchorId: "data.views",
    eyebrow: "arrange the chart",
    title: "Switch the view and the chart style",
    body: "Each variable offers the views that suit it, such as volume, percent of capacity, or level. The Exceedance, Box plot and Stats buttons restyle the annual distribution without changing the data.",
    placement: "bottom-start",
  },
  {
    id: "data.step1.wyt",
    anchorId: "data.wyt",
    eyebrow: "arrange the chart",
    title: "Filter by water-year type",
    body: "Narrow the years behind the chart to one Sacramento Valley index class, from Wet to Critical. All years is the default. The row is disabled for variables the filter cannot apply to.",
    placement: "bottom-start",
  },

  // Reading the figure.
  {
    id: "data.step2.chart",
    anchorId: "data.chart",
    eyebrow: "read the chart",
    title: "One interpretive figure at a time",
    body: "The sentence above the chart states the comparison in plain language, and the title names the variable, the location, the scenarios, the hydroclimate and the water years the figure covers.",
    placement: "left-start",
  },
  {
    id: "data.step2.save",
    anchorId: "data.saveSnapshot",
    eyebrow: "save your figure",
    titleIcon: "share",
    title: "Save snapshot",
    body: "Stage the chart you are looking at in the Share drawer, then open the Share tab to download the figure and the data behind it.",
    placement: "bottom-end",
  },
  {
    id: "data.step2.explainers",
    anchorId: "data.explainers",
    eyebrow: "read the chart",
    title: "What is this variable?",
    body: "Open the panels under the chart for a plain-language and a technical definition of the variable, and for how to read the chart style you are in.",
    placement: "top",
  },

  {
    id: "data.journey",
    eyebrow: "keep exploring",
    title: "Where to go from here",
    body: "Your scenario selection follows you across the Explore tools. Head to the Share tab when you are ready to assemble the figures you saved into a story.",
  },
]
