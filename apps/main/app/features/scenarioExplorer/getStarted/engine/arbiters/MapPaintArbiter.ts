/* MapPaintArbiter. The single owner of Mapbox DU paint during Beat 4.
 *
 * Phase 0 scope. Handle the four paint-payload variants Beat 4 needs.
 *
 * `beat5-enter`. Filter swap and seed opacity 0 (one-shot, on enter).
 * `beat5-layer-fade`. Per-tick piecewise opacity ramp (update).
 * `beat5-poly-ring`. Gold-stroke case expression (on enter and on exit).
 * `beat5-exit`. One-shot hand-off back to the beat2 phase.
 *
 * Logic lifts verbatim from TierAnimationSection.tsx lines 2251 to 2407
 * so the spike is a pure structural refactor, not a behavior change.
 * Named constants live on actor payloads in the beat table. No magic
 * numbers in this file.
 *
 * Full-state assertion on beat enter goes through
 * `writeDemandUnitsBaseline` so the set of properties this arbiter
 * writes is locked to the plan's invariant 2 (every ownership
 * handoff asserts the full property set). Adding a new property to
 * the baseline spec propagates to every writer automatically.
 */

import type {
  Arbiter,
  BeatEngineContext,
  MapPaintActor,
  MapPaintPayload,
} from "../types"
import {
  DU_AG_ONLY_FILTER,
  DU_CLASS_FILTER,
  writeDemandUnitsBaseline,
} from "../demandUnitsBaseline"
import { BEAT1_MID, beat1FillExpr } from "../beat1Palette"
import { debugLog, logDuState } from "../debug"
import { BASEMAP_DIM_OPACITY } from "../../../../map/config/outcomeLayerRegistry"

/** Progress value at which the `basemap-dim-overlay` finishes fading
 *  in to its peak opacity. Mirrors the legacy listener's
 *  `FREEZE_AT * 0.33` constant (FREEZE_AT = 0.09, see
 *  TierAnimationSection.tsx). The reset window pins the overlay to 0
 *  for v < 0.01, then this ramp brings it from 0 to
 *  `BASEMAP_DIM_OPACITY` across `[0, BASEMAP_DIM_FADE_END]`. After the
 *  ramp completes it stays pinned at peak for the rest of the
 *  storyboard. Each beat onEnter re-asserts the peak so reverse-scrubs
 *  back from a later beat into the cycle window do not leave the
 *  overlay at a partial value. */
const BASEMAP_DIM_FADE_END = 0.0297

export class MapPaintArbiter implements Arbiter<MapPaintActor> {
  readonly kind = "mapPaint" as const

  /** Gold-ring state. True iff the `demand-units-outline` layer is
   *  currently carrying a `case` expression that strokes the LOI in
   *  gold. Mirrors the `beat5PolyRingOn` closure variable in the old
   *  main-choreography listener. */
  private beat5PolyRingOn = false

  /** Last `colorPhase` the Beat 1 cycle landed on. Written by
   *  `beat1-cycle.onUpdate` every tick. Read by `beat1-hold.onEnter`
   *  to seed the frozen palette. Matches the `frozenColorPhase`
   *  closure variable in the old main-choreography listener. Starts
   *  at 0 so a fresh playback hold (before any cycle has run) uses
   *  the reset palette. */
  private frozenColorPhase = 0

  /** [DIAG S4/S5] Which beat5-layer-fade boundaries we've already
   *  logged for the current pass. Reset on `applyBeat5Enter`. */
  private diagBoundariesLogged = new Set<string>()

  onEnter(actor: MapPaintActor, v: number, ctx: BeatEngineContext): void {
    const map = getStyledMap(ctx)
    if (!map) return

    const p = actor.payload
    switch (p.kind) {
      case "reset":
        this.applyReset(map)
        return
      case "beat1-cycle":
        this.applyBeat1CycleEnter(map, v)
        return
      case "beat1-hold":
        this.applyBeat1HoldEnter(map, p, v)
        return
      case "beat1c-blend":
        this.applyBeat1cBlendEnter(map, p, v)
        return
      case "beat1c-tail":
        this.applyBeat1cTailEnter(map, p, ctx, v)
        return
      case "beat2-hide-schedule":
        this.applyBeat2HideScheduleEnter(map, ctx, v)
        return
      case "beat6-restore":
        this.applyBeat6RestoreEnter(map, ctx, v)
        return
      case "beat-line-fades":
        // No one-shot enter work. The first `onUpdate` tick writes
        // line opacities for every entry in the schedule based on `v`.
        return
      case "beat5-enter":
        this.applyBeat5Enter(map, ctx, v)
        return
      case "beat5-poly-ring":
        this.applyBeat5PolyRingOn(map, p, ctx)
        return
      case "beat5-layer-fade":
        // Fade starts on the first update tick. Enter is a no-op. The
        // one-shot layer setup already ran in the companion
        // `beat5-enter` actor (same window start).
        return
      case "beat5-exit":
        // `beat5-exit` fires when the previous tick was still inside
        // the Beat 5 window and the current tick just crossed
        // `BEAT5_TAIL_END`. We treat this as `onEnter` of the exit
        // actor. Run the one-shot hand-off to the beat2 phase.
        this.applyBeat5Exit(map, p, ctx)
        return
    }
  }

  onUpdate(actor: MapPaintActor, v: number, ctx: BeatEngineContext): void {
    const map = getStyledMap(ctx)
    if (!map) return

    const p = actor.payload
    if (p.kind === "beat1-cycle") {
      this.applyBeat1CycleUpdate(map, p, v)
      return
    }
    if (p.kind === "beat1-hold") {
      this.applyBeat1HoldUpdate(map, p)
      return
    }
    if (p.kind === "beat1c-blend") {
      this.applyBeat1cBlendUpdate(map, p, v, ctx)
      return
    }
    // `beat1c-tail` is a static hold written once by `onEnter`. No
    // per-tick work, matching the legacy listener's `phase !==
    // "beat1c"` guard behavior.
    if (p.kind === "beat2-hide-schedule") {
      this.applyBeat2HideScheduleUpdate(map, p, v, ctx)
      return
    }
    if (p.kind === "beat-line-fades") {
      this.applyLineFadesUpdate(map, v, ctx)
      return
    }
    // `beat6-restore` is a one-shot baseline assertion in `onEnter`.
    // Per-tick work would re-write a scalar zero that is already on
    // the layer, so `onUpdate` is a no-op.
    if (p.kind === "beat5-layer-fade") {
      const targetOpacity = computeBeat5LayerOpacity(v, p)

      // [DIAG S4/S5] Log at boundary crossings (first-tick, start, end,
      // peak, tail-start, tail-end) so we can correlate the per-frame
      // opacity the arbiter intends vs. what Mapbox actually carries.
      const stage =
        v < p.fadeInStart
          ? "pre-fade-in"
          : v < p.fadeInEnd
            ? "during-fade-in"
            : v < p.holdUntil
              ? "peak-hold"
              : v < p.tailEnd
                ? "during-tail-fade"
                : "post-tail"
      const key = stage
      if (!this.diagBoundariesLogged.has(key)) {
        this.diagBoundariesLogged.add(key)
        debugLog(
          `MapPaintArbiter beat5-layer-fade stage=${stage} v=${v.toFixed(4)} target=${targetOpacity.toFixed(3)}`,
        )
        logDuState(`beat5-layer-fade stage=${stage}`, map)
      }

      try {
        if (map.getLayer("demand-units")) {
          map.setPaintProperty("demand-units", "fill-opacity", targetOpacity)
        }
        if (map.getLayer("demand-units-outline")) {
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            targetOpacity,
          )
        }
      } catch {
        /* ok */
      }
    }
    // `beat5-poly-ring` stays on for the whole window. No per-tick
    // write. `beat5-enter` and `beat5-exit` are one-shot actors.
    // Nothing to do per tick.
  }

  onExit(actor: MapPaintActor, _v: number, ctx: BeatEngineContext): void {
    const map = getStyledMap(ctx)
    if (!map) return

    const p = actor.payload
    if (p.kind === "beat5-poly-ring") {
      this.applyBeat5PolyRingOff(map, ctx)
    }
    // All other exits are handled by the companion `beat5-exit` actor's
    // enter hook, not here. Same rationale as the old listener's
    // `phase === "beat5"` restore block.
  }

  teardown(ctx: BeatEngineContext): void {
    // Force off whatever state we might still be carrying. Called from
    // the engine on unmount and from `clearInteractiveState` on nav.
    if (!this.beat5PolyRingOn) return
    const map = getStyledMap(ctx)
    if (!map) return
    this.applyBeat5PolyRingOff(map, ctx)
  }

  // Paint sequences

  /** Write the `basemap-dim-overlay` fill-opacity for the current `v`.
   *  Mirrors the legacy main-listener ramp at TierAnimationSection.tsx
   *  lines 2173 to 2191. Pure function of `v`, idempotent within a
   *  tick. Safe to call from every beat enter and from the cycle
   *  update without redundant-write flicker. */
  private applyBasemapDimRamp(map: StyledMap, v: number): void {
    try {
      if (!map.getLayer("basemap-dim-overlay")) return
      const dimFadeT = Math.min(1, v / BASEMAP_DIM_FADE_END)
      map.setPaintProperty(
        "basemap-dim-overlay",
        "fill-opacity",
        BASEMAP_DIM_OPACITY * dimFadeT,
      )
    } catch {
      /* ok */
    }
  }

  private applyReset(map: StyledMap): void {
    // Pre-beat-1 baseline. Mirrors the main-choreography listener's
    // `v < 0.01` branch at TierAnimationSection.tsx lines 2166 to 2210.
    // Full-state assertion via `writeDemandUnitsBaseline` so we do not
    // inherit a partial paint from whatever was on the layer before
    // (a previous Beat 4 tail, an interactive OPL teardown, etc.).
    //
    // Opacity is seeded to 0 here. Beat 1's fade-in ramp then takes
    // over and brings the layer up from 0 as `v` moves past the reset
    // window into the Beat 1 cycle.
    const resetExpr = beat1FillExpr(0)
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: resetExpr,
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    // Basemap-dim overlay is not a demand-units layer, so the baseline
    // helper does not touch it. The pre-beat-1 state has the basemap
    // undimmed. Beat 1's first-tick fade-in ramp then drives it up to
    // `BASEMAP_DIM_OPACITY`.
    try {
      if (map.getLayer("basemap-dim-overlay")) {
        map.setPaintProperty("basemap-dim-overlay", "fill-opacity", 0)
      }
    } catch {
      /* ok */
    }
    // Reset arbiter-owned ring state. If we are arriving at reset from
    // a mid-Beat 4 Restart, the gold ring closure has already been
    // cleared by `clearInteractiveState` -> `teardown()`. Clearing it
    // here a second time is idempotent and keeps the invariant local.
    this.beat5PolyRingOn = false
    this.frozenColorPhase = 0
    this.diagBoundariesLogged.clear()
  }

  private applyBeat1CycleEnter(map: StyledMap, v: number): void {
    // Full-state baseline at cycle start. In the common forward-play
    // case the reset actor just fired, so the layers are already in
    // this exact state. We re-assert anyway so scrubbing forward
    // from anywhere past Beat 1 and landing in the cycle window does
    // not inherit a stale filter or color expression from a later
    // beat. `fillExpr` is seeded at phase 0 so the very first update
    // tick has a sensible baseline. `onUpdate` overwrites it on the
    // same tick with the real cycling phase.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: beat1FillExpr(0),
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat1CycleUpdate(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1-cycle" }>,
    v: number,
  ): void {
    // Compute cycle position. `beat1T` ramps 0 to 1 across the
    // `[cycleStart, cycleEnd)` window. `colorPhase` rotates through
    // the palette, stored on the arbiter so `beat1-hold` can resume
    // from wherever the cycle settled on its final tick.
    const span = p.cycleEnd - p.cycleStart
    const beat1T = span > 0 ? (v - p.cycleStart) / span : 0
    const colorPhase = beat1T * p.cycleRotations
    this.frozenColorPhase = colorPhase

    // Opacity ramp: linear fade-in across the first `fadeInFrac` of
    // the window, then peak with a `breathAmplitude` sine
    // oscillation for the rest.
    const fadeIn = Math.min(1, beat1T / p.fadeInFrac)
    const base = p.peakOpacity * fadeIn
    const breath =
      fadeIn >= 1 ? p.breathAmplitude * Math.sin(beat1T * Math.PI * 4) : 0
    const opacity = base + breath

    try {
      const expr = beat1FillExpr(colorPhase)
      if (map.getLayer("demand-units")) {
        map.setPaintProperty("demand-units", "fill-color", expr)
        map.setPaintProperty("demand-units", "fill-outline-color", expr)
        map.setPaintProperty("demand-units", "fill-opacity", opacity)
      }
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color", expr)
        map.setPaintProperty("demand-units-outline", "line-opacity", opacity)
      }
    } catch {
      /* ok */
    }
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat1HoldEnter(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1-hold" }>,
    v: number,
  ): void {
    // Full-state baseline seeded with the arbiter's stored
    // `frozenColorPhase`. Covers both entry from the cycle (forward
    // play) and entry from a later beat via scrub-back. In both cases
    // we want full DU filter, the frozen 3-blue palette, and opacity
    // pinned at `peakOpacity`.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: beat1FillExpr(this.frozenColorPhase),
      fillOpacity: { kind: "scalar", value: p.peakOpacity },
      lineOpacity: { kind: "scalar", value: p.peakOpacity },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat1HoldUpdate(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1-hold" }>,
  ): void {
    // Re-assert opacity every tick so any stray writer that lands on
    // the layer during the hold is self-healing. The legacy listener
    // did the same (lines 2257 and 2267 wrote 0.65 every tick inside
    // the frozen and Beat 1B sub-branches). Color expression is not
    // rewritten every tick, which matches the legacy listener's
    // `phase !== "beat1"` guard.
    try {
      if (map.getLayer("demand-units")) {
        map.setPaintProperty("demand-units", "fill-opacity", p.peakOpacity)
      }
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity",
          p.peakOpacity,
        )
      }
    } catch {
      /* ok */
    }
  }

  private applyBeat1cBlendEnter(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1c-blend" }>,
    v: number,
  ): void {
    // Full-state baseline seeded for the convergence sub-window. The
    // first `onUpdate` tick overwrites fill-color with the real
    // ramping expression. Opacity is seeded at `peakOpacity` (not 0)
    // so the handoff from the Beat 1 hold does not flash invisible
    // for one frame. Filter stays on `DU_CLASS_FILTER` across the
    // whole blend. `beat1c-tail.onEnter` is what flips to AG-only.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: beat1FillExpr(this.frozenColorPhase, 0),
      fillOpacity: { kind: "scalar", value: p.peakOpacity },
      lineOpacity: { kind: "scalar", value: p.peakOpacity },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat1cBlendUpdate(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1c-blend" }>,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    // Two-stage blend. First half shrinks the 3-blue palette toward
    // `BEAT1_MID` via `beat1FillExpr(frozenColorPhase, convergence)`.
    // Second half morphs `BEAT1_MID` into each AG DU's tier color via
    // `ctx.buildBlendedTierExpr(BEAT1_MID, t)`.
    let expr: readonly unknown[] | null
    if (v < p.convergeEnd) {
      const convergence = (v - p.blendStart) / (p.convergeEnd - p.blendStart)
      expr = beat1FillExpr(this.frozenColorPhase, convergence)
    } else {
      const t = (v - p.convergeEnd) / (p.blendEnd - p.convergeEnd)
      expr = ctx.buildBlendedTierExpr(BEAT1_MID, t) as readonly unknown[] | null
    }

    if (!expr) return

    try {
      if (map.getLayer("demand-units")) {
        map.setPaintProperty("demand-units", "fill-color", expr)
        map.setPaintProperty("demand-units", "fill-outline-color", expr)
        map.setPaintProperty("demand-units", "fill-opacity", p.peakOpacity)
      }
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color", expr)
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity",
          p.peakOpacity,
        )
      }
    } catch {
      /* ok */
    }
  }

  private applyBeat1cTailEnter(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat1c-tail" }>,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // Static hold. AG-only filter, fully blended tier colors, pinned
    // opacity. The legacy listener wrote this once on the
    // `phase !== "beat1c"` transition and never re-asserted. The
    // baseline helper makes this full-state assertion idempotent,
    // which also makes scrub-back from Beat 2 into the tail window
    // self-healing. `buildBlendedTierExpr` may return null if the
    // tier table has not loaded. In that case we fall back to the
    // last fill expression on the layer (no `fillExpr` write).
    const blendedTier = ctx.buildBlendedTierExpr(BEAT1_MID, 1) as
      | readonly unknown[]
      | null
    writeDemandUnitsBaseline(map, {
      filter: DU_AG_ONLY_FILTER,
      fillExpr: blendedTier,
      fillOpacity: { kind: "scalar", value: p.peakOpacity },
      lineOpacity: { kind: "scalar", value: p.peakOpacity },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat2HideScheduleEnter(
    map: StyledMap,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // Restore the full DU class filter and the blended tier fill
    // expression. The previous actor (`beat1c-tail`) left the layer
    // on an AG-only filter with a scalar opacity. The baseline helper
    // preserves opacity here because `applyBeat2HideScheduleUpdate`
    // fires on the same tick and overwrites `fill-opacity` and
    // `line-opacity` with the full per-DU case expression. Preserving
    // in between means the last tick's opacity stays on the layer for
    // one tick's worth of time, not one frame's worth. Mapbox commits
    // once per frame and both writes land before the next commit, so
    // no flicker is observable.
    //
    // If `buildBlendedTierExpr` returns null (tier data not loaded),
    // the baseline helper leaves `fill-color` on its last value, which
    // matches legacy's `if (expr && ...)` guard.
    const blendedTier = ctx.buildBlendedTierExpr(BEAT1_MID, 1) as
      | readonly unknown[]
      | null
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: blendedTier,
      fillOpacity: { kind: "preserve" },
      lineOpacity: { kind: "preserve" },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat2HideScheduleUpdate(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat2-hide-schedule" }>,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    // Build the per-DU opacity case expression from the live hide
    // schedule. Matches the legacy `paintDuHideSchedule` closure at
    // TierAnimationSection.tsx lines 2333 to 2397.
    //
    //   Tracked DU, pre-fade (v < fadeStart)       peakOpacity
    //   Tracked DU, in-fade (fadeStart .. morphStart) peakOpacity * (1 - t)
    //   Agriculture fallback, pre-window           peakOpacity
    //   Agriculture fallback, in-window            peakOpacity * (1 - t)
    //   Agriculture fallback, post-window          0
    //   Everything else (Urban, Refuge, untracked) 0
    //
    // AG_REV is excluded from the per-outcome schedule (the schedule
    // builder skips it) so its DUs flow through the Agriculture
    // fallback and fade across `[agFadeOutStart, agFadeOutEnd)`.
    if (!map.getLayer("demand-units")) return

    const schedule = ctx.getHideSchedule()
    const duEntries: {
      fadeStart: number
      morphStart: number
      locationIds: readonly string[]
    }[] = []
    for (const entry of schedule) {
      if (
        entry.geometryType === "polygon" &&
        entry.mapboxLayerId === "demand-units"
      ) {
        duEntries.push(entry)
      }
    }

    if (duEntries.length === 0) return

    const caseExpr: unknown[] = ["case"]
    for (const entry of duEntries) {
      if (v < entry.fadeStart) {
        caseExpr.push(
          ["in", ["get", "DU_ID"], ["literal", entry.locationIds]],
          p.peakOpacity,
        )
      } else {
        const fadeDuration = entry.morphStart - entry.fadeStart
        const t = Math.min(1, (v - entry.fadeStart) / fadeDuration)
        const opacity = p.peakOpacity * (1 - t)
        caseExpr.push(
          ["in", ["get", "DU_ID"], ["literal", entry.locationIds]],
          opacity,
        )
      }
    }

    let agOpacity: number
    if (v < p.agFadeOutStart) {
      agOpacity = p.peakOpacity
    } else if (v < p.agFadeOutEnd) {
      const t = (v - p.agFadeOutStart) / (p.agFadeOutEnd - p.agFadeOutStart)
      agOpacity = p.peakOpacity * (1 - t)
    } else {
      agOpacity = 0
    }
    caseExpr.push(["==", ["get", "Class"], "Agriculture"], agOpacity)
    caseExpr.push(0)

    try {
      map.setPaintProperty("demand-units", "fill-opacity", caseExpr)
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-opacity", caseExpr)
      }
    } catch {
      /* ok */
    }
  }

  private applyBeat6RestoreEnter(
    map: StyledMap,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // One-shot full-state baseline for the post-Beat 5 tail. Restores
    // the full DU class filter and the blended AG tier expression
    // (taking ownership back from the Beat 5 cluster's AG-only
    // filter), pins the outline line-width at the default 0.5 (the
    // gold-ring cleanup ran in `beat5-exit.applyBeat5Exit`), and
    // pins both fill-opacity and line-opacity at scalar 0.
    //
    // Mirrors the legacy listener's Beat 6+ branch at
    // TierAnimationSection.tsx lines 2425 to 2456, which combined
    // the closure-local `enterBeat2Phase()` (filter + colors +
    // line-width) with `paintDuHideSchedule()` (per-tick case
    // expression). At this point in the timeline every tracked DU is
    // past its `morphStart` and the AG-class fallback is past
    // `agFadeOutEnd`, so the case expression evaluates to scalar 0
    // for every feature. We collapse it to a single scalar write
    // here, behaviorally equivalent and cheaper.
    //
    // Reverse scrubs back into Beat 5 are handled by the Beat 5
    // cluster's own `onEnter`, which performs its own
    // full-state baseline assertion.
    const blendedTier = ctx.buildBlendedTierExpr(BEAT1_MID, 1) as
      | readonly unknown[]
      | null
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: blendedTier,
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyLineFadesUpdate(
    map: StyledMap,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    // Per-line-layer fade for the line-geometry outcomes in the hide
    // schedule. Mirrors the legacy listener's trailing line-fade loop
    // at TierAnimationSection.tsx lines 2458 to 2481.
    //
    // The pre-window guard matters. Without it the tight 0.005 fade
    // span amplifies any negative `v - fadeStart` into a huge
    // negative `t`, and `1 - t` overflows Mapbox's clamped
    // line-opacity range.
    //
    // No resource conflict with the polygon arbiters. Line layers
    // (`cwf-flowline`, `delta-detaw-line`, etc.) are disjoint from
    // `demand-units` and `demand-units-outline`. The writers audit
    // does not constrain line layers and the schedule keeps line
    // and polygon entries on different `geometryType` keys.
    const schedule = ctx.getHideSchedule()
    for (const entry of schedule) {
      if (entry.geometryType !== "line" || !entry.mapboxLayerId) continue
      let opacity: number
      if (v < entry.fadeStart) {
        opacity = 1
      } else {
        const fadeDuration = entry.morphStart - entry.fadeStart
        const t = Math.min(1, (v - entry.fadeStart) / fadeDuration)
        opacity = 1 - t
      }
      try {
        if (map.getLayer(entry.mapboxLayerId)) {
          map.setPaintProperty(entry.mapboxLayerId, "line-opacity", opacity)
        }
      } catch {
        /* ok */
      }
    }
  }

  private applyBeat5Enter(
    map: StyledMap,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    logDuState("MapPaintArbiter.applyBeat5Enter PRE", map)
    // The arbiter is the sole authority on the Mapbox state of
    // `demand-units` and `demand-units-outline` for the duration of
    // Beat 5. We cannot trust whoever ran before us (OPL unmount,
    // interactive paint effect, half-completed teardown) to leave
    // these layers in a clean, renderable state, so we delegate to
    // `writeDemandUnitsBaseline`, which asserts the full property
    // set invariant 2 of the hardening plan requires:
    //   filter, fill/outline color, fill/line opacity, all four
    //   transitions zeroed, line width, line offset, visibility.
    // The opacity is seeded to 0. The companion `beat5-layer-fade`
    // actor then ramps it up to `peakOpacity` across the fade-in
    // window.
    writeDemandUnitsBaseline(map, {
      filter: DU_AG_ONLY_FILTER,
      fillExpr: ctx.buildBlendedTierExpr(BEAT1_MID, 1),
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.beat5PolyRingOn = false
    this.diagBoundariesLogged.clear()
    this.applyBasemapDimRamp(map, v)
    logDuState("MapPaintArbiter.applyBeat5Enter POST", map)
  }

  private applyBeat5PolyRingOn(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat5-poly-ring" }>,
    ctx: BeatEngineContext,
  ): void {
    if (this.beat5PolyRingOn) return
    try {
      const baseExpr = ctx.buildBlendedTierExpr(BEAT1_MID, 1)
      if (map.getLayer("demand-units-outline") && baseExpr) {
        const match = ["==", ["get", "DU_ID"], p.loiDuId]
        map.setPaintProperty("demand-units-outline", "line-color", [
          "case",
          match,
          p.goldHex,
          baseExpr,
        ] as never)
        map.setPaintProperty("demand-units-outline", "line-width", [
          "case",
          match,
          2,
          0.5,
        ] as never)
      }
    } catch {
      /* ok */
    }
    this.beat5PolyRingOn = true
  }

  private applyBeat5PolyRingOff(map: StyledMap, ctx: BeatEngineContext): void {
    try {
      const baseExpr = ctx.buildBlendedTierExpr(BEAT1_MID, 1)
      if (map.getLayer("demand-units-outline") && baseExpr) {
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          baseExpr as never,
        )
      }
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-width", 0.5)
      }
    } catch {
      /* ok */
    }
    this.beat5PolyRingOn = false
  }

  private applyBeat5Exit(
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat5-exit" }>,
    ctx: BeatEngineContext,
  ): void {
    // One-shot ring clear at the trailing edge of Beat 5. If the
    // gold polygon ring is still on (step 4 was active when the
    // window closed), restore the blended tier expression and
    // default outline line-width on `demand-units-outline`.
    //
    // The full DU filter restore (and blended tier expression on
    // both `demand-units` and `demand-units-outline`) lives in the
    // sibling `beat6:mapPaint:restore.onEnter` (Phase 1.g), which
    // fires on the first tick after `BEAT5_TAIL_END`. The two writes
    // are sequenced by the engine's per-tick dispatch order
    // (onExit -> onEnter -> onUpdate), so the ring clear here always
    // precedes the restore baseline.
    if (p.clearRing && this.beat5PolyRingOn) {
      this.applyBeat5PolyRingOff(map, ctx)
    }
  }
}

// Helpers

type StyledMap = {
  isStyleLoaded?: () => boolean
  getLayer: (id: string) => unknown
  setFilter: (id: string, f: unknown) => void
  setPaintProperty: (id: string, prop: string, value: unknown) => void
  setLayoutProperty: (id: string, prop: string, value: unknown) => void
}

function getStyledMap(ctx: BeatEngineContext): StyledMap | null {
  const map = ctx.mapRef?.current?.getMap?.() as StyledMap | null | undefined
  if (!map) return null
  if (!map.isStyleLoaded?.()) return null
  return map
}

/** Opacity ramp for the Beat 5 AG demand-units layer.
 *
 * AG polygons enter Beat 4 at opacity 0. The main choreography's
 * `paintDuHideSchedule` fades them out at the tail of Beat 2 and
 * holds them at 0 through Beat 3, so the layer is invisible at the
 * Beat 4 boundary. We ramp them back in across
 * `[fadeInStart, fadeInEnd]`, hold at `peakOpacity` through the whole
 * LOI sequence, then tail-fade to 0 across `[holdUntil, tailEnd]` so
 * Beat 5 starts clean. */
function computeBeat5LayerOpacity(
  v: number,
  p: Extract<MapPaintPayload, { kind: "beat5-layer-fade" }>,
): number {
  if (v < p.fadeInStart) return 0
  if (v < p.fadeInEnd) {
    const t = (v - p.fadeInStart) / (p.fadeInEnd - p.fadeInStart)
    return p.peakOpacity * t
  }
  if (v < p.holdUntil) return p.peakOpacity
  if (v < p.tailEnd) {
    const t = (v - p.holdUntil) / (p.tailEnd - p.holdUntil)
    return p.peakOpacity * (1 - t)
  }
  return 0
}
