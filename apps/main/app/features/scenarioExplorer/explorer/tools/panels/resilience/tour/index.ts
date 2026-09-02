import type { TourModule } from "../../../tour/types"
import { RESILIENCE_TOUR } from "./steps"
import ResilienceTourEffects from "./ResilienceTourEffects"

const resilienceTourModule: TourModule = {
  steps: RESILIENCE_TOUR,
  EffectsComponent: ResilienceTourEffects,
}

export default resilienceTourModule

export { RESILIENCE_TOUR } from "./steps"
