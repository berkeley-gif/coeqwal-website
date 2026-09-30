import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { test, expect } from "@playwright/test"
import {
  comparisonDirection,
  getPointMarkerShape,
  SQUARE_MARKER_RADIUS_PX,
} from "../app/features/map/config/markerShape"

// Every point location on the Explore maps is a square. Distribution's
// comparison mode keeps its direction triangles. The guard below fails if a
// diamond or circle marker style comes back in the files that draw markers.

const read = (rel: string) =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8")

test("point markers are squares unless a comparison direction applies", () => {
  expect(getPointMarkerShape()).toBe("square")
  expect(getPointMarkerShape("unchanged")).toBe("square")
  expect(getPointMarkerShape("improved")).toBe("triangleUp")
  expect(getPointMarkerShape("worsened")).toBe("triangleDown")
  expect(SQUARE_MARKER_RADIUS_PX).toBeGreaterThanOrEqual(0)
  expect(SQUARE_MARKER_RADIUS_PX).toBeLessThanOrEqual(3)
})

test("comparison direction: tier 1 is best, so a lower tier improved", () => {
  expect(comparisonDirection(1, 2)).toBe("improved")
  expect(comparisonDirection(3, 3)).toBe("unchanged")
  expect(comparisonDirection(4, 2)).toBe("worsened")
  expect(getPointMarkerShape(comparisonDirection(1, 3))).toBe("triangleUp")
  expect(getPointMarkerShape(comparisonDirection(3, 1))).toBe("triangleDown")
})

test("guard: no diamond or circle styles in the marker renderers", () => {
  const tierMarkers = read(
    "../app/features/map/visualizationLayers/components/TierMarkers.tsx",
  )
  expect(tierMarkers).not.toContain("rotate(45deg)")
  expect(tierMarkers).not.toContain("isDiamond")
  expect(tierMarkers).not.toContain("borderRadius.circle")
  // Any 50% radius, in any quote style, would draw a circle.
  expect(tierMarkers).not.toMatch(/50%/)
  // The visible square is small; a larger transparent hit area around it
  // keeps hover and click as easy to reach as the old, taller diamond.
  expect(tierMarkers).toContain("data-marker-hit")

  const equity = read(
    "../app/features/scenarioExplorer/explorer/tools/panels/equity/EquityPanel.tsx",
  )
  expect(equity).not.toContain('borderRadius: "50%"')

  const layout = read(
    "../app/features/scenarioExplorer/explorer/tools/chrome/layout/UnifiedToolView.tsx",
  )
  expect(layout).not.toContain('borderRadius: "50%"')

  // The renderers take their shape from the one rule and label it, so a
  // DOM check can find the actual shape element.
  expect(tierMarkers).toContain("getPointMarkerShape(")
  expect(tierMarkers).toContain("data-marker-shape")
  expect(equity).toContain("getPointMarkerShape(")
  // Selected tier first, baseline second: reversing them would swap the
  // improved and worsened triangles while every other test stayed green.
  expect(equity).toMatch(
    /comparisonDirection\(\s*parseInt\(obj\.tier\.replace[^)]*\)\),\s*parseInt\(obj\.baselineTier\./,
  )
  expect(equity).toContain("data-marker-shape")
})
