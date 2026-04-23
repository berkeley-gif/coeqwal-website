/* InteractivePaintArbiter.
 *
 * Owns `demand-units` and `demand-units-outline` paint while the
 * storyboard is in `"interactive"` mode AND a non-null outcome is
 * selected. Under the hardening plan's invariant 1 (single writer per
 * resource), this is the one arbiter that can write those two layers
 * during interactive exploration; `MapPaintArbiter` owns them during
 * playback.
 *
 * Phase 3b (current): ships as a LIFECYCLE TRACKER ONLY. The state
 * machine (enter / exit / change-selection) is wired via a React
 * effect in `TierAnimationSection.tsx`, but the lifecycle hooks are
 * logging stubs; no paint writes happen here yet. Legacy writers
 * (`applyPaintChanges` effect, `OutcomePolygonLayer`'s DU writes, the
 * `selectedOutcomeCode` transition effect) remain the source of truth.
 *
 * Phase 3c: fills in `onEnter` / `onChangeSelection` / `onExit` with
 * actual `writeDemandUnitsBaseline` + paint-expression writes (ported
 * from `applyPaintChanges`). Simultaneously deletes the legacy writers
 * in a single swap so invariant 1 holds at all times.
 *
 * Despite the name, this is NOT a progress-driven `Arbiter<A>`. It
 * has no actors in the beat table. It is event-driven: the React
 * effect calls `sync(ctx, selection)` whenever the arbiter's inputs
 * (`getMode()` result, `selectedOutcomeCode`) change. Same pattern as
 * `CameraArbiter`.
 */

import type { BeatEngineContext } from "../types"
import { debugLog } from "../debug"

/** Transition observed by the most recent `sync` call. Mostly useful
 *  for logging and tests. */
export type InteractivePaintTransition =
  | "enter"
  | "exit"
  | "change-selection"
  | "no-op"

export class InteractivePaintArbiter {
  /** True while this arbiter holds the interactive paint claim.
   *  Flipped by `sync` only; external callers must route through
   *  `sync` or `release` to mutate. */
  private currentlyOwns = false

  /** Outcome code currently painted. Null iff `currentlyOwns` is
   *  false. Used to detect same-mode selection swaps so the arbiter
   *  can issue a crossfade update instead of a full exit/enter. */
  private currentSelection: string | null = null

  /**
   * Reconcile arbiter state against current engine mode and selection.
   *
   * Called from a React effect in `TierAnimationSection.tsx` whenever
   * mode or selection changes. Idempotent: calling with unchanged
   * inputs returns `"no-op"` and performs no writes.
   *
   * Ownership condition (strict mode gate, per Phase 3b decision):
   * `ctx.getMode() === "interactive" AND selection !== null`. During
   * playback, even if the user has clicked a square, this arbiter
   * does NOT take over paint - `MapPaintArbiter` retains ownership
   * until the storyboard settles.
   */
  sync(
    ctx: BeatEngineContext,
    selection: string | null,
  ): InteractivePaintTransition {
    const mode = ctx.getMode()
    const shouldOwn = mode === "interactive" && selection !== null

    // 1. Enter. No prior claim, now should own.
    if (shouldOwn && !this.currentlyOwns) {
      this.currentlyOwns = true
      this.currentSelection = selection
      debugLog(
        `InteractivePaintArbiter ENTER mode=${mode} selection=${selection}`,
      )
      this.onEnter(ctx, selection!)
      return "enter"
    }

    // 2. Exit. Had prior claim, now should not own. Covers both
    //    de-selection (selection went to null in interactive mode)
    //    and mode flip away from interactive (e.g. user pressed Back
    //    from the settled state, engine went to playback).
    if (!shouldOwn && this.currentlyOwns) {
      const prev = this.currentSelection
      this.currentlyOwns = false
      this.currentSelection = null
      debugLog(
        `InteractivePaintArbiter EXIT mode=${mode} prevSelection=${prev}`,
      )
      this.onExit(ctx)
      return "exit"
    }

    // 3. Change selection. Still owning, selection identity changed.
    //    Two sub-cases the lifecycle doesn't distinguish at this layer:
    //    (a) user clicked a different square within the same outcome
    //        -> selection.code is the same so this branch does NOT
    //        fire (we compare full `selection` string which is the
    //        outcome code).
    //    (b) user clicked a square in a different outcome -> this
    //        branch fires and the arbiter crossfades.
    if (
      shouldOwn &&
      this.currentlyOwns &&
      selection !== this.currentSelection
    ) {
      const prev = this.currentSelection
      this.currentSelection = selection
      debugLog(
        `InteractivePaintArbiter CHANGE prev=${prev} new=${selection}`,
      )
      this.onChangeSelection(ctx, selection!, prev)
      return "change-selection"
    }

    // 4. No-op. Either still not owning (idle/playback, or interactive
    //    but no selection) or still owning the same selection.
    return "no-op"
  }

  /**
   * Unconditionally release ownership (teardown path). Called on
   * engine unmount or when a nav handler wants to force-clear
   * interactive state without driving through `sync`.
   *
   * Idempotent. Safe to call when not currently owning.
   */
  release(ctx: BeatEngineContext): void {
    if (!this.currentlyOwns) return
    const prev = this.currentSelection
    this.currentlyOwns = false
    this.currentSelection = null
    debugLog(`InteractivePaintArbiter RELEASE prev=${prev}`)
    this.onExit(ctx)
  }

  /** True iff the arbiter is currently the active writer for
   *  `demand-units` / `demand-units-outline`. Exposed mainly for
   *  diagnostic / test code. */
  owns(): boolean {
    return this.currentlyOwns
  }

  // ──────────────────────────────────────────────────────────────
  // Lifecycle hooks. Phase 3b: logging stubs. Phase 3c: paint writes.
  // ──────────────────────────────────────────────────────────────

  /** Take ownership of `demand-units` / `demand-units-outline`.
   *
   *  Phase 3c will:
   *  1. `writeDemandUnitsBaseline(map, spec)` to assert a known clean
   *     slate (the handoff point where `MapPaintArbiter` released).
   *  2. Apply the tier-colored fill expression, fill-opacity, filter,
   *     and outline styling for the selected outcome. Logic ports
   *     from `applyPaintChanges` (TierAnimationSection.tsx) and
   *     `OutcomePolygonLayer`'s `demand-units` branch. */
  private onEnter(ctx: BeatEngineContext, selection: string): void {
    debugLog(`  [stub] interactive.onEnter selection=${selection}`)
    void ctx
  }

  /** Crossfade to a different outcome while retaining ownership.
   *
   *  Phase 3c will:
   *  1. Update `fill-color` / `fill-color-transition`, `line-color` /
   *     `line-color-transition` with the new outcome's expressions.
   *  2. Update the filter expression if the outcome changes the set
   *     of feature ids.
   *  3. Leave fill-opacity / line-opacity alone - Mapbox natively
   *     interpolates the color change. Mirrors the crossfade path in
   *     `OutcomePolygonLayer` at `wasShowingDataRef.current === true`.
   */
  private onChangeSelection(
    ctx: BeatEngineContext,
    selection: string,
    prev: string | null,
  ): void {
    debugLog(
      `  [stub] interactive.onChangeSelection prev=${prev} new=${selection}`,
    )
    void ctx
  }

  /** Release ownership: return `demand-units` / `demand-units-outline`
   *  to baseline (invisible, original filter). `MapPaintArbiter`
   *  picks up from here on the next playback cycle; during
   *  interactive idle (settled, no selection) the baseline is the
   *  final state.
   *
   *  Phase 3c will: `writeDemandUnitsBaseline(map, spec)`. */
  private onExit(ctx: BeatEngineContext): void {
    debugLog(`  [stub] interactive.onExit`)
    void ctx
  }
}
