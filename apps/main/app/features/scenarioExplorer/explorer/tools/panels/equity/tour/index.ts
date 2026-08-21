/**
 * Equity tour module. Plug-in entry consumed by `tour/registry.ts`.
 */

import type { TourModule } from "../../../tour/types"
import { EQUITY_TOUR } from "./steps"

const equityTourModule: TourModule = {
  steps: EQUITY_TOUR,
}

export default equityTourModule

export { EQUITY_TOUR } from "./steps"
