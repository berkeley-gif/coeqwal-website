/**
 * Radar tour. Full port of RadarHowToRead.tsx callouts plus hero and
 * journey-strip bookends. Anchor ids map into RadarPanel and its
 * supporting controls.
 */

import type { TourStep } from "../types"

export const RADAR_TOUR: TourStep[] = [
  {
    id: "radar.hero",
    eyebrow: "THE RADAR VIEW",
    title: "Read a shortlist as shapes, not isolated cells.",
    body: "Radar is where the shortlist stops behaving like a spreadsheet. Each selected scenario becomes a polygon across the outcomes you chose, so trade-offs appear as shape, balance, and deformation instead of as row-by-row arithmetic.",
  },
  {
    id: "radar.step1.polygon",
    anchorId: "radar.polygon",
    eyebrow: "STEP 1 - READ THE POLYGON",
    title: "Each polygon is one selected scenario",
    body: "Carry your shortlist over from the list view so the shapes you see here belong to rows you already trust.",
    placement: "right",
  },
  {
    id: "radar.step1.rings",
    anchorId: "radar.rings",
    eyebrow: "STEP 1 - READ THE POLYGON",
    title: "Tier rings keep the read grounded",
    body: "A shape that stays inside the inner rings is performing well across more outcomes.",
    placement: "right",
  },
  {
    id: "radar.step1.libraryRange",
    anchorId: "radar.libraryRange",
    eyebrow: "STEP 1 - READ THE POLYGON",
    title: "The library range is your context band",
    body: "If a polygon pushes outside the envelope on an axis, it is doing something the broader library rarely does.",
    placement: "top",
  },
  {
    id: "radar.step1.climateChips",
    anchorId: "radar.climateChips",
    eyebrow: "STEP 1 - READ THE POLYGON",
    title: "Hydroclimate changes the shape",
    body: "Switch climates and watch each polygon contract or stretch. That is climate exposure made legible.",
    placement: "bottom",
  },
  {
    id: "radar.step2.axisChooser",
    anchorId: "radar.axisChooser",
    eyebrow: "STEP 2 - TUNE THE AXES",
    title: "Choose outcome axes before you compare",
    body: "Three to eight axes keeps the chart readable and tuned to the question in front of you.",
    placement: "bottom",
  },
  {
    id: "radar.step2.axisLabel",
    anchorId: "radar.axisLabel",
    eyebrow: "STEP 2 - TUNE THE AXES",
    title: "Axis labels open a scenario slice",
    body: "Click an axis to rank the selected scenarios along that one outcome and understand what the polygon is summarizing.",
    placement: "left",
  },
  {
    id: "radar.step2.infoIcon",
    anchorId: "radar.infoIcon",
    eyebrow: "STEP 2 - TUNE THE AXES",
    title: "The info icon opens the definition",
    body: "Use it when an outcome name is familiar enough to recognize but too compressed to interpret with confidence.",
    placement: "left",
  },
  {
    id: "radar.step2.climateChips",
    anchorId: "radar.climateChips",
    eyebrow: "STEP 2 - TUNE THE AXES",
    title: "Climate chips let you compare the same shape across futures",
    body: "Historical, cc50, and cc95 are not separate charts. They are separate conditions for the same shortlist.",
    placement: "bottom",
  },
  {
    id: "radar.journey",
    eyebrow: "NEXT STEP",
    title: "What the radar cannot tell you on its own",
    body: "Distribution inspects the spread across locations hidden inside each vertex mean. Resilience takes the same shortlist into a climate-by-outcome matrix and tests what holds.",
  },
]
