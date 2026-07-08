/* OverlayMorphArbiter bridges the beat engine to the progress-driven
 * SVG transform pipeline owned by `OutcomeMorphOverlay`. See
 * `OverlayMorphActor` in `engine/types.ts` for why it uses a bridge.
 * The component writes its `applyOverlayMorphFrame(v)` callback into
 * `ctx.overlayMorphTickRef.current` on mount and clears it on unmount.
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
