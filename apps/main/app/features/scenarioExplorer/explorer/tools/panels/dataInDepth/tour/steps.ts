/**
 * Data in Depth tour. Step copy mirrors the website-copy document's
 * "Data In Depth Tour" script: two centered intro cards, the variables
 * rail, the variable explainers, the compare-by control, and the three
 * per-axis selector steps (the effects component switches the compare
 * axis so each selector is on screen while its step is active). The
 * remaining steps cover controls the script does not mention (shared
 * toolbar, view tabs, water-year filter, the figure, Save snapshot, the
 * closing journey card) and keep their drafted copy.
 *
 * Keep the ids and anchor ids stable: they are React keys and
 * sessionStorage payload bits.
 */

import type { TourStep } from "../../../tour/types"

export const DATA_TOUR: TourStep[] = [
  {
    id: "data.hero",
    eyebrow: "start here",
    title:
      "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },
  {
    id: "data.intro",
    eyebrow: "data in depth",
    title:
      "The Data in Depth tool can be used to explore additional scenario outcomes variables.",
  },

  {
    id: "data.step0.rail",
    anchorId: "data.rail",
    eyebrow: "variables",
    title: "Select a variable.",
    body: "Select a single variable from the list to evaluate. Data for that variable will be plotted for up to six selected scenarios and for the selected hydroclimate.",
    placement: "right",
  },
  {
    id: "data.step2.explainers",
    anchorId: "data.explainers",
    eyebrow: "what is this variable?",
    title: "Open this tab for a description of the variable.",
    body: "There is a general description and technical definition of each variable.",
    placement: "top",
  },

  // Arranging the chart: the comparison axis and its per-axis selectors.
  {
    id: "data.step1.compareBy",
    anchorId: "data.compareBy",
    eyebrow: "compare by",
    title:
      "Compare variable values by scenario, by hydroclimate, or by location",
    body: "Determine how the variables should be displayed on the plot.",
    placement: "bottom-start",
  },
  {
    id: "data.step1.selectLocation",
    anchorId: "data.locationPin",
    eyebrow: "select location",
    title:
      "Display how the variable differs across scenarios at a specific location",
    body: 'When "Compare by scenarios" is selected, choose which locations to compare variable values.',
    placement: "bottom-start",
  },
  {
    id: "data.step1.selectScenarioLocation",
    anchorId: "data.heldPins",
    eyebrow: "select scenario and location",
    title: "Display how the variable changes across hydroclimates",
    body: 'When "Compare by hydroclimates" is selected, choose which scenario and location to compare variable values.',
    placement: "bottom-start",
  },
  {
    id: "data.step1.selectLocations",
    anchorId: "data.locationMembers",
    eyebrow: "select locations",
    title: "Display how the variable changes across locations",
    body: 'When "Compare by Locations" is selected, choose which location to display.',
    placement: "bottom-start",
  },

  // The shared toolbar above the tool.
  {
    id: "data.step0.viewArea",
    anchorId: "data.viewArea",
    eyebrow: "get oriented",
    title: "These controls set the data view",
    body: "This is the same toolbar as the other Explore tools. View by hydroclimate switches the hydroclimate every chart on this page is computed under.",
    placement: "bottom-end",
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
    id: "data.journey",
    eyebrow: "keep exploring",
    title: "Where to go from here",
    body: "Your scenario selection follows you across the Explore tools. Head to the Share tab when you are ready to assemble the figures you saved into a story.",
  },
]
