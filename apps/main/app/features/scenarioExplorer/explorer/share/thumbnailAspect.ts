/**
 * thumbnailAspect - the aspect ratio a share card's thumbnail box takes, so
 * the captured chart fills it edge to edge instead of being letterboxed in a
 * square. Derived from the same capture dimensions the off-screen host
 * rendered the chart at. Pure.
 */

import { CAPTURE_DIMENSIONS } from "./capture/dimensions"
import { svgIntrinsicSize } from "./svgIntrinsicSize"
import type { ShareItem } from "./types"

/** Width over height of the item's captured chart; 1 when unknown. */
export function thumbnailAspectRatioFor(item: ShareItem): number {
  // The captured SVG knows its own shape; trust it first. Content-aware
  // captures (the resilience small-multiples panel) are taller than the
  // static capture dimensions, and a fixed-ratio box letterboxes them.
  if (item.cachedSvg) {
    const size = svgIntrinsicSize(item.cachedSvg)
    if (size) return size.width / size.height
  }
  if (item.type === "data") {
    return CAPTURE_DIMENSIONS.data.width / CAPTURE_DIMENSIONS.data.height
  }
  if (item.type === "equity") {
    return CAPTURE_DIMENSIONS.equity.width / CAPTURE_DIMENSIONS.equity.height
  }
  if (item.type === "resilience") {
    const scope = (item as { tileScope?: string }).tileScope ?? "panel"
    const size =
      scope === "panel"
        ? CAPTURE_DIMENSIONS.resiliencePanel
        : CAPTURE_DIMENSIONS.resilienceTile
    return size.width / size.height
  }
  return 1
}
