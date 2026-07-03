/**
 * List tour module. Plug-in entry consumed by `tour/registry.ts`.
 *
 * The colocated `useListInfoTooltipSync` hook is not part of the module
 * surface because it needs `StrategyGrid`'s local tooltip state. The
 * grid calls it directly.
 */

import type { TourModule } from "../../../tour/types"
import { LIST_TOUR } from "./steps"
import ListTourEffects from "./ListTourEffects"
import { LIST_TOUR_ILLUSTRATIONS } from "./illustrations"

const listTourModule: TourModule = {
  steps: LIST_TOUR,
  EffectsComponent: ListTourEffects,
  illustrations: LIST_TOUR_ILLUSTRATIONS,
}

export default listTourModule

export { LIST_TOUR } from "./steps"
export { useListInfoTooltipSync } from "./useListInfoTooltipSync"
