import type { TourTool } from "./registry"

function storageKey(tool: TourTool) {
  return `coeqwal-tour-seen-${tool}`
}

export function hasSeenTour(tool: TourTool): boolean {
  if (typeof window === "undefined") return true
  return window.localStorage.getItem(storageKey(tool)) === "true"
}

export function markTourSeen(tool: TourTool): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey(tool), "true")
}
