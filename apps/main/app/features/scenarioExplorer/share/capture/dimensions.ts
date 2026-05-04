/**
 * Capture dimensions per share variant.
 *
 * Every off-screen capture adapter and every download path that
 * rasterizes a `cachedSvg` reads its size from this module. Bumping
 * a number here propagates to both the captured SVG and the
 * downloaded PNG so they cannot drift.
 *
 * When adding a new variant:
 *   1. Add an entry below.
 *   2. Use `CAPTURE_DIMENSIONS["yourKey"]` in the
 *      `Offscreen<Variant>Capture.tsx` adapter.
 *   3. Update the `ShareItem["type"] → key` mapping in
 *      `share/Share.tsx` so PNG downloads pick up the new size.
 */

export interface CaptureSize {
  readonly width: number
  readonly height: number
}

export const CAPTURE_DIMENSIONS = {
  radar: { width: 600, height: 600 },
  equity: { width: 900, height: 600 },
  resilienceTile: { width: 800, height: 520 },
  resiliencePanel: { width: 1200, height: 800 },
  quadrant: { width: 800, height: 600 },
  barChartRow: { width: 720, height: 80 },
} as const satisfies Record<string, CaptureSize>

export type CaptureDimensionKey = keyof typeof CAPTURE_DIMENSIONS
