/**
 * Public barrel for the tour subsystem.
 *
 * See `README.md` for the directory layout, runtime flow, and the
 * recipe for adding a tour to a new tool.
 */

export type {
  TourStep,
  TourPlacement,
  TourModule,
  TourEffectsProps,
  AnchorResolver,
} from "./types"

export { TOUR_TOOLS, hasTourFor, type TourTool } from "./registry"
export { TOUR_MODULES } from "./toolToTourMap"

export {
  TourAnchorProvider,
  useTourAnchor,
  useTourAnchorResolver,
} from "./anchors/TourAnchorContext"
export { InlineTourAnchor } from "./anchors/InlineTourAnchor"

export { default as TourTierLegend } from "./reusableContent/TourTierLegend"

export { default as ToolTour } from "./runner/ToolTour"
export { default as TakeTheTourButton } from "./runner/TakeTheTourButton"
