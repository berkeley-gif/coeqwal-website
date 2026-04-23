import type { TourStep, TourTool } from "../types"
import { LIST_TOUR } from "./listTour"
import { RADAR_TOUR } from "./radarTour"
import { RESILIENCE_TOUR } from "./resilienceTour"

export const TOUR_STEPS: Record<TourTool, TourStep[]> = {
  list: LIST_TOUR,
  radar: RADAR_TOUR,
  resilience: RESILIENCE_TOUR,
}

export { LIST_TOUR, RADAR_TOUR, RESILIENCE_TOUR }
