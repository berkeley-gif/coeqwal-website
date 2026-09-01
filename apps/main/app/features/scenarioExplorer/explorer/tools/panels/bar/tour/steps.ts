import type { TourStep } from "../../../tour/types"

export const BAR_TOUR: TourStep[] = [
  {
    id: "bar.hero", // edit this
    eyebrow: "start here",
    title: "Start here",
    body: "If this is your first time using the Explore Tool, we recommend visiting the Get Started section of the site before beginning your exploration.",
  },
  {
    id: "bar.step0.glyph", // edit this
    anchorId: "bar.outcome.glyph", // edit this
    eyebrow: "bar chart",
    title: "The bar tool displays outcomes for selected scenarios as bar charts",
    body: "The row of bar charts shows scenario results for nine different key outcomes.",
    placement: "right", // edit this
  },
  {
    id: "bar.step0.info", // edit this
    anchorId: "bar.outcome.infoButton", //edit this 
    eyebrow: "bar chart",
    title: "Each bar chart displays the results for a key outcome",
    body: "The colors of the bar chart correspond to optimal (green), acceptable (blue), at-risk (orange), and critical (red). The length of each color bar indicates how many locations fall into that category.",
    placement: "bottom", // edit this
  },
  {
    id: "bar.step0.sort", // edit this
    anchorId: "bar.outcome.sortButton", // edit this  
    eyebrow: "key outcomes",
    title: "Scenario results are summarized by nine key outcomes",
    body: "To understand how each key outcome is defined and categorized, click on the {{infoIcon}}.",
    placement: "bottom", // edit this
  },
  {
    id: "bar.journey", // edit this
    anchorId: "", // edit this
    eyebrow: "sort scenarios",
    title: "Scenarios can be sorted by key outcome values",
    body: "Use the sort button to order scenarios by the average values of each key outcome, ordering from high to low or low to high.",
    placement: "", // edit this
  },
  {
    id: "", // edit this
    anchorId: "", // edit this
    eyebrow: "hydroclimates",
    title: "Scenario outcomes change with climate stress",
    body: "Click on the hydroclimate icons to see outcomes change with different levels of climate stress.",
    placement: "", // edit this
  },
  {
    id: "", // edit this
    anchorId: "", // edit this
    eyebrow: "map view",
    title: "The locations of key outcomes can be viewed on a map",
    body: "Open the map and click on a bar chart to see how outcomes vary across individual locations.",
    placement: "", // edit this
  },
  {
    id: "", // edit this
    anchorId: "", // edit this
    eyebrow: "pin a scenario",
    title: "Pin a set of bar charts from a scenario to enable comparison with other scenarios",
    body: "Click on the pin to fix the bar charts from a selected scenario to the top of the screen.",
    placement: "", // edit this
  },
  {
    id: "", // edit this
    anchorId: "", // edit this
    eyebrow: "save this chart",
    title: "", // the text has the text below as title but probably is body text. Make up title I guess?
    body: "Click the share icon to export the bar charts to the SHARE folder. All shared items will be saved here to revisit later.",
    placement: "", // edit this
  },
  {
    id: "", // edit this
    anchorId: "", // edit this
    eyebrow: "explore other views",
    title: "Select other tools to view scenario results in differ ways",
    body: "Use the links above to go to the next tool when you are ready. Your shortlist of scenarios stays with you.",
    placement: "", // edit this
  },
]
