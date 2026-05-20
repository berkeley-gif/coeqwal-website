/**
 * registry.ts - Tour registry. Organizes the *set* of tour-enabled
 * tools.
 *
 * This file is intentionally hook- and React-free so it can be imported
 * from the explorer store (`workspaceStoreSlice`, `exploreSessionPersist`)
 * without dragging panel modules into the store's load tree.
 *
 * The actual `TourModule` map lives in
 * [`toolToTourMap.ts`](./toolToTourMap.ts) and is consumed only by the
 * runtime UI (`runner/ToolTour.tsx`, `runner/TakeTheTourButton.tsx`).
 * The two files are kept in sync by `Record<TourTool, TourModule>`
 * typing on `TOUR_MODULES`.
 *
 * Adding a tour for a new tool: append the tool id to `TOUR_TOOLS`
 * here, then add the matching entry to `TOUR_MODULES` in
 * `toolToTourMap.ts`. TypeScript will fail the build if the two go
 * out of sync.
 *
 * See `README.md` for the full how-to.
 */

export const TOUR_TOOLS = ["list", "radar"] as const

export type TourTool = (typeof TOUR_TOOLS)[number]

export function hasTourFor(mode: string): mode is TourTool {
  return (TOUR_TOOLS as readonly string[]).includes(mode)
}
