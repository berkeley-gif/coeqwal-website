/* Storyboard debug flag and diagnostic helpers. */

/** Single point of control for all `[DIAG S4/S5]` and equivalent
 *  storyboard-layer diagnostic logs. */
export const STORYBOARD_DEBUG = true

/** Log a formatted storyboard diagnostic. No-op when the debug flag
 *  is off. Centralized so call sites do not need a flag check. */
export function debugLog(label: string, ...rest: unknown[]): void {
  if (!STORYBOARD_DEBUG) return
  console.log(`[DIAG S4/S5] ${label}`, ...rest)
}

/** Snapshot the current Mapbox paint/filter/visibility state of
 *  `demand-units` and `demand-units-outline` at a labelled point.
 *  Returns immediately when the debug flag is off.
 *
 *  `map` is typed as `unknown` rather than a structural interface so
 *  callers do not need to narrow the full `mapbox-gl` `Map` type
 *  (which uses a strict keyof-PaintSpecification overload that does
 *  not assignable-down to a plain `(id: string, prop: string) =>
 *  unknown`). We duck-type inside the function. Diagnostic code
 *  only. Production behavior is always governed by
 *  `STORYBOARD_DEBUG`. */
export function logDuState(label: string, map: unknown): void {
  if (!STORYBOARD_DEBUG) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = map as any
    if (!m?.getLayer) {
      debugLog(`${label} <no map>`)
      return
    }
    const short = (v: unknown): string | undefined => {
      try {
        const s = JSON.stringify(v)
        return s && s.length > 80 ? s.slice(0, 80) + "..." : s
      } catch {
        return String(v)
      }
    }
    const fill = m.getLayer("demand-units")
      ? {
          opacity: short(m.getPaintProperty?.("demand-units", "fill-opacity")),
          opTrans: short(
            m.getPaintProperty?.("demand-units", "fill-opacity-transition"),
          ),
          colorTrans: short(
            m.getPaintProperty?.("demand-units", "fill-color-transition"),
          ),
          vis: m.getLayoutProperty?.("demand-units", "visibility"),
          filter: short(m.getFilter?.("demand-units")),
        }
      : "<no demand-units>"
    const outline = m.getLayer("demand-units-outline")
      ? {
          opacity: short(
            m.getPaintProperty?.("demand-units-outline", "line-opacity"),
          ),
          opTrans: short(
            m.getPaintProperty?.(
              "demand-units-outline",
              "line-opacity-transition",
            ),
          ),
          width: short(
            m.getPaintProperty?.("demand-units-outline", "line-width"),
          ),
          vis: m.getLayoutProperty?.("demand-units-outline", "visibility"),
          filter: short(m.getFilter?.("demand-units-outline")),
        }
      : "<no demand-units-outline>"
    debugLog(label, { fill, outline })
  } catch (e) {
    debugLog(`${label} <error>`, e)
  }
}
