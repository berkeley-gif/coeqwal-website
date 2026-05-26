/* MapPaintArbiter. The owner of Mapbox DU paint in the Explorer Get Started animation*/

import type { MapboxGLMap } from "@repo/map"
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
  type MapWriteView,
} from "../demandUnitsBaseline"
import { BEAT1_MID, beat1FillExpr } from "../beat1Palette"
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

  onEnter(actor: MapPaintActor, v: number, ctx: BeatEngineContext): void {
    const map = getMapWriteView(ctx)
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
    const map = getMapWriteView(ctx)
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
    // `Static hold written once by `onEnter`. No
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
    const map = getMapWriteView(ctx)
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
    const map = getMapWriteView(ctx)
    if (!map) return
    this.applyBeat5PolyRingOff(map, ctx)
  }

  // Paint sequences

  /** Write the `basemap-dim-overlay` fill-opacity for the current `v`.
   *  Mirrors the legacy main-listener ramp at TierAnimationSection.tsx
   *  lines 2173 to 2191. Pure function of `v`, idempotent within a
   *  tick. Safe to call from every beat enter and from the cycle
   *  update without redundant-write flicker. */
  private applyBasemapDimRamp(map: MapWriteView, v: number): void {
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

  private applyReset(map: MapWriteView): void {
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
  }

  private applyBeat1CycleEnter(map: MapWriteView, v: number): void {
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
    map: MapWriteView,
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
    map: MapWriteView,
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
    map: MapWriteView,
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
    map: MapWriteView,
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
    map: MapWriteView,
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
    map: MapWriteView,
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
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // Restore the full DU class filter and the blended tier fill
    // expression.
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
    map: MapWriteView,
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
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
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
    map: MapWriteView,
    v: number,
    ctx: BeatEngineContext,
  ): void {
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
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
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
    this.applyBasemapDimRamp(map, v)
  }

  private applyBeat5PolyRingOn(
    map: MapWriteView,
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

  private applyBeat5PolyRingOff(
    map: MapWriteView,
    ctx: BeatEngineContext,
  ): void {
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
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "beat5-exit" }>,
    ctx: BeatEngineContext,
  ): void {
    // Ring clear
    if (p.clearRing && this.beat5PolyRingOn) {
      this.applyBeat5PolyRingOff(map, ctx)
    }
  }
}

// Helpers

function getMapWriteView(ctx: BeatEngineContext): MapWriteView | null {
  const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
  if (!map) return null
  if (!map.isStyleLoaded()) return null
  return map as unknown as MapWriteView
}

/** Opacity ramp */
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
