export type ExploreMode =
  | "list"
  | "bar"
  | "radar"
  | "equity"
  | "resilience"
  | "data"

/**
 * Whether a tool pairs with the map panel. Data in depth deliberately has
 * NO map: its charts need the full width and the tool already carries dense
 * controls, so the "Show map" toggle is hidden there and the shared `showMap`
 * flag is ignored while the tool is active (it still applies to the other
 * tools, so the user's toggle survives a visit to Data in depth).
 */
export function isMapPairedMode(mode: ExploreMode): boolean {
  return mode !== "data"
}

export type OutcomeDisplayMode = "average" | "bar" | "distribution"

export type { TourTool } from "../tools/tour/registry"
export type { ShareItem, ShareItemPatch } from "../share/types"
