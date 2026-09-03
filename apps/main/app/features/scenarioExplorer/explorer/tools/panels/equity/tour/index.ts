/**
 * Equity tour module. Plug-in entry consumed by `tour/registry.ts`.
 */

import type { TourModule } from "../../../tour/types"
import { EQUITY_TOUR } from "./steps"
import EquityTourEffects from "./EquityTourEffects"

const equityTourModule: TourModule = {
  steps: EQUITY_TOUR,
  EffectsComponent: EquityTourEffects,
}

export default equityTourModule

export { EQUITY_TOUR } from "./steps"
export { useEquityOutcomeColumnSync } from "./useEquityOutcomeColumnSync"
