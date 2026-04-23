/* InteractivePaintArbiter.
 *
 * Owns `demand-units` and `demand-units-outline` paint while the
 * storyboard is in `"interactive"` mode AND a non-null outcome is
 * selected. Under the hardening plan's invariant 1 (single writer per
 * resource), this is the one arbiter that can write those two layers
 * during interactive exploration; `MapPaintArbiter` owns them during
 * playback.
 *
 * Phase 3c step 1 (current): `onExit` is fully implemented; it ports
 * the `selectedOutcomeCode`-transition effect that previously lived in
 * `TierAnimationSection.tsx`, including its deferred-to-idle path for
 * handling style-busy windows (after `removeLayer` or mid-ease).
 * `onEnter` / `onChangeSelection` remain logging stubs -- `OPL` and
 * `applyPaintChanges` still own the interactive enter/crossfade writes
 * until step 2. Because the stubs perform no paint, there is no
 * parallel-writer window with the legacy code.
 *
 * Phase 3c step 2: fills in `onEnter` / `onChangeSelection` with
 * filter, color, opacity, and outline writes ported from OPL's
 * `demand-units` branch + `applyPaintChanges`'s config branch.
 * Simultaneously adds a `fillId === "demand-units"` early return to
 * OPL and a `layerType === "demand-units"` skip to `applyPaintChanges`
 * so invariant 1 stays satisfied.
 *
 * Despite the name, this is NOT a progress-driven `Arbiter<A>`. It
 * has no actors in the beat table. It is event-driven: the React
 * effect calls `sync(ctx, selection)` whenever the arbiter's inputs
 * (`getMode()` result, `selectedOutcomeCode`) change. Same pattern as
 * `CameraArbiter`.
 */

import type { BeatEngineContext } from "../types"
import { debugLog, logDuState } from "../debug"
import {
  writeDemandUnitsBaseline,
  DU_CLASS_FILTER,
} from "../demandUnitsBaseline"
import { BEAT1_MID } from "../beat1Palette"

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

  /** Pending deferred-teardown cleanup function, or null if no
   *  teardown is currently waiting on `idle`. Tracked so a superseding
   *  `onExit` (or `onEnter`, when the user reclicks before `idle`
   *  fires) can detach the previous listener and avoid the stale
   *  write landing after the new state. */
  private pendingTeardownCleanup: (() => void) | null = null

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
      // If a previous `onExit`'s deferred teardown is still waiting on
      // `idle`, detach it now. Without this, the stale teardown could
      // still fire after the new enter's paint lands and clobber the
      // just-painted layer with the DU_CLASS_FILTER / opacity-0
      // baseline. The idle-bail check inside the deferred callback
      // also guards against this, but detaching here is cheaper and
      // keeps the write budget tight.
      this.cancelPendingTeardown()
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
   *  Writes a full `writeDemandUnitsBaseline` spec with scalar 0
   *  opacity so the layer is reliably invisible regardless of what
   *  the previous writer (typically OPL's interactive paint) left on
   *  the layer. Visibility stays `"visible"` because downstream
   *  writers (MapPaintArbiter, baseline calls elsewhere) assume the
   *  layer is visible and only drive opacity. Filter is reset to
   *  `DU_CLASS_FILTER` so a subsequent playback entry sees the same
   *  starting state it did before interactive mode began.
   *
   *  Handles style-busy windows via `once("idle", ...)`. This matters
   *  because the previous interactive writer (OPL unmount) calls
   *  `removeLayer("demand-units-outline")`, which temporarily flips
   *  `isStyleLoaded()` to `false`. A synchronous write in that window
   *  silently no-ops, leaving the layer visible with whatever opacity
   *  OPL last wrote -- hence the "all DU view after deselect" bug
   *  that predated this port.
   *
   *  Re-validates on the idle tick: if the arbiter has since retaken
   *  ownership (user clicked another square) or the engine has left
   *  interactive mode (user pressed Next), bail instead of stomping
   *  whoever owns the layer now. */
  private onExit(ctx: BeatEngineContext): void {
    debugLog(`  interactive.onExit: scheduling teardown`)
    const map = ctx.mapRef?.current?.getMap?.()
    if (!map) {
      debugLog(`  interactive.onExit: no map, skipping`)
      return
    }

    // Any prior pending teardown was superseded by a re-enter cycle
    // that brought us back here (enter -> exit within a single idle
    // frame). Drop that listener so the new teardown is the sole
    // write.
    this.cancelPendingTeardown()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runTeardownWrites = (m: any): void => {
      try {
        logDuState("InteractivePaintArbiter.onExit PRE-write", m)
        writeDemandUnitsBaseline(m, {
          filter: DU_CLASS_FILTER,
          fillExpr: ctx.buildBlendedTierExpr(BEAT1_MID, 1) as
            | readonly unknown[]
            | null,
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
        logDuState("InteractivePaintArbiter.onExit POST-write", m)
      } catch (e) {
        debugLog(`InteractivePaintArbiter.onExit ERROR`, e)
      }
    }

    if (map.isStyleLoaded?.()) {
      runTeardownWrites(map)
      return
    }

    debugLog(`  interactive.onExit: style busy, deferring to idle`)
    let ran = false
    const onIdle = () => {
      if (ran) return
      ran = true
      this.pendingTeardownCleanup = null

      // Re-validate on the idle tick. If another sync() has since
      // reclaimed ownership (user clicked a different square before
      // the style settled), `currentlyOwns` is true and writing the
      // teardown baseline would clobber the new enter's paint. If
      // the engine left interactive mode (user pressed Next to enter
      // Beat 5), `MapPaintArbiter` now owns the layer and the
      // teardown would overwrite its AG-only filter.
      if (this.currentlyOwns || ctx.getMode() !== "interactive") {
        debugLog(
          `  interactive.onExit idle-bail currentlyOwns=${this.currentlyOwns} mode=${ctx.getMode()}`,
        )
        return
      }
      debugLog(`  interactive.onExit: running after idle`)
      runTeardownWrites(map)
    }

    try {
      map.once("idle", onIdle)
    } catch {
      /* ok - Mapbox can throw if disposed mid-flight */
    }

    this.pendingTeardownCleanup = () => {
      if (ran) return
      ran = true
      try {
        map.off?.("idle", onIdle)
      } catch {
        /* ok */
      }
    }
  }

  /** Detach any pending deferred-teardown `idle` listener. Called
   *  from `sync` when a new enter / exit supersedes the previous
   *  one, and from `release` on engine teardown. Idempotent. */
  private cancelPendingTeardown(): void {
    if (!this.pendingTeardownCleanup) return
    const cleanup = this.pendingTeardownCleanup
    this.pendingTeardownCleanup = null
    cleanup()
  }
}
