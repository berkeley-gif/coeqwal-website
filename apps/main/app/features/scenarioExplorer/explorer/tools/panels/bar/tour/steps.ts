import type { TourStep } from "../../../tour/types"

export const BAR_TOUR: TourStep[] = [
  {
    id: "bar.hero",
    eyebrow: "start here",
    title: "The Bar view reads your shortlist outcome by outcome",
    body: "Each column is one outcome, each row is one scenario. Compare a single outcome down a column, or read across a row to see how one scenario performs everywhere.",
  },
  {
    id: "bar.step0.glyph",
    anchorId: "bar.outcome.glyph",
    eyebrow: "read the outcomes",
    title: "Each bar shows the tier breakdown for one outcome",
    body: "Longer bars mean a larger share of the locations falls into that tier. Read across a row to compare one scenario across outcomes, or down a column to compare scenarios on the same outcome.",
    placement: "right",
  },
  {
    id: "bar.step0.info",
    anchorId: "bar.outcome.infoButton",
    eyebrow: "read the outcomes",
    title: "Outcome summary",
    body: "Click the {{infoIcon}} when you need a reminder of what the outcome measures.",
    placement: "bottom",
  },
  {
    id: "bar.step0.sort",
    anchorId: "bar.outcome.sortButton",
    eyebrow: "read the outcomes",
    title: "Sorting ranks rows by average",
    body: "Use the sort button to rank scenarios by average outcome, then reverse the order to inspect the other end of the library.",
    placement: "bottom",
  },
  {
    id: "bar.journey",
    eyebrow: "take your shortlist forward",
    title: "What to do after this chart",
    body: "Your shortlist stays with you in the other views. Use the links above to go to the next tool when you are ready.",
  },
]
