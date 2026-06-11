/* CameraArbiter
 *
 * Returns the map to the storyboard home view. Shared by
 * `goTo({ viaCamera: true })`, `handleBack`, and `handleRestart` so the
 * easeTo, threshold check, and moveend continuation stay consistent.
 *
 * Despite the name, this is not a progress-driven `Arbiter<A>`. It has
 * no actors and is never called during engine dispatch. Nav handlers
 * hold it in a ref and call `flyHome(...)` directly.
 *
 * It works on the raw Mapbox map because `easeTo` and `once` aren't on
 * `MapOperationsAPI` in the map package yet. Once they are, this can become a
 * thin wrapper over the app API.
 */

import type { MapboxGLMap } from "@repo/map"

export interface CameraHome {
  center: [number, number]
  zoom: number
}

export interface FlyHomeOpts {
  /** Duration (ms) of the easeTo. Default 800. */
  duration?: number
  /** When true, the flight also resets bearing and pitch to 0 (used by
   *  Restart). Doesn't affect the "already home" check, which is: if center and
   *  zoom are already home, no flight runs and bearing/pitch stay as
   *  they are. */
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

  /** True when the map is at the home center and zoom (within 0.01
   *  degrees and 0.05 zoom). Ignores bearing and pitch. */
  isHome(map: MapboxGLMap): boolean {
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
  flyHome(map: MapboxGLMap | null | undefined, opts: FlyHomeOpts = {}): void {
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
