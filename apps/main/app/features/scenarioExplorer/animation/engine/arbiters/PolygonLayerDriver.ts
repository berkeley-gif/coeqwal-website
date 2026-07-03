/* PolygonLayerDriver
 *
 * Single imperative writer for the base fill, outline, and gold highlight
 * of the WBA, reservoir, and delta polygon outcomes in interactive mode.
 * Non-DU sibling of `InteractivePaintArbiter`. Paints the same shared
 * expressions (`demandUnitsPaint.ts`) and is driven by
 * `InteractiveLayerDirector`, which decides recolor vs handoff and gates
 * the fade-in on camera idle.
 */

import type { BeatEngineContext, DemandUnitsOverlayState } from "../types"
import type {
  InteractiveLayerDriver,
  InteractiveLayerFamily,
} from "../interactiveLayerDriver"
import type { MapWriteView } from "../demandUnitsBaseline"
import {
  HIGHLIGHT_GOLD,
  OUTCOME_FILL_OPACITY,
  OUTCOME_OUTLINE_WIDTH,
  OUTCOME_OUTLINE_OFFSET,
  buildActiveOutlineExpr,
  buildFillOpacityExpr,
} from "../../demandUnitsPaint"

/** Outline width for `outlineOnly` outcomes (the delta): transparent fill,
 *  wide tinted boundary. Matches `OutcomePolygonLayer`. */
const OUTLINE_ONLY_WIDTH = 4
/** Fade-in duration (ms) for the initial enter. Matches the DU arbiter. */
const FADE_IN_DURATION = 350
/** Crossfade duration (ms) when recoloring the same layer in place. */
const COLOR_TRANSITION_DURATION = 400

/** What the director needs to paint one non-DU polygon outcome. Built in
 *  `TierAnimationSection` from tier data and the schema, with reservoir id
 *  translation already applied to `featureIds`. */
export interface PolygonPaintSpec {
  outcomeCode: string
  /** Mapbox fill-layer id (e.g. `calsim-wba`). */
  fillId: string
  /** Mapbox outline-layer id (e.g. `calsim-wba-outline`). */
  outlineId: string
  /** Feature-id property column for filters and overlays. */
  idProperty: string
  /** Translated feature ids shown by this outcome. */
  featureIds: readonly string[]
  /** Tier-color match expression keyed on `idProperty`. */
  colorExpression: unknown
  /** Transparent fill with a broad tinted outline (the delta). */
  outlineOnly: boolean
}

function buildFilter(spec: PolygonPaintSpec): unknown {
  if (spec.featureIds.length === 0) return null
  return ["in", ["get", spec.idProperty], ["literal", [...spec.featureIds]]]
}

export class PolygonLayerDriver implements InteractiveLayerDriver {
  /** This driver owns the non-DU `polygon` family. */
  readonly family: InteractiveLayerFamily = "polygon"

  private currentlyOwns = false
  private currentSpec: PolygonPaintSpec | null = null
  private pendingFadeRaf: number | null = null

  /** Outline-layer ids we created, so we never create them twice. Kept in
   *  the style for the session rather than removed on exit, matching the
   *  demand-units outline. */
  private createdOutlineIds = new Set<string>()

  /** Sync to the caller's paint spec (null releases the layers). */
  sync(ctx: BeatEngineContext, spec: PolygonPaintSpec | null): void {
    const shouldOwn = spec !== null

    if (shouldOwn && !this.currentlyOwns) {
      this.currentlyOwns = true
      this.currentSpec = spec
      this.onEnter(ctx, spec)
      return
    }

    if (!shouldOwn && this.currentlyOwns) {
      const prev = this.currentSpec
      this.currentlyOwns = false
      this.currentSpec = null
      this.cancelPendingFadeRaf()
      if (prev) this.hideLayers(ctx, prev)
      return
    }

    if (shouldOwn && this.currentlyOwns) {
      const prev = this.currentSpec
      // Different layer (e.g. wba to reservoir): hide the old, fade the new
      // in. The director normally exits first. This is a safety net for a
      // direct same-family swap.
      if (prev && prev.fillId !== spec.fillId) {
        this.hideLayers(ctx, prev)
        this.currentSpec = spec
        this.onEnter(ctx, spec)
        return
      }
      // Same layer, new colors (e.g. climate-variant tier change): crossfade.
      if (prev && prev.outcomeCode !== spec.outcomeCode) {
        this.currentSpec = spec
        this.onCrossfade(ctx, spec)
      }
    }
  }

  /** Apply the gold highlight + zoom-aware fill opacity for the current
   *  overlay. No-op when we don't own or the overlay is for another outcome. */
  applyOverlay(ctx: BeatEngineContext, overlay: DemandUnitsOverlayState): void {
    if (!this.currentlyOwns || !this.currentSpec) return
    if (overlay.outcomeCode !== this.currentSpec.outcomeCode) return

    const map = this.getWriteMap(ctx)
    if (!map) return

    const spec = this.currentSpec
    const idProp = spec.idProperty

    try {
      if (map.getLayer(spec.outlineId)) {
        if (overlay.activeFeatureIds.length > 0) {
          if (spec.outlineOnly) {
            // Keep the broad boundary, tint the active feature gold.
            const activeMatch = [
              "in",
              ["get", idProp],
              ["literal", [...overlay.activeFeatureIds]],
            ]
            map.setPaintProperty(spec.outlineId, "line-color", [
              "case",
              activeMatch,
              HIGHLIGHT_GOLD,
              spec.colorExpression,
            ])
            map.setPaintProperty(
              spec.outlineId,
              "line-width",
              OUTLINE_ONLY_WIDTH,
            )
            map.setPaintProperty(spec.outlineId, "line-opacity", 1)
          } else {
            const { lineColor, lineWidth, lineOpacity } =
              buildActiveOutlineExpr(
                overlay.activeFeatureIds,
                idProp,
                spec.colorExpression,
              )
            map.setPaintProperty(spec.outlineId, "line-color", lineColor)
            map.setPaintProperty(spec.outlineId, "line-width", lineWidth)
            map.setPaintProperty(spec.outlineId, "line-opacity", lineOpacity)
          }
        } else {
          map.setPaintProperty(
            spec.outlineId,
            "line-color",
            spec.colorExpression,
          )
          map.setPaintProperty(
            spec.outlineId,
            "line-width",
            spec.outlineOnly ? OUTLINE_ONLY_WIDTH : OUTCOME_OUTLINE_WIDTH,
          )
          map.setPaintProperty(spec.outlineId, "line-opacity", 1)
        }
      }

      // Fill opacity only for filled outcomes. `outlineOnly` keeps fill at 0.
      if (!spec.outlineOnly && map.getLayer(spec.fillId)) {
        map.setPaintProperty(
          spec.fillId,
          "fill-opacity",
          buildFillOpacityExpr(overlay, idProp),
        )
      }
    } catch {
      /* ok */
    }
  }

  /** Force-release the current layer (nav teardown / unmount). */
  release(ctx: BeatEngineContext): void {
    if (!this.currentlyOwns) return
    const prev = this.currentSpec
    this.currentlyOwns = false
    this.currentSpec = null
    this.cancelPendingFadeRaf()
    if (prev) this.hideLayers(ctx, prev)
  }

  owns(): boolean {
    return this.currentlyOwns
  }

  ownedLayerId(): string | null {
    return this.currentlyOwns ? (this.currentSpec?.fillId ?? null) : null
  }

  //────
  // Lifecycle hooks
  //────

  private getWriteMap(ctx: BeatEngineContext): MapWriteView | undefined {
    return ctx.mapRef?.current?.getMap?.() as unknown as
      | MapWriteView
      | undefined
  }

  /** Take ownership of a polygon outcome's fill + outline and fade them in.
   *  Mirrors the initial fade-in path in `OutcomePolygonLayer`. */
  private onEnter(ctx: BeatEngineContext, spec: PolygonPaintSpec): void {
    const map = this.getWriteMap(ctx)
    if (!map || !map.getLayer(spec.fillId)) return

    this.cancelPendingFadeRaf()
    const filter = buildFilter(spec)

    try {
      map.setFilter(spec.fillId, filter)
      map.setPaintProperty(spec.fillId, "fill-color", spec.colorExpression)
      map.setPaintProperty(spec.fillId, "fill-opacity-transition", {
        duration: FADE_IN_DURATION,
        delay: 0,
      })
      map.setPaintProperty(spec.fillId, "fill-opacity", 0)
      map.setLayoutProperty(spec.fillId, "visibility", "visible")

      this.ensureOutlineLayer(map, spec)

      if (map.getLayer(spec.outlineId)) {
        map.setFilter(spec.outlineId, filter)
        map.setPaintProperty(spec.outlineId, "line-color", spec.colorExpression)
        map.setPaintProperty(spec.outlineId, "line-opacity-transition", {
          duration: FADE_IN_DURATION,
          delay: 0,
        })
        map.setPaintProperty(spec.outlineId, "line-opacity", 0)
        if (spec.outlineOnly) {
          map.setPaintProperty(spec.outlineId, "line-width", OUTLINE_ONLY_WIDTH)
          map.setPaintProperty(spec.outlineId, "line-offset", 0)
        } else {
          map.setPaintProperty(
            spec.outlineId,
            "line-width",
            OUTCOME_OUTLINE_WIDTH,
          )
          map.setPaintProperty(
            spec.outlineId,
            "line-offset",
            OUTCOME_OUTLINE_OFFSET,
          )
        }
      }
    } catch {
      return
    }

    // Next frame: ramp opacity to target so the transition animates instead
    // of snapping (same RAF split as the DU arbiter and OPL).
    this.pendingFadeRaf = requestAnimationFrame(() => {
      this.pendingFadeRaf = null
      if (!this.currentlyOwns) return
      if (this.currentSpec?.fillId !== spec.fillId) return
      if (!map.getLayer(spec.fillId)) return

      try {
        map.setPaintProperty(
          spec.fillId,
          "fill-opacity",
          spec.outlineOnly ? 0 : OUTCOME_FILL_OPACITY,
        )
        if (map.getLayer(spec.outlineId)) {
          map.setPaintProperty(spec.outlineId, "line-opacity", 1)
          map.setLayoutProperty(spec.outlineId, "visibility", "visible")
        }
      } catch {
        /* ok */
      }
    })
  }

  /** Recolor the same layer in place (tier data changed for the same
   *  outcome). Mirrors the crossfade path in `OutcomePolygonLayer`. */
  private onCrossfade(ctx: BeatEngineContext, spec: PolygonPaintSpec): void {
    const map = this.getWriteMap(ctx)
    if (!map || !map.getLayer(spec.fillId)) return

    this.cancelPendingFadeRaf()
    const filter = buildFilter(spec)

    try {
      map.setFilter(spec.fillId, filter)
      map.setLayoutProperty(spec.fillId, "visibility", "visible")
      map.setPaintProperty(spec.fillId, "fill-color-transition", {
        duration: COLOR_TRANSITION_DURATION,
        delay: 0,
      })
      map.setPaintProperty(spec.fillId, "fill-color", spec.colorExpression)

      if (map.getLayer(spec.outlineId)) {
        map.setFilter(spec.outlineId, filter)
        map.setLayoutProperty(spec.outlineId, "visibility", "visible")
        map.setPaintProperty(spec.outlineId, "line-color-transition", {
          duration: COLOR_TRANSITION_DURATION,
          delay: 0,
        })
        map.setPaintProperty(spec.outlineId, "line-color", spec.colorExpression)
      }
    } catch {
      /* ok */
    }
  }

  /** Snap a layer's fill + outline to opacity 0 with no transition. The
   *  style-resident layer stays in place, hidden, ready for a later enter. */
  private hideLayers(ctx: BeatEngineContext, spec: PolygonPaintSpec): void {
    const map = this.getWriteMap(ctx)
    if (!map) return
    try {
      if (map.getLayer(spec.fillId)) {
        map.setPaintProperty(spec.fillId, "fill-opacity-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty(spec.fillId, "fill-opacity", 0)
      }
      if (map.getLayer(spec.outlineId)) {
        map.setPaintProperty(spec.outlineId, "line-opacity-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty(spec.outlineId, "line-opacity", 0)
      }
    } catch {
      /* ok */
    }
  }

  /** Create the outline layer once, borrowing the fill layer's source. */
  private ensureOutlineLayer(map: MapWriteView, spec: PolygonPaintSpec): void {
    if (map.getLayer(spec.outlineId)) return
    const fillLayer = map.getLayer(spec.fillId) as
      | { source?: string; "source-layer"?: string }
      | undefined
    if (!fillLayer?.source) return
    try {
      map.addLayer({
        id: spec.outlineId,
        type: "line",
        source: fillLayer.source,
        ...(fillLayer["source-layer"]
          ? { "source-layer": fillLayer["source-layer"] }
          : {}),
        paint: {
          "line-color": spec.colorExpression,
          "line-width": spec.outlineOnly ? OUTLINE_ONLY_WIDTH : 0.5,
          "line-opacity": 0,
          "line-offset": spec.outlineOnly ? 0 : -0.25,
        },
        layout: { visibility: "visible" },
      })
      this.createdOutlineIds.add(spec.outlineId)
    } catch {
      /* layer may already exist, or style not loaded yet */
    }
  }

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
