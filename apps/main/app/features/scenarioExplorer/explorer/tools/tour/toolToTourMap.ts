/**
 * Map from tool id to its TourModule (steps + effects + illustrations).
 *
 * The string-only registry lives in [`registry.ts`](./registry.ts);
 * import from there for `TourTool` / `hasTourFor` / `TOUR_TOOLS`. This
 * file pulls panel modules (which carry React components), so do NOT
 * import it from the explorer store or any other module that should
 * remain hook-free.
 *
 * The `Record<TourTool, TourModule>` typing keeps this map in sync
 * with `TOUR_TOOLS`. TypeScript fails the build if a tool is added to
 * one and not the other.
 */

import listTour from "../panels/list/tour"
import radarTour from "../panels/radar/tour"
import type { TourTool } from "./registry"
import type { TourModule } from "./types"

export const TOUR_MODULES: Record<TourTool, TourModule> = {
  list: listTour,
  radar: radarTour,
}
