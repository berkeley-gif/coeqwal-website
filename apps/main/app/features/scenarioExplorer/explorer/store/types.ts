export type ExploreMode =
  | "list"
  | "bar"
  | "radar"
  | "equity"
  | "resilience"
  | "data"

export type OutcomeDisplayMode = "average" | "bar" | "distribution"

export type { TourTool } from "../tools/tour/registry"
export type { ShareItem, ShareItemPatch } from "../share/types"
