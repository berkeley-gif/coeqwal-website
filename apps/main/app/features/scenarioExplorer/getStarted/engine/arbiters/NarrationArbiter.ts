/* NarrationArbiter. Bridges the beat engine to the progress-driven
 * DOM mutations owned by `BeatTextOverlay`.
 *
 * Bridge design. See the doc comment on `NarrationActor` in
 * `engine/types.ts` for the full rationale. Short version: narration
 * writes ~320 lines of per-beat opacity curves over component-local
 * refs. Mechanically lifting that into the declarative actor format
 * is a large, risky rewrite with no observable benefit beyond
 * invariant 4 ("one `progress.on('change')` subscriber"). The bridge
 * pattern earns invariant 4 while letting the component keep its
 * refs, timing constants, and closures.
 *
 * Wiring. `BeatTextOverlay` writes its `applyNarrationFrame(v)`
 * callback into `ctx.narrationTickRef.current` on mount and clears
 * it on unmount. The beat table holds a single narration actor with
 * window `[0, 1]` (see `beats.ts`), so this arbiter's `onUpdate`
 * fires every tick across the full storyboard and dispatches to the
 * registered callback. When no component is mounted (or during
 * narration's own mount/unmount window) the call is a silent no-op.
 */

import type { Arbiter, BeatEngineContext, NarrationActor } from "../types"

export class NarrationArbiter implements Arbiter<NarrationActor> {
  readonly kind = "narration" as const

  onUpdate(_actor: NarrationActor, v: number, ctx: BeatEngineContext): void {
    ctx.narrationTickRef.current?.(v)
  }

  // No `onEnter`. Narration actors span `[0, 1]` so the enter tick
  // is covered by the very first `onUpdate` the engine dispatches,
  // which is fine for DOM opacity writes (they are idempotent and
  // a one-tick delay from actor-register time is invisible).

  // No `onExit`. The actor's window spans the full progress range,
  // so `onExit` only fires on unmount via `teardown` below, which is
  // also a no-op: the component's cleanup effect clears
  // `narrationTickRef.current` before unmount, so the DOM refs it
  // was writing to are unmounting with it.

  // No `teardown`. The arbiter holds no state.
}
