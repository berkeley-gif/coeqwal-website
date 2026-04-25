/* InteractivePaintArbiter.
 *
 * Owns `demand-units` and `demand-units-outline` paint while the
 * storyboard is in a non-playing state AND a non-null demand-units
 * outcome is selected. Under the hardening plan's invariant 1 (single
 * writer per resource), this is the one arbiter that writes those
 * layers during interactive exploration. `MapPaintArbiter` owns them
 * during active playback tweens.
 *
 * Phase 3c step 2 (current): all interactive paint is now concentrated
 * here. `onEnter` ports OPL's demand-units fade-in path (filter +
 * color + opacity-0-armed + RAF fade-in). `onChangeSelection` ports
 * OPL's crossfade path (color-transition, filter swap, no opacity
 * reset). `applyOverlay` ports `applyPaintChanges`'s gold-outline +
 * spotlight/pinned fill-opacity branches. `onExit` writes the scalar-0
 * baseline so the layer is reliably invisible on deselect. Combined,
 * OPL's demand-units branch and `applyPaintChanges`'s demand-units
 * writes can be removed (VisualizationLayers skips OPL for DU layers
 * in get-started mode. `applyPaintChanges` early-returns for DU).
 *
 * Ownership policy lives in the call site (`TierAnimationSection`):
 * the sync effect passes `spec !== null` iff it wants the arbiter to
 * own. Broadened from Phase 3b's strict mode=interactive gate so the
 * arbiter also owns during paused-between-beats state (otherwise a
 * mid-storyboard square click would leave orphaned gold outlines on
 * deselect because no writer would clean them up).
 *
 * Despite the name, this is NOT a progress-driven `Arbiter<A>`. It
 * has no actors in the beat table. It is event-driven: React effects
 * in `TierAnimationSection.tsx` call `sync` / `applyOverlay` whenever
 * the relevant inputs change. Same pattern as `CameraArbiter`.
 */

import type {
  BeatEngineContext,
  DemandUnitsPaintSpec,
  DemandUnitsOverlayState,
} from "../types"
import { debugLog, logDuState } from "../debug"
import {
  writeDemandUnitsBaseline,
  DU_CLASS_FILTER,
} from "../demandUnitsBaseline"
import { BEAT1_MID } from "../beat1Palette"

/** Transition observed by the most recent `sync` call. Used for tests
 *  and log correlation. No control flow depends on it. */
export type InteractivePaintTransition =
  | "enter"
  | "exit"
  | "change-selection"
  | "no-op"

// ──────────────────────────────────────────────────────────────
// Constants (duplicated from TierAnimationSection to avoid React
// file-level coupling). If any of these diverge here and there the
// gold-outline overlay will look different from the non-DU outcomes,
// so keep them in sync.
// ──────────────────────────────────────────────────────────────

/** Fade-in duration (ms) for the initial enter transition. */
const FADE_IN_DURATION = 350
/** Crossfade duration (ms) when swapping between DU outcomes. */
const COLOR_TRANSITION_DURATION = 400
/** Gold highlight color applied to active outlines (hover + pin). */
const HIGHLIGHT_GOLD = "#ffd87e"
/** Base fill opacity below the zoom threshold (zoomed-out view). */
const BASE_FILL_OPACITY = 0.75
/** Zoom level at which the step expression switches branches. */
const ZOOM_THRESHOLD = 8
/** Fill opacity at and above the zoom threshold. */
const ZOOMED_IN_OPACITY = 0.75

/** Zoom-aware fill-opacity for the demand-units layer when no
 *  spotlight / pin overlay is applied. Mirrors the non-outlineOnly
 *  default in `applyPaintChanges`. */
const ZOOM_AWARE_BASE_OPACITY: unknown = [
  "step",
  ["zoom"],
  BASE_FILL_OPACITY,
  ZOOM_THRESHOLD,
  ZOOMED_IN_OPACITY,
]

/** Zoom-aware fill-opacity used during initial fade-in (matches OPL's
 *  default-path final value). Interpolates between zoom 5 and 10. */
const FADE_IN_FILL_OPACITY: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.75,
  8,
  0.55,
  10,
  0.35,
]

/** Zoom-aware outline line-width used in fade-in. Mirrors OPL. */
const OUTLINE_LINE_WIDTH: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.5,
  7,
  1,
  9,
  2,
  11,
  3,
]

/** Zoom-aware outline line-offset used in fade-in. Mirrors OPL. */
const OUTLINE_LINE_OFFSET: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  -0.25,
  7,
  -0.5,
  9,
  -1,
  11,
  -1.5,
]

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Build the compound filter for `demand-units`: class gate AND id
 *  inclusion. Called for both the fill layer and the outline layer.
 *  `classFilter === "N/A"` is a legacy escape hatch (no outcome
 *  currently uses it for DU) and is treated as "no class gate". */
function buildPaintFilter(spec: DemandUnitsPaintSpec): unknown {
  const conditions: unknown[] = []
  if (spec.classFilter && spec.classFilter !== "N/A") {
    conditions.push(["==", ["get", "Class"], spec.classFilter])
  }
  if (spec.featureIds.length > 0) {
    conditions.push([
      "in",
      ["get", spec.idProperty],
      ["literal", [...spec.featureIds]],
    ])
  }
  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]
  return ["all", ...conditions]
}

export class InteractivePaintArbiter {
  /** True while this arbiter holds the interactive paint claim. */
  private currentlyOwns = false

  /** Spec for the currently-painted outcome. Null iff `currentlyOwns`
   *  is false. Used by `onChangeSelection` to decide crossfade vs no-op
   *  and by `applyOverlay` as the "base" paint to fall back to when the
   *  overlay clears. */
  private currentSpec: DemandUnitsPaintSpec | null = null

  /** Whether we armed the fade-in transition and flipped opacity to 0
   *  awaiting the RAF follow-up. Guards the RAF handle and reset-on-
   *  re-enter semantics. */
  private pendingFadeRaf: number | null = null

  /** Pending deferred-teardown cleanup fn, or null if no teardown is
   *  waiting on `idle`. */
  private pendingTeardownCleanup: (() => void) | null = null

  /**
   * Reconcile arbiter state against the caller's desired paint spec.
   *
   * Called from a React effect in `TierAnimationSection.tsx` whenever
   * the selection, engine mode, or `playState` changes. The caller
   * passes `spec = null` when the arbiter should NOT own (no
   * selection, or engine is actively tweening playback, or the
   * outcome isn't a demand-units layer). The caller passes a non-null
   * spec when the arbiter SHOULD own.
   *
   * Idempotent: unchanged-spec calls return `"no-op"` and perform no
   * writes. Same-identity calls (same `outcomeCode`) also no-op, even
   * if the internal expression-building produced a new array (arrays
   * are not reference-stable across React renders).
   */
  sync(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec | null,
  ): InteractivePaintTransition {
    const shouldOwn = spec !== null

    // Enter. No prior claim, now should own.
    if (shouldOwn && !this.currentlyOwns) {
      // Supersede any stale deferred teardown from a previous exit.
      this.cancelPendingTeardown()
      this.currentlyOwns = true
      this.currentSpec = spec
      debugLog(
        `InteractivePaintArbiter ENTER outcome=${spec.outcomeCode} features=${spec.featureIds.length}`,
      )
      this.onEnter(ctx, spec)
      return "enter"
    }

    // Exit. Had prior claim, now should not own.
    if (!shouldOwn && this.currentlyOwns) {
      const prev = this.currentSpec?.outcomeCode ?? null
      this.currentlyOwns = false
      this.currentSpec = null
      this.cancelPendingFadeRaf()
      debugLog(`InteractivePaintArbiter EXIT prevOutcome=${prev}`)
      this.onExit(ctx)
      return "exit"
    }

    // Change selection. Still owning, outcome identity changed.
    if (
      shouldOwn &&
      this.currentlyOwns &&
      spec.outcomeCode !== this.currentSpec?.outcomeCode
    ) {
      const prev = this.currentSpec
      this.currentSpec = spec
      debugLog(
        `InteractivePaintArbiter CHANGE prev=${prev?.outcomeCode ?? "null"} new=${spec.outcomeCode}`,
      )
      this.onChangeSelection(ctx, spec, prev)
      return "change-selection"
    }

    // No-op. Either still not owning, or still owning the same outcome.
    // Per-outcome data shape (featureIds, colorExpression) is assumed
    // stable for the lifetime of a selection. If it isn't, the caller
    // releases and re-enters rather than mutating under us.
    return "no-op"
  }

  /**
   * Apply the per-selection overlay: gold outline + zoom-aware
   * fill-opacity with optional spotlight / pinned overrides. Called
   * from a React effect whenever active / pinned / spotlight state
   * changes. No-op when the arbiter doesn't currently own.
   *
   * Idempotent: re-applying the same overlay produces the same paint.
   * Idle-style-busy windows are not a concern here because all prior
   * paint was synchronous in `onEnter` / `onChangeSelection` -- we
   * expect the style to be loaded by the time overlay ticks arrive.
   * If it isn't, the writes silently no-op and the next overlay tick
   * (or a hover/pin toggle) retries.
   */
  applyOverlay(ctx: BeatEngineContext, overlay: DemandUnitsOverlayState): void {
    if (!this.currentlyOwns || !this.currentSpec) return
    if (overlay.outcomeCode !== this.currentSpec.outcomeCode) return

    const map = ctx.mapRef?.current?.getMap?.()
    if (!map) return

    const spec = this.currentSpec
    const idProp = spec.idProperty

    try {
      // ── Outline pass: gold case on active features, tier color otherwise.
      if (map.getLayer("demand-units-outline")) {
        if (overlay.activeFeatureIds.length > 0) {
          const activeMatch: unknown = [
            "in",
            ["get", idProp],
            ["literal", [...overlay.activeFeatureIds]],
          ]
          map.setPaintProperty("demand-units-outline", "line-color", [
            "case",
            activeMatch,
            HIGHLIGHT_GOLD,
            spec.colorExpression,
          ] as never)
          map.setPaintProperty("demand-units-outline", "line-width", [
            "case",
            activeMatch,
            2,
            1,
          ] as never)
          map.setPaintProperty("demand-units-outline", "line-opacity", [
            "case",
            activeMatch,
            1,
            0,
          ] as never)
        } else {
          map.setPaintProperty(
            "demand-units-outline",
            "line-color",
            spec.colorExpression as never,
          )
          map.setPaintProperty(
            "demand-units-outline",
            "line-width",
            OUTLINE_LINE_WIDTH as never,
          )
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            1 as never,
          )
        }
      }

      // ── Fill pass: spotlight > pinned > zoom-aware base.
      if (!map.getLayer("demand-units")) return

      if (overlay.hasSpotlight) {
        if (overlay.spotlightFeatureIds.length > 0) {
          const spotlightMatch: unknown = [
            "in",
            ["get", idProp],
            ["literal", [...overlay.spotlightFeatureIds]],
          ]
          map.setPaintProperty("demand-units", "fill-opacity", [
            "case",
            spotlightMatch,
            0.9,
            0.12,
          ] as never)
        } else {
          // Spotlight requested but no matching DUs -- dim all.
          map.setPaintProperty("demand-units", "fill-opacity", 0.12 as never)
        }
      } else if (overlay.pinnedFeatureIds.length > 0) {
        const pinnedMatch: unknown = [
          "in",
          ["get", idProp],
          ["literal", [...overlay.pinnedFeatureIds]],
        ]
        map.setPaintProperty("demand-units", "fill-opacity", [
          "step",
          ["zoom"],
          ["case", pinnedMatch, 1, BASE_FILL_OPACITY],
          ZOOM_THRESHOLD,
          ZOOMED_IN_OPACITY,
        ] as never)
      } else {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          ZOOM_AWARE_BASE_OPACITY as never,
        )
      }
    } catch (e) {
      debugLog(`InteractivePaintArbiter.applyOverlay ERROR`, e)
    }
  }

  /**
   * Unconditionally release ownership. Called on engine unmount or
   * when a nav handler wants to force-clear interactive state without
   * driving through `sync`.
   */
  release(ctx: BeatEngineContext): void {
    if (!this.currentlyOwns) return
    const prev = this.currentSpec?.outcomeCode ?? null
    this.currentlyOwns = false
    this.currentSpec = null
    this.cancelPendingFadeRaf()
    debugLog(`InteractivePaintArbiter RELEASE prev=${prev}`)
    this.onExit(ctx)
  }

  /** True iff the arbiter is currently the active writer. */
  owns(): boolean {
    return this.currentlyOwns
  }

  /** Cancel any pending deferred-teardown `idle` listener. Public so
   *  `TierAnimationSection` can abort a teardown when `playState`
   *  transitions to `"playing"` -- at that point `MapPaintArbiter` is
   *  about to take the wheel and the pending teardown would stomp
   *  whatever beat it writes. Idempotent. */
  cancelPendingTeardown(): void {
    if (!this.pendingTeardownCleanup) return
    const cleanup = this.pendingTeardownCleanup
    this.pendingTeardownCleanup = null
    cleanup()
  }

  // ──────────────────────────────────────────────────────────────
  // Lifecycle hooks
  // ──────────────────────────────────────────────────────────────

  /**
   * Take ownership of `demand-units` / `demand-units-outline`.
   *
   * Ported from OPL's initial-fade-in branch: step 1 (this tick)
   * applies color, filter, transition-armed opacity-0, visibility
   * visible on both fill and outline. Step 2 (next frame, via RAF)
   * flips opacity to the zoom-aware target, triggering a smooth fade
   * rather than a pop. Without the RAF split, Mapbox batches the
   * opacity=0 and opacity=target writes in the same frame and skips
   * the transition entirely.
   *
   * Unlike OPL, the arbiter does NOT create `demand-units-outline`
   * on demand: `TierAnimationSection`'s session-init block creates it
   * for the storyboard's lifetime. If the outline is missing for some
   * reason (basemap switched mid-session) the `getLayer` guards skip
   * it and the fill-only paint still works.
   */
  private onEnter(ctx: BeatEngineContext, spec: DemandUnitsPaintSpec): void {
    const map = ctx.mapRef?.current?.getMap?.()
    if (!map) {
      debugLog(`  interactive.onEnter: no map, skipping`)
      return
    }
    if (!map.getLayer("demand-units")) {
      debugLog(`  interactive.onEnter: no demand-units layer, skipping`)
      return
    }

    this.cancelPendingFadeRaf()

    try {
      logDuState("InteractivePaintArbiter.onEnter PRE", map)

      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter as never)
      map.setPaintProperty(
        "demand-units",
        "fill-color",
        spec.colorExpression as never,
      )
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: FADE_IN_DURATION,
        delay: 0,
      } as never)
      map.setPaintProperty("demand-units", "fill-opacity", 0 as never)
      map.setLayoutProperty("demand-units", "visibility", "visible")

      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity-transition",
          {
            duration: FADE_IN_DURATION,
            delay: 0,
          } as never,
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 0 as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTLINE_LINE_WIDTH as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-offset",
          OUTLINE_LINE_OFFSET as never,
        )
      }

      logDuState("InteractivePaintArbiter.onEnter POST-sync", map)
    } catch (e) {
      debugLog(`InteractivePaintArbiter.onEnter ERROR (pre-RAF)`, e)
      return
    }

    // Step 2: next frame, flip opacity to target so the armed
    // transition actually animates instead of snapping.
    this.pendingFadeRaf = requestAnimationFrame(() => {
      this.pendingFadeRaf = null
      // Bail if we lost ownership while the RAF was in flight (rapid
      // click/deselect). The post-enter paint would otherwise land
      // after `onExit`'s baseline write and re-make the layer visible.
      if (!this.currentlyOwns) return
      if (this.currentSpec?.outcomeCode !== spec.outcomeCode) return
      if (!map.getLayer("demand-units")) return

      try {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          FADE_IN_FILL_OPACITY as never,
        )
        if (map.getLayer("demand-units-outline")) {
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            1 as never,
          )
          map.setLayoutProperty("demand-units-outline", "visibility", "visible")
        }
        logDuState("InteractivePaintArbiter.onEnter POST-RAF", map)
      } catch (e) {
        debugLog(`InteractivePaintArbiter.onEnter ERROR (RAF)`, e)
      }
    })
  }

  /**
   * Crossfade to a different DU outcome while retaining ownership.
   *
   * Ported from OPL's `wasShowingDataRef.current === true` branch:
   * update the filter for the new feature set, arm
   * fill-color-transition + line-color-transition (400ms), and write
   * the new color expressions. Mapbox interpolates the fill color
   * change natively.
   *
   * We first **strip** `applyOverlay` output (case/step on fill
   * opacity, gold outline, etc.) in `clearOverlayToBaseForCrossfade`
   * so the new filter is never evaluated for one frame against the
   * previous outcome's per-feature case expressions. That was the
   * source of the one-frame cross-outcome flash. The
   * `applyOverlay` effect in `TierAnimationSection` re-applies
   * spotlight / pins in the same commit after this hook runs, so
   * interactive state is restored.
   */
  private onChangeSelection(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec,
    _prev: DemandUnitsPaintSpec | null,
  ): void {
    const map = ctx.mapRef?.current?.getMap?.()
    if (!map || !map.getLayer("demand-units")) return

    this.cancelPendingFadeRaf()

    try {
      logDuState("InteractivePaintArbiter.onChangeSelection PRE", map)

      // Must run **before** setFilter: old overlay expressions + new
      // class slice can disagree for a single paint otherwise.
      this.clearOverlayToBaseForCrossfade(map, spec)

      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter as never)
      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter as never)
      }

      map.setPaintProperty("demand-units", "fill-color-transition", {
        duration: COLOR_TRANSITION_DURATION,
        delay: 0,
      } as never)
      map.setPaintProperty(
        "demand-units",
        "fill-color",
        spec.colorExpression as never,
      )

      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: COLOR_TRANSITION_DURATION,
          delay: 0,
        } as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
      }

      logDuState("InteractivePaintArbiter.onChangeSelection POST", map)
    } catch (e) {
      debugLog(`InteractivePaintArbiter.onChangeSelection ERROR`, e)
    }
  }

  /** Drop spotlight / pin / active outline overrides to the plain
   *  tier-colored baseline that matches the **incoming** `spec`, with
   *  zero-length opacity transitions so the following color crossfade
   *  does not composite on top of case/step garbage from the prior
   *  outcome. Mirrors the no-actives / no-spotlight branch of
   *  `applyOverlay`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clearOverlayToBaseForCrossfade(map: any, spec: DemandUnitsPaintSpec) {
    try {
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      } as never)
      map.setPaintProperty(
        "demand-units",
        "fill-opacity",
        ZOOM_AWARE_BASE_OPACITY as never,
      )
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: 0,
          delay: 0,
        } as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTLINE_LINE_WIDTH as never,
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 1 as never)
      }
    } catch {
      /* ok */
    }
  }

  /** Release ownership: return both layers to the scalar-0 baseline.
   *  `MapPaintArbiter` picks up from here on the next playback cycle;
   *  during interactive idle the baseline is the final resting state.
   *
   *  Handles style-busy windows via `once("idle", ...)` as a safety
   *  net (e.g. if a late basemap switch or `removeLayer` elsewhere
   *  puts the map in a transient loading state). Re-validates on the
   *  idle tick: if the arbiter has since retaken ownership, bail
   *  instead of stomping the new paint. `cancelPendingTeardown` is
   *  public so `TierAnimationSection` can abort the listener when
   *  `playState` flips to `"playing"` (see call-site comment for why).
   */
  private onExit(ctx: BeatEngineContext): void {
    debugLog(`  interactive.onExit: scheduling teardown`)
    const map = ctx.mapRef?.current?.getMap?.()
    if (!map) {
      debugLog(`  interactive.onExit: no map, skipping`)
      return
    }

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

      // Re-validate on the idle tick. Only `currentlyOwns` matters:
      // if we've retaken ownership (user clicked another square
      // before the style settled), the teardown baseline would
      // clobber the new enter's paint. Mode / playState flips are
      // handled externally via `cancelPendingTeardown`.
      if (this.currentlyOwns) {
        debugLog(
          `  interactive.onExit idle-bail currentlyOwns=true mode=${ctx.getMode()}`,
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

  /** Cancel any pending fade-in RAF, e.g. when exit happens before
   *  the step-2 opacity flip fires. Prevents a stale post-enter paint
   *  from landing after `onExit` and re-making the layer visible. */
  private cancelPendingFadeRaf(): void {
    if (this.pendingFadeRaf === null) return
    try {
      cancelAnimationFrame(this.pendingFadeRaf)
    } catch {
      /* ok */
    }
    this.pendingFadeRaf = null
  }
}
