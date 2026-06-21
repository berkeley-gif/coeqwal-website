/* OverlayPopupArbiter owns the `demoLocation` (gold ring) and
 * `demoHoveredLocation` (overlay popup) state consumed by
 * `OutcomeMorphOverlay` during the loi-highlight beat.
 *
 * These are React state, not refs, because the overlay must re-render
 * when they change. Setters arrive via `ctx`.
 */

import type { Arbiter, BeatEngineContext, OverlayPopupActor } from "../types"

export class OverlayPopupArbiter implements Arbiter<OverlayPopupActor> {
  readonly kind = "overlayPopup" as const

  /** Which slots we wrote, so `teardown()` only clears what we set. */
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
