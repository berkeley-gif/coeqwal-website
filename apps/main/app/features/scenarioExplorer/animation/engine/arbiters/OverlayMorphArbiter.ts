/* OverlayMorphArbiter bridges the beat engine to the progress-driven
 * SVG transform pipeline owned by `OutcomeMorphOverlay`.
 *
 * See `OverlayMorphActor` in `engine/types.ts` for why it uses a bridge
 * (same shape as `NarrationArbiter`). The component writes its
 * `applyOverlayMorphFrame(v)` callback into
 * `ctx.overlayMorphTickRef.current` on mount and clears it on unmount.
 * A single overlay-morph actor with window `[0, 1]` (see
 * `actorGroups.ts`) makes this arbiter's `onUpdate` fire every frame
 * and dispatch to the callback.
 */

import type { Arbiter, BeatEngineContext, OverlayMorphActor } from "../types"

export class OverlayMorphArbiter implements Arbiter<OverlayMorphActor> {
  readonly kind = "overlayMorph" as const

  // Only `onUpdate` is needed, same as `NarrationArbiter`. The actor
  // spans the whole storyboard and this arbiter holds no state. The
  // component clears its own ref on unmount.
  onUpdate(_actor: OverlayMorphActor, v: number, ctx: BeatEngineContext): void {
    ctx.overlayMorphTickRef.current?.(v)
  }
}
