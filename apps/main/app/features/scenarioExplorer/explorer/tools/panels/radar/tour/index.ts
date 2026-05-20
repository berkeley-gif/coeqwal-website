/**
 * Radar tour module. Plug-in entry consumed by `tour/registry.ts`.
 *
 * The colocated `useRadarInfoIconSync` hook is not part of the module
 * surface because it needs `RadarPanel`'s local `openInfoAxis` state;
 * the panel calls it directly. `RadarTourAnchor` is exported for
 * `RadarChartControls`.
 */

import type { TourModule } from "../../../tour/types"
import { RADAR_TOUR } from "./steps"
import RadarTourEffects from "./RadarTourEffects"

const radarTourModule: TourModule = {
  steps: RADAR_TOUR,
  EffectsComponent: RadarTourEffects,
}

export default radarTourModule

export { RADAR_TOUR } from "./steps"
export { useRadarInfoIconSync } from "./useRadarInfoIconSync"
export { RadarTourAnchor } from "./RadarTourAnchor"
