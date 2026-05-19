/* CameraArbiter
 *
 * Owns the "return map to the storyboard home view" invariant shared by
 * `goTo({ viaCamera: true })`, `handleBack`, and `handleRestart`. Before
 * this arbiter existed, all three sites inlined the same easeTo +
 * threshold-check + moveend-continuation pattern, which made small
 * behavioral drift (different durations, missing reset of bearing/pitch,
 * missing guards) very easy to introduce.
 *
 * Note: despite the "Arbiter" name (from the hardening plan), this
 * module is not a progress-driven `Arbiter<A>`. It has no actors and is
 * never called during engine dispatch. It is an imperative helper held
 * in a ref on the storyboard container. Nav handlers call
 * `cameraArbiter.flyHome(...)` directly. The name is kept to match the
 * architecture diagram and to signal that all camera-home writes go
 * through this one object.
 */

/** Minimal Mapbox map shape we use here. Mirrors the shape used by
 *  MapPaintArbiter. We avoid importing mapbox-gl types directly to keep
 *  this module framework-agnostic. */
type CameraMap = {
  getCenter: () => { lng: number; lat: number }
  getZoom: () => number
  once: (event: string, cb: () => void) => void
  easeTo: (opts: {
    center: { lng: number; lat: number } | [number, number]
    zoom: number
    bearing?: number
    pitch?: number
    duration: number
  }) => void
}

export interface CameraHome {
  center: [number, number]
  zoom: number
}

export interface FlyHomeOpts {
  /** Duration (ms) of the easeTo. Default 800. */
  duration?: number
  /** When true, the easeTo also sets bearing=0 and pitch=0. Used by
   *  Restart. Does not affect the "already home" threshold check - if
   *  center+zoom are already home, no flight runs and the current
   *  bearing/pitch are preserved. This mirrors the pre-refactor
   *  behavior of `handleRestart`. */
  resetOrientation?: boolean
  /** Fires when a flight actually starts (not called when the map is
   *  already home or `map` is null). Use this to flip play-state into
   *  "playing" for the duration of the flight. */
  onStart?: () => void
  /** Fires after the flight's `moveend`, or synchronously if no flight
   *  was needed (already home, or map is null). Callers can rely on
   *  this firing exactly once per `flyHome` call. */
  onArrive?: () => void
}

export class CameraArbiter {
  constructor(private readonly home: CameraHome) {}

  /** Threshold check against home center+zoom. Thresholds match the
   *  pre-refactor inlined checks exactly: 0.01 deg on lng/lat, 0.05 on
   *  zoom. Does NOT consider bearing or pitch. */
  isHome(map: CameraMap): boolean {
    const c = map.getCenter()
    return (
      Math.abs(c.lng - this.home.center[0]) <= 0.01 &&
      Math.abs(c.lat - this.home.center[1]) <= 0.01 &&
      Math.abs(map.getZoom() - this.home.zoom) <= 0.05
    )
  }

  /** Ease the map back to home. If the map is null or already at home,
   *  `onArrive` fires synchronously and no flight runs. Otherwise,
   *  `onStart` fires, an easeTo is dispatched, and `onArrive` is wired
   *  to the next `moveend`. */
  flyHome(map: CameraMap | null | undefined, opts: FlyHomeOpts = {}): void {
    const { duration = 800, resetOrientation = false, onStart, onArrive } = opts

    if (!map || this.isHome(map)) {
      onArrive?.()
      return
    }

    if (onArrive) map.once("moveend", onArrive)
    onStart?.()
    map.easeTo({
      center: { lng: this.home.center[0], lat: this.home.center[1] },
      zoom: this.home.zoom,
      ...(resetOrientation ? { bearing: 0, pitch: 0 } : {}),
      duration,
    })
  }
}
