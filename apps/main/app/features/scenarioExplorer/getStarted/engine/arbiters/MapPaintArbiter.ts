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
 */

import type {
  Arbiter,
  BeatEngineContext,
  MapPaintActor,
  MapPaintPayload,
} from "../types"

// Shared with the beat table. Kept as module constants here because
// they are Mapbox-filter and layer-id strings, not beat timings.
const DU_AG_ONLY_FILTER = ["==", ["get", "Class"], "Agriculture"] as const
const BEAT1_MID = "#92C1D5"

export class MapPaintArbiter implements Arbiter<MapPaintActor> {
  readonly kind = "mapPaint" as const

  /** Gold-ring state. True iff the `demand-units-outline` layer is
   *  currently carrying a `case` expression that strokes the LOI in
   *  gold. Mirrors the `beat5PolyRingOn` closure variable in the old
   *  main-choreography listener. */
  private beat5PolyRingOn = false

  onEnter(
    actor: MapPaintActor,
    _v: number,
    ctx: BeatEngineContext,
  ): void {
    const map = getStyledMap(ctx)
    if (!map) return

    const p = actor.payload
    switch (p.kind) {
      case "beat5-enter":
        this.applyBeat5Enter(map)
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

  onUpdate(
    actor: MapPaintActor,
    v: number,
    ctx: BeatEngineContext,
  ): void {
    const map = getStyledMap(ctx)
    if (!map) return

    const p = actor.payload
    if (p.kind === "beat5-layer-fade") {
      const targetOpacity = computeBeat5LayerOpacity(v, p)
      try {
        if (map.getLayer("demand-units")) {
          map.setPaintProperty(
            "demand-units",
            "fill-opacity",
            targetOpacity,
          )
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

  onExit(
    actor: MapPaintActor,
    _v: number,
    ctx: BeatEngineContext,
  ): void {
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

  private applyBeat5Enter(map: StyledMap): void {
    try {
      if (map.getLayer("demand-units")) {
        map.setFilter("demand-units", DU_AG_ONLY_FILTER as never)
        map.setPaintProperty("demand-units", "fill-opacity", 0)
      }
      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", DU_AG_ONLY_FILTER as never)
        map.setPaintProperty("demand-units-outline", "line-opacity", 0)
        map.setPaintProperty("demand-units-outline", "line-width", 0.5)
      }
    } catch {
      /* ok */
    }
    this.beat5PolyRingOn = false
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
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          ["case", match, p.goldHex, baseExpr] as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          ["case", match, 2, 0.5] as never,
        )
      }
    } catch {
      /* ok */
    }
    this.beat5PolyRingOn = true
  }

  private applyBeat5PolyRingOff(
    map: StyledMap,
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
    map: StyledMap,
    p: Extract<MapPaintPayload, { kind: "beat5-exit" }>,
    ctx: BeatEngineContext,
  ): void {
    // Mirror the main-choreography listener's `phase === "beat5"`
    // branch at TierAnimationSection.tsx lines 2384 to 2401. If the
    // gold ring is still on, clear it. The main listener's
    // `enterBeat2Phase` then runs on the same tick to restore the full
    // DU filter and the blended tier expression. We do not run
    // `enterBeat2Phase` here. Ownership of that hand-off stays with the
    // main listener, which sees `phase !== "beat2"` on the next tick
    // and runs it itself.
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
}

function getStyledMap(ctx: BeatEngineContext): StyledMap | null {
  const map = ctx.mapRef?.current?.getMap?.() as StyledMap | null | undefined
  if (!map) return null
  if (!map.isStyleLoaded?.()) return null
  return map
}

/** Piecewise opacity ramp for the Beat 5 AG demand-units layer. Mirrors
 *  lines 2289 to 2306 of the old main-choreography listener exactly. */
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
