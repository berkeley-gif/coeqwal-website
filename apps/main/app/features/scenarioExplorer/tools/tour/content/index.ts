import type { TourStep, TourTool } from "../types"
import { LIST_TOUR } from "../../panels/list/listTour"
import { RADAR_TOUR } from "../../panels/radar/radarTour"

export const TOUR_STEPS: Record<TourTool, TourStep[]> = {
  list: LIST_TOUR,
  radar: RADAR_TOUR,
}

export { LIST_TOUR, RADAR_TOUR }
