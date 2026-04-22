/* OverlayPopupArbiter. Owns `demoLocation` and `demoHoveredLocation`
 * state.
 *
 * Phase 0 scope. Drives the two React-state slots that
 * `OutcomeMorphOverlay` consumes as `demoHighlightedLocationKey` (gold
 * ring on the distribution square) and `hoveredLocation` (overlay
 * popup near the square) during the Beat 5 demo.
 *
 * These slots are React state (lines 971 and 974 of
 * `TierAnimationSection`) rather than refs because the overlay
 * component needs to re-render when they change. We receive the
 * setters via `ctx` and call them directly on window transitions.
 * There is no commit batching to do.
 */

import type {
  Arbiter,
  BeatEngineContext,
  OverlayPopupActor,
} from "../types"

export class OverlayPopupArbiter implements Arbiter<OverlayPopupActor> {
  readonly kind = "overlayPopup" as const

  /** Track which target we wrote last so `teardown()` can clear the
   *  correct slot without clobbering state it did not own. */
  private writtenRing = false
  private writtenHover = false

  onEnter(
    actor: OverlayPopupActor,
    _v: number,
    ctx: BeatEngineContext,
  ): void {
    const info = actor.buildInfo(ctx)
    if (!info) return
    if (actor.target === "ring") {
      ctx.setDemoLocation(info)
      this.writtenRing = true
    } else {
      ctx.setDemoHoveredLocation(info)
      this.writtenHover = true
    }
  }

  onExit(
    actor: OverlayPopupActor,
    _v: number,
    ctx: BeatEngineContext,
  ): void {
    if (actor.target === "ring") {
      ctx.setDemoLocation(null)
      this.writtenRing = false
    } else {
      ctx.setDemoHoveredLocation(null)
      this.writtenHover = false
    }
  }

  teardown(ctx: BeatEngineContext): void {
    if (this.writtenRing) {
      ctx.setDemoLocation(null)
      this.writtenRing = false
    }
    if (this.writtenHover) {
      ctx.setDemoHoveredLocation(null)
      this.writtenHover = false
    }
  }
}
