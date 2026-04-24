/* OverlayMorphArbiter. Bridges the beat engine to the progress-driven
 * SVG transform pipeline owned by `OutcomeMorphOverlay`.
 *
 * Bridge design. See the doc comment on `OverlayMorphActor` in
 * `engine/types.ts` for the rationale (same shape as
 * `NarrationArbiter`). The component writes its
 * `applyOverlayMorphFrame(v)` callback into
 * `ctx.overlayMorphTickRef.current` on mount and clears it on
 * unmount. The beat table holds a single overlay-morph actor with
 * window `[0, 1]` (see `beats.ts`), so this arbiter's `onUpdate`
 * fires every tick and dispatches to the registered callback.
 */

import type { Arbiter, BeatEngineContext, OverlayMorphActor } from "../types"

export class OverlayMorphArbiter implements Arbiter<OverlayMorphActor> {
  readonly kind = "overlayMorph" as const

  onUpdate(_actor: OverlayMorphActor, v: number, ctx: BeatEngineContext): void {
    ctx.overlayMorphTickRef.current?.(v)
  }

  // Rationale for no `onEnter` / `onExit` / `teardown`: identical to
  // `NarrationArbiter`. The actor's window spans the full progress
  // range, so enter is covered by the first `onUpdate` and exit only
  // fires on unmount. The component owns its DOM refs and cleans
  // them up via its own unmount effect.
}
