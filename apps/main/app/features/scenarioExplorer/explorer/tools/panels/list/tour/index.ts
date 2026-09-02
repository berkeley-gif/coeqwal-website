/**
 * List tour module. Plug-in entry consumed by `tour/registry.ts`.
 *
 * Two colocated hooks are not part of the module surface because they
 * need component-local state the runner doesn't have:
 *   - `useListInfoTooltipSync` needs `StrategyGrid`'s local tooltip
 *     state; the grid calls it directly.
 *   - `useListVisualizeRailSync` needs `ListView`'s ordered-scenario
 *     data (from an SWR-backed hook `ListTourEffects` shouldn't
 *     duplicate); `ListView` calls it directly.
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
