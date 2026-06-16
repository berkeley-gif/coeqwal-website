/* InteractiveLayerDirector
 *
 * Single entry point for "user selected outcome X, make the map show it"
 * in get-started interactive mode. It sequences the cross-family handoff
 * that previously flickered, since the demand-units arbiter, non-DU
 * outline arbiter, and `OutcomePolygonLayer` each reacted on their own.
 *
 * Holds the two imperative drivers and decides per selection:
 *   - Same layer (CWS / Ag, same fill id): recolor in place via the
 *     driver's own Mapbox color crossfade, no fade-out/fade-in.
 *   - Different layer or family: fade the outgoing driver out now, fade
 *     the incoming one in once the map goes idle. A selection almost
 *     always flies the camera, so gating the fade-in on `idle` keeps the
 *     new layer from painting mid-flight and lands it after tiles settle.
 *   - River / marker families render in React. The director only fades
 *     out any imperative driver that was showing.
 *
 * Overlay passes (gold highlight, spotlight, pin) come through
 * `applyOverlay`, routed to the owning driver and remembered so a gated
 * fade-in can re-apply the latest overlay when it runs.
 */

import type {
  BeatEngineContext,
  DemandUnitsOverlayState,
  DemandUnitsPaintSpec,
} from "./types"
import type { InteractiveLayerFamily } from "./interactiveLayerDriver"
import type { InteractivePaintArbiter } from "./arbiters/InteractivePaintArbiter"
import type {
  PolygonLayerDriver,
  PolygonPaintSpec,
} from "./arbiters/PolygonLayerDriver"

/** The demand-units family always owns this single fixed fill id. */
const DEMAND_UNITS_FILL = "demand-units"

/** What the director should make the map show. `null` means deselect. */
export type SelectRequest =
  | { family: "demand-units"; spec: DemandUnitsPaintSpec }
  | { family: "polygon"; spec: PolygonPaintSpec }
  | { family: "river" | "marker" }

/** A minimal view of the Mapbox map for camera-idle gating. */
type GateMap = {
  isStyleLoaded?: () => boolean
  isMoving?: () => boolean
  once?: (event: string, cb: () => void) => void
  off?: (event: string, cb: () => void) => void
}

export class InteractiveLayerDirector {
  private activeFamily: InteractiveLayerFamily | null = null
  private activeFillId: string | null = null

  /** Latest overlay, re-applied after a gated fade-in lands. */
  private lastOverlay: DemandUnitsOverlayState | null = null

  /** Cleanup for a fade-in waiting on `idle`, or null when none is pending. */
  private pendingEnterCleanup: (() => void) | null = null

  constructor(
    private readonly du: InteractivePaintArbiter,
    private readonly poly: PolygonLayerDriver,
  ) {}

  /** Reconcile the map to a selection. Pass null to deselect / release. */
  select(ctx: BeatEngineContext, req: SelectRequest | null): void {
    this.cancelPendingEnter()

    if (!req) {
      this.exitActive(ctx)
      this.activeFamily = null
      this.activeFillId = null
      return
    }

    if (req.family === "demand-units") {
      // Same fixed layer: recolor in place when we already own it.
      if (this.activeFamily === "demand-units" && this.du.owns()) {
        this.du.sync(ctx, req.spec)
        this.reapplyOverlay(ctx)
      } else {
        this.exitActive(ctx)
        this.enterGated(ctx, () => {
          this.du.sync(ctx, req.spec)
          this.reapplyOverlay(ctx)
        })
      }
      this.activeFamily = "demand-units"
      this.activeFillId = DEMAND_UNITS_FILL
      return
    }

    if (req.family === "polygon") {
      const incomingFill = req.spec.fillId
      // Same polygon layer with new colors: recolor in place.
      if (
        this.activeFamily === "polygon" &&
        this.poly.owns() &&
        this.activeFillId === incomingFill
      ) {
        this.poly.sync(ctx, req.spec)
        this.reapplyOverlay(ctx)
      } else {
        this.exitActive(ctx)
        this.enterGated(ctx, () => {
          this.poly.sync(ctx, req.spec)
          this.reapplyOverlay(ctx)
        })
      }
      this.activeFamily = "polygon"
      this.activeFillId = incomingFill
      return
    }

    // river / marker: React renders these. Fade out any imperative driver.
    this.exitActive(ctx)
    this.activeFamily = req.family
    this.activeFillId = null
  }

  /** Apply an overlay pass to whichever driver currently owns. Remembered so
   *  a gated fade-in can re-apply the latest state when it lands. */
  applyOverlay(ctx: BeatEngineContext, overlay: DemandUnitsOverlayState): void {
    this.lastOverlay = overlay
    if (this.activeFamily === "demand-units") this.du.applyOverlay(ctx, overlay)
    else if (this.activeFamily === "polygon")
      this.poly.applyOverlay(ctx, overlay)
  }

  /** Force-release both drivers (nav teardown / unmount). */
  release(ctx: BeatEngineContext): void {
    this.cancelPendingEnter()
    this.du.release(ctx)
    this.poly.release(ctx)
    this.activeFamily = null
    this.activeFillId = null
    this.lastOverlay = null
  }

  /** Cancel a fade-in waiting on idle (rapid re-selection). */
  cancelPendingEnter(): void {
    if (!this.pendingEnterCleanup) return
    const cleanup = this.pendingEnterCleanup
    this.pendingEnterCleanup = null
    cleanup()
  }

  /** Playback started: cancel any pending fade-in and the demand-units
   *  arbiter's deferred-idle teardown, so a late write can't clobber the
   *  beat paint `MapPaintArbiter` is about to lay down. */
  cancelPending(): void {
    this.cancelPendingEnter()
    this.du.cancelPendingTeardown()
  }

  //────
  // Internals
  //────

  private exitActive(ctx: BeatEngineContext): void {
    if (this.activeFamily === "demand-units") this.du.release(ctx)
    else if (this.activeFamily === "polygon") this.poly.release(ctx)
    // river / marker own no imperative layers.
  }

  private reapplyOverlay(ctx: BeatEngineContext): void {
    if (!this.lastOverlay) return
    if (this.activeFamily === "demand-units")
      this.du.applyOverlay(ctx, this.lastOverlay)
    else if (this.activeFamily === "polygon")
      this.poly.applyOverlay(ctx, this.lastOverlay)
  }

  /** Run `enter` now if the map is settled, otherwise once it goes idle. A
   *  selection usually flies the camera, so deferring the fade-in to `idle`
   *  avoids painting the new layer during the flight. */
  private enterGated(ctx: BeatEngineContext, enter: () => void): void {
    const map = ctx.mapRef?.current?.getMap?.() as unknown as
      | GateMap
      | undefined
    if (!map) {
      enter()
      return
    }

    const styleLoaded = map.isStyleLoaded?.() ?? true
    const moving = map.isMoving?.() ?? false
    if (styleLoaded && !moving) {
      enter()
      return
    }

    let ran = false
    const onIdle = () => {
      if (ran) return
      ran = true
      this.pendingEnterCleanup = null
      enter()
    }
    try {
      map.once?.("idle", onIdle)
    } catch {
      enter()
      return
    }
    this.pendingEnterCleanup = () => {
      if (ran) return
      ran = true
      try {
        map.off?.("idle", onIdle)
      } catch {
        /* ok */
      }
    }
  }
}
