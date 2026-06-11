/* NarrationArbiter bridges the beat engine to the progress-driven
 * DOM mutations owned by `BeatTextOverlay`.
 *
 * See `NarrationActor` in `engine/types.ts` for why narration uses a
 * bridge instead of declarative actors.
 *
 * `BeatTextOverlay` writes its `applyNarrationFrame(v)` callback into
 * `ctx.narrationTickRef.current` on mount and clears it on unmount. A
 * single narration actor with window `[0, 1]` (see `actorGroups.ts`)
 * makes this arbiter's `onUpdate` fire every frame across the full
 * storyboard and dispatch to the registered callback. When no
 * component is mounted the call is a silent no-op.
 */

import type { Arbiter, BeatEngineContext, NarrationActor } from "../types"

export class NarrationArbiter implements Arbiter<NarrationActor> {
  readonly kind = "narration" as const

  // Only `onUpdate` is needed. The actor spans the whole storyboard and
  // this arbiter holds no state, so the other optional hooks are skipped.
  // The component clears its own ref on unmount.
  onUpdate(_actor: NarrationActor, v: number, ctx: BeatEngineContext): void {
    ctx.narrationTickRef.current?.(v)
  }
}
