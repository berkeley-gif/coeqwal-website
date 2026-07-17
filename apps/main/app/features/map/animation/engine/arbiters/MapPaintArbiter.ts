/* MapPaintArbiter: the storyboard's map painter
 *
 * Writes the `demand-units` layers and basemap dim overlay from
 * progress-keyed actors during playback. See "Who paints the map" in
 * README.md.
 */

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
import { BLUE_MID, blueFillExpr } from "../bluePalette"
import { BASEMAP_DIM_OPACITY } from "../../../../map/config/outcomeLayerRegistry"

/** Progress window for fading in the dark basemap overlay. Holds at 0
 *  through the reset window, ramps to `BASEMAP_DIM_OPACITY`, then holds.
 *  Re-applied each beat so scrubbing back doesn't leave it half-faded.
 *  Start matches `RESET_END` in `actorGroups.ts`. Without that offset the
 *  ramp begins partway up at the hand-off and pops in. */
const BASEMAP_DIM_FADE_START = 0.01
const BASEMAP_DIM_FADE_END = 0.07

export class MapPaintArbiter implements Arbiter<MapPaintActor> {
  readonly kind = "mapPaint" as const

  /** True when the `demand-units-outline` layer is currently drawing
   *  the gold ring around the LOI. */
  private loiGoldRingOn = false

  /** The color step the blue cycle last landed on. The cycle writes it
   *  each frame. The blue hold reads it to freeze the palette. Starts
   *  at 0 so a hold before any cycle uses the reset palette. */
  private frozenColorPhase = 0

  onEnter(actor: MapPaintActor, v: number, ctx: BeatEngineContext): void {
    const map = getMapWriteView(ctx)
    if (!map) return

    const p = actor.payload
    switch (p.kind) {
      case "reset":
        this.applyReset(map)
        return
      case "blue-cycle":
        this.applyBlueCycleEnter(map, v)
        return
      case "blue-hold":
        this.applyBlueHoldEnter(map, p, v)
        return
      case "tier-color-blend":
        this.applyTierColorBlendEnter(map, p, v)
        return
      case "tier-color-hold":
        this.applyTierColorHoldEnter(map, p, ctx, v)
        return
      case "polygon-hide-schedule":
        this.applyPolygonHideScheduleEnter(map, ctx, v)
        return
      case "du-clear-hold":
        this.applyDuClearHoldEnter(map, ctx, v)
        return
      case "line-hide-schedule":
        // Nothing to do on enter. The first update frame sets the line
        // opacities from the schedule.
        return
      case "loi-enter":
        this.applyLoiEnter(map, ctx, v)
        return
      case "loi-gold-ring":
        this.applyLoiGoldRingOn(map, p, ctx)
        return
      case "loi-layer-fade":
        // Nothing to do on enter. The fade starts on the first update
        // frame. Layer setup already ran in the `loi-enter` actor,
        // which shares this window start.
        return
      case "loi-exit":
        // Fires on the frame that just crossed out of the loi-highlight
        // window. Runs the one-time hand-off back to the ag-rev-morph
        // paint.
        this.applyLoiExit(map, p, ctx)
        return
    }
  }

  onUpdate(actor: MapPaintActor, v: number, ctx: BeatEngineContext): void {
    const map = getMapWriteView(ctx)
    if (!map) return

    const p = actor.payload
    if (p.kind === "blue-cycle") {
      this.applyBlueCycleUpdate(map, p, v)
      return
    }
    if (p.kind === "blue-hold") {
      this.applyBlueHoldUpdate(map, p)
      return
    }
    if (p.kind === "tier-color-blend") {
      this.applyTierColorBlendUpdate(map, p, v, ctx)
      return
    }
    // `tier-color-hold` is written once on enter, so it has no update branch.
    if (p.kind === "polygon-hide-schedule") {
      this.applyPolygonHideScheduleUpdate(map, p, v, ctx)
      return
    }
    if (p.kind === "line-hide-schedule") {
      this.applyLineHideScheduleUpdate(map, v, ctx)
      return
    }
    // `du-clear-hold` runs once on enter. Updating would just re-write
    // a zero that's already there, so there's no update branch.
    if (p.kind === "loi-layer-fade") {
      const targetOpacity = computeLoiLayerOpacity(v, p)

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
    // `loi-gold-ring` stays on for its whole window, and
    // `loi-enter`/`loi-exit` are one-shot, so nothing to update here.
  }

  onExit(actor: MapPaintActor, _v: number, ctx: BeatEngineContext): void {
    const map = getMapWriteView(ctx)
    if (!map) return

    const p = actor.payload
    if (p.kind === "loi-gold-ring") {
      this.applyLoiGoldRingOff(map, ctx)
    }
    // Every other exit is handled by the `loi-exit` actor's enter
    // hook, not here.
  }

  teardown(ctx: BeatEngineContext): void {
    // Clear any leftover state. Called on unmount and on navigation.
    if (!this.loiGoldRingOn) return
    const map = getMapWriteView(ctx)
    if (!map) return
    this.applyLoiGoldRingOff(map, ctx)
  }

  // Paint sequences

  /** Write the `basemap-dim-overlay` fill-opacity for the current `v`. */
  private applyBasemapDimRamp(map: MapWriteView, v: number): void {
    try {
      if (!map.getLayer("basemap-dim-overlay")) return
      const dimSpan = BASEMAP_DIM_FADE_END - BASEMAP_DIM_FADE_START
      const dimFadeT =
        dimSpan > 0
          ? Math.min(1, Math.max(0, (v - BASEMAP_DIM_FADE_START) / dimSpan))
          : 1
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
    // Pre-cycle baseline, full-state assertion via
    // `writeDemandUnitsBaseline`. Opacity seeded to 0. The blue cycle's
    // fade-in ramp brings the layer up as `v` passes into the cycle.
    const resetExpr = blueFillExpr(0)
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: resetExpr,
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    // The baseline helper only touches the demand-units layers, so
    // reset the basemap dim overlay to 0 here. Beat 1 fades it back in.
    try {
      if (map.getLayer("basemap-dim-overlay")) {
        map.setPaintProperty("basemap-dim-overlay", "fill-opacity", 0)
      }
    } catch {
      /* ok */
    }
    // Reset arbiter-owned ring state. Safe to clear here even when
    // `teardown()` already cleared it on a Restart.
    this.loiGoldRingOn = false
    this.frozenColorPhase = 0
  }

  private applyBlueCycleEnter(map: MapWriteView, v: number): void {
    // Clean baseline at cycle start. Forward play already has this, but
    // re-applying means scrubbing back from a later beat doesn't inherit
    // a stale filter or color. The first update frame overwrites the
    // seeded color with the real cycling color.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: blueFillExpr(0),
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBlueCycleUpdate(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "blue-cycle" }>,
    v: number,
  ): void {
    // `cycleT` goes 0 to 1 across the window. `colorPhase` rotates
    // through the palette and is saved so the blue hold can pick up
    // where the cycle stopped.
    const span = p.cycleEnd - p.cycleStart
    const cycleT = span > 0 ? (v - p.cycleStart) / span : 0
    const colorPhase = cycleT * p.cycleRotations
    this.frozenColorPhase = colorPhase

    // Fade in over the first `fadeInFrac` of the window, then hold at
    // peak with a gentle `breathAmplitude` sine wobble.
    const fadeIn = Math.min(1, cycleT / p.fadeInFrac)
    const base = p.peakOpacity * fadeIn
    const breath =
      fadeIn >= 1 ? p.breathAmplitude * Math.sin(cycleT * Math.PI * 4) : 0
    const opacity = base + breath

    try {
      const expr = blueFillExpr(colorPhase)
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

  private applyBlueHoldEnter(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "blue-hold" }>,
    v: number,
  ): void {
    // Reset the layers using the saved `frozenColorPhase`. Works
    // whether we arrive from the cycle (forward) or by scrubbing back
    // from a later beat: full filter, frozen blue palette, opacity
    // pinned at `peakOpacity`.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: blueFillExpr(this.frozenColorPhase),
      fillOpacity: { kind: "scalar", value: p.peakOpacity },
      lineOpacity: { kind: "scalar", value: p.peakOpacity },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyBlueHoldUpdate(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "blue-hold" }>,
  ): void {
    // Re-assert opacity each frame. The color doesn't change during the
    // hold.
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

  private applyTierColorBlendEnter(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "tier-color-blend" }>,
    v: number,
  ): void {
    // Reset for the convergence sub-window. The first update frame writes
    // the real ramping color. Opacity starts at `peakOpacity`, not 0, so
    // the hand-off from the blue hold doesn't flash invisible. The filter
    // stays full through the blend. `tier-color-hold` switches to AG-only.
    writeDemandUnitsBaseline(map, {
      filter: DU_CLASS_FILTER,
      fillExpr: blueFillExpr(this.frozenColorPhase, 0),
      fillOpacity: { kind: "scalar", value: p.peakOpacity },
      lineOpacity: { kind: "scalar", value: p.peakOpacity },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.applyBasemapDimRamp(map, v)
  }

  private applyTierColorBlendUpdate(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "tier-color-blend" }>,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    // Two stages. First half collapses the three blues toward
    // `BLUE_MID`. Second half blends `BLUE_MID` into each AG unit's
    // tier color.
    let expr: readonly unknown[] | null
    if (v < p.convergeEnd) {
      const convergence = (v - p.blendStart) / (p.convergeEnd - p.blendStart)
      expr = blueFillExpr(this.frozenColorPhase, convergence)
    } else {
      const t = (v - p.convergeEnd) / (p.blendEnd - p.convergeEnd)
      expr = ctx.buildBlendedTierExpr(BLUE_MID, t) as readonly unknown[] | null
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

  private applyTierColorHoldEnter(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "tier-color-hold" }>,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // Static hold: AG-only filter, fully blended tier colors, pinned
    // opacity. Writing the full state means scrubbing back from
    // ag-rev-morph self-heals. If the tier table hasn't loaded,
    // `buildBlendedTierExpr` returns null and we keep current colors.
    const blendedTier = ctx.buildBlendedTierExpr(BLUE_MID, 1) as
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

  private applyPolygonHideScheduleEnter(
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    // Restore the full DU class filter and the blended tier fill
    // expression.
    const blendedTier = ctx.buildBlendedTierExpr(BLUE_MID, 1) as
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

  private applyPolygonHideScheduleUpdate(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "polygon-hide-schedule" }>,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    // Build the per-unit opacity expression from the live hide
    // schedule:
    //
    //   Tracked DU, pre-fade (v < fadeStart)       peakOpacity
    //   Tracked DU, in-fade (fadeStart .. morphStart) peakOpacity * (1 - t)
    //   Agriculture fallback, pre-window           peakOpacity
    //   Agriculture fallback, in-window            peakOpacity * (1 - t)
    //   Agriculture fallback, post-window          0
    //   Everything else (Urban, Refuge, untracked) 0
    //
    // AG_REV isn't in the schedule, so its units use the Agriculture
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

  private applyDuClearHoldEnter(
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    const blendedTier = ctx.buildBlendedTierExpr(BLUE_MID, 1) as
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

  private applyLineHideScheduleUpdate(
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

  private applyLoiEnter(
    map: MapWriteView,
    ctx: BeatEngineContext,
    v: number,
  ): void {
    writeDemandUnitsBaseline(map, {
      filter: DU_AG_ONLY_FILTER,
      fillExpr: ctx.buildBlendedTierExpr(BLUE_MID, 1),
      fillOpacity: { kind: "scalar", value: 0 },
      lineOpacity: { kind: "scalar", value: 0 },
      lineWidth: 0.5,
      lineOffset: -0.25,
      visibility: "visible",
    })
    this.loiGoldRingOn = false
    this.applyBasemapDimRamp(map, v)
  }

  private applyLoiGoldRingOn(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "loi-gold-ring" }>,
    ctx: BeatEngineContext,
  ): void {
    if (this.loiGoldRingOn) return
    try {
      const baseExpr = ctx.buildBlendedTierExpr(BLUE_MID, 1)
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
    this.loiGoldRingOn = true
  }

  private applyLoiGoldRingOff(map: MapWriteView, ctx: BeatEngineContext): void {
    try {
      const baseExpr = ctx.buildBlendedTierExpr(BLUE_MID, 1)
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
    this.loiGoldRingOn = false
  }

  private applyLoiExit(
    map: MapWriteView,
    p: Extract<MapPaintPayload, { kind: "loi-exit" }>,
    ctx: BeatEngineContext,
  ): void {
    // Ring clear
    if (p.clearRing && this.loiGoldRingOn) {
      this.applyLoiGoldRingOff(map, ctx)
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
function computeLoiLayerOpacity(
  v: number,
  p: Extract<MapPaintPayload, { kind: "loi-layer-fade" }>,
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
