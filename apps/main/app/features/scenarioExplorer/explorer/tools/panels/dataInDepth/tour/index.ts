/**
 * Data in Depth tour module. Plug-in entry consumed by
 * `tour/toolToTourMap.ts`.
 */

import type { TourModule } from "../../../tour/types"
import { DATA_TOUR } from "./steps"
import DataTourEffects from "./DataTourEffects"

const dataTourModule: TourModule = {
  steps: DATA_TOUR,
  EffectsComponent: DataTourEffects,
}

export default dataTourModule

export { DATA_TOUR } from "./steps"
