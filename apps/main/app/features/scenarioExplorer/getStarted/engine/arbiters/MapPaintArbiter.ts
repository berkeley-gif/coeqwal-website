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

/* ── DIAG S4/S5 ───────────────────────────────────────────────────────────
 * Temporary diagnostic helper for the Step 4 / Step 5 AG layer bug.
 * Snapshots demand-units state. Remove with the other [DIAG S4/S5]
 * references once root cause is identified. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logDuState(label: string, map: any): void {
  try {
    if (!map?.getLayer) {
      // eslint-disable-next-line no-console
      console.log(`[DIAG S4/S5] ${label} <no map>`)
      return
    }
    const short = (v: unknown) => {
      try {
        const s = JSON.stringify(v)
        return s && s.length > 80 ? s.slice(0, 80) + "..." : s
      } catch {
        return String(v)
      }
    }
    const fill = map.getLayer("demand-units")
      ? {
          opacity: short(map.getPaintProperty("demand-units", "fill-opacity")),
          opTrans: short(
            map.getPaintProperty("demand-units", "fill-opacity-transition"),
          ),
          vis: map.getLayoutProperty?.("demand-units", "visibility"),
          filter: short(map.getFilter?.("demand-units")),
        }
      : "<no demand-units>"
    const outline = map.getLayer("demand-units-outline")
      ? {
          opacity: short(
            map.getPaintProperty("demand-units-outline", "line-opacity"),
          ),
          opTrans: short(
            map.getPaintProperty(
              "demand-units-outline",
              "line-opacity-transition",
            ),
          ),
          width: short(
            map.getPaintProperty("demand-units-outline", "line-width"),
          ),
          vis: map.getLayoutProperty?.("demand-units-outline", "visibility"),
          filter: short(map.getFilter?.("demand-units-outline")),
        }
      : "<no demand-units-outline>"
    // eslint-disable-next-line no-console
    console.log(`[DIAG S4/S5] ${label}`, { fill, outline })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(`[DIAG S4/S5] ${label} <error>`, e)
  }
}

export class MapPaintArbiter implements Arbiter<MapPaintActor> {
  readonly kind = "mapPaint" as const

  /** Gold-ring state. True iff the `demand-units-outline` layer is
   *  currently carrying a `case` expression that strokes the LOI in
   *  gold. Mirrors the `beat5PolyRingOn` closure variable in the old
   *  main-choreography listener. */
  private beat5PolyRingOn = false

  /** [DIAG S4/S5] Which beat5-layer-fade boundaries we've already
   *  logged for the current pass. Reset on `applyBeat5Enter`. */
  private diagBoundariesLogged = new Set<string>()

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
        this.applyBeat5Enter(map, ctx)
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
        // eslint-disable-next-line no-console
        console.log(
          `[DIAG S4/S5] MapPaintArbiter beat5-layer-fade stage=${stage} v=${v.toFixed(4)} target=${targetOpacity.toFixed(3)}`,
        )
        logDuState(`beat5-layer-fade stage=${stage}`, map)
      }

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

  private applyBeat5Enter(map: StyledMap, ctx: BeatEngineContext): void {
    // [DIAG S4/S5]
    logDuState("MapPaintArbiter.applyBeat5Enter PRE", map)
    // The arbiter is the sole authority on the Mapbox state of
    // `demand-units` and `demand-units-outline` for the duration of
    // Beat 5. We cannot trust whoever ran before us (OPL unmount,
    // interactive paint effect, half-completed teardown) to leave
    // these layers in a clean, renderable state. So we assert the
    // full set of preconditions our per-tick ramp needs:
    //   1. Agriculture-only filter.
    //   2. Instant transitions (opTrans = 0, colorTrans = 0), so the
    //      per-tick opacity writes are not smoothed away by a stale
    //      350 ms transition inherited from `OutcomePolygonLayer`,
    //      and the fill-color swap below is instant.
    //   3. Scalar opacity seeded to 0, overwriting any stale `case`
    //      / `step` expression the interactive pass left behind.
    //   4. Tier-color fill/outline expression for AG DUs, overwriting
    //      any interactive outcome's per-feature color map (which
    //      would leave AG features on the default gray fallback and
    //      make the layer look washed out at peak-hold).
    //   5. `visibility: visible`, overwriting the `none` that
    //      `OutcomePolygonLayer`'s unmount cleanup sets when an
    //      interactive outcome is deselected.
    //   6. Default outline width (0.5) and offset (-0.25).
    // The companion `beat5-layer-fade` actor then ramps opacity from
    // 0 up to `peakOpacity` across the fade-in window.
    try {
      const baseExpr = ctx.buildBlendedTierExpr(BEAT1_MID, 1)
      if (map.getLayer("demand-units")) {
        map.setFilter("demand-units", DU_AG_ONLY_FILTER as never)
        map.setPaintProperty("demand-units", "fill-opacity-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty("demand-units", "fill-color-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty("demand-units", "fill-opacity", 0)
        if (baseExpr) {
          map.setPaintProperty("demand-units", "fill-color", baseExpr as never)
          map.setPaintProperty(
            "demand-units",
            "fill-outline-color",
            baseExpr as never,
          )
        }
        map.setLayoutProperty("demand-units", "visibility", "visible")
      }
      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", DU_AG_ONLY_FILTER as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity-transition",
          { duration: 0, delay: 0 },
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-color-transition",
          { duration: 0, delay: 0 },
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 0)
        if (baseExpr) {
          map.setPaintProperty(
            "demand-units-outline",
            "line-color",
            baseExpr as never,
          )
        }
        map.setPaintProperty("demand-units-outline", "line-width", 0.5)
        map.setPaintProperty("demand-units-outline", "line-offset", -0.25)
        map.setLayoutProperty(
          "demand-units-outline",
          "visibility",
          "visible",
        )
      }
    } catch {
      /* ok */
    }
    this.beat5PolyRingOn = false
    // [DIAG S4/S5]
    this.diagBoundariesLogged.clear()
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
