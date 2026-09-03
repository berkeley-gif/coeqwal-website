import type { TourStep } from "../../../tour/types"

export const EQUITY_TOUR: TourStep[] = [
  {
    id: "equity.step0.start",
    eyebrow: "start here",
    title:
      "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },
  {
    id: "equity.step1.distributionView",
    eyebrow: "distribution view",
    title:
      "The Distribution view displays scenario results for individual locations of interest.",
  },
  {
    id: "equity.step2.outcomeColumn",
    anchorId: "equity.grid.outcomeColumn",
    eyebrow: "outcomes by location",
    title: "Scenario results differ by locations within key outcomes",
    body: "The chart displays the outcome levels (optimal, acceptable, at-risk, critical) for different locations associated with each key outcome. Some key outcomes have many locations, while others have only one.",
    placement: "right",
  },
  {
    id: "equity.step3.chartControls",
    anchorId: "equity.controls.chartControlsBar",
    eyebrow: "chart controls",
    title: "These controls configure the chart.",
    body: "Click on the buttons to change how data on the tier grid is displayed.",
    placement: "bottom",
  },
  {
    id: "equity.step4.toggleOutcomes",
    anchorId: "equity.controls.toggleOutcomes",
    eyebrow: "display outcomes",
    title: "Change the key outcomes that are displayed.",
    body: "Click on Toggle Outcomes button to display a subset of the nine key outcomes.",
    placement: "bottom-start",
  },
  {
    id: "equity.step5.compare",
    anchorId: "equity.controls.compareToBaseline",
    eyebrow: "compare to baselines",
    title: "Compare selected scenario to current operations",
    body: "Click on Compare to Baselines to see how the results for a selected scenario compare to the current operations (baseline) scenario. The chart indicates which locations move to higher or lower outcome levels, and which stay the same.",
    placement: "bottom-start",
  },
  {
    id: "equity.step6.continuous",
    anchorId: "equity.controls.continuousLevels",
    eyebrow: "view continuous levels",
    title: "View the outcome levels as continuous data.",
    body: "Click on Continuous Levels to see how results vary within outcome level categories: Optimal (1.0 - 1.99), Acceptable (2.0 - 2.99), At-risk (3.0 - 3.99), and Critical (4.0 - 4.99). The button can be used with Compare to Baselines to gain a better understanding of how the outcomes at different locations changed.",
    placement: "bottom-start",
  },
  {
    id: "equity.step7.snapshot",
    anchorId: "equity.controls.saveSnapshot",
    eyebrow: "save snapshot",
    titleIcon: "share",
    title: "Save one or more distribution plots using this button.",
    body: "Click the save snapshot button to export the chart to the SHARE folder. All shared items will be saved here to revisit later.",
    placement: "bottom-end",
  },
  {
    id: "equity.step8.hydroclimate",
    anchorId: "radar.climateChips",
    eyebrow: "hydroclimates",
    title: "Scenario outcomes change with climate stress.",
    body: "Click on the hydroclimate icons to see outcomes change with different levels of climate stress.",
    placement: "bottom",
  },
  {
    id: "equity.step9.showMap",
    anchorId: "toolbar.showMap",
    eyebrow: "map view",
    title: "The locations of key outcomes can be viewed on a map.",
    body: "Open the map and click on a key outcome or individual location. Select a single location from the distribution chart or map to determine its identity.",
    placement: "bottom",
  },
  {
    id: "equity.step10.journey",
    eyebrow: "explore other views",
    title: "Select other tools to view scenario results in different ways.",
    body: "Use the links above to go to the next tool when you are ready. Your shortlist of scenarios stays with you.",
  },
]
