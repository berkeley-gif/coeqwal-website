import type { TourModule } from "../../../tour/types"
import { BAR_TOUR } from "./steps"
import BarTourEffects from "./BarTourEffects"

const barTourModule: TourModule = {
  steps: BAR_TOUR,
  EffectsComponent: BarTourEffects,
}

export default barTourModule

export { BAR_TOUR } from "./steps"
