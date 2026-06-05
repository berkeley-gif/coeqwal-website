/* OverlayPopupArbiter. Owns the `demoLocation` and
 * `demoHoveredLocation` state that `OutcomeMorphOverlay` consumes as
 * `demoHighlightedLocationKey` (gold ring on the distribution square)
 * and `hoveredLocation` (overlay popup near the square) during the
 * Beat 5 demo.
 *
 * These are React state in `TierAnimationSection`, not refs, because
 * the overlay must re-render when they change. The setters arrive via
 * `ctx` and are called on window transitions.
 */

import type { Arbiter, BeatEngineContext, OverlayPopupActor } from "../types"

export class OverlayPopupArbiter implements Arbiter<OverlayPopupActor> {
  readonly kind = "overlayPopup" as const

  /** Track which target we wrote last so `teardown()` can clear the
   *  correct slot without clobbering state it did not own. */
  private writtenRing = false
  private writtenHover = false

  onEnter(actor: OverlayPopupActor, _v: number, ctx: BeatEngineContext): void {
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

  onExit(actor: OverlayPopupActor, _v: number, ctx: BeatEngineContext): void {
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
