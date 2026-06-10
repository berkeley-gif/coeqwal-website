/* InteractiveOutlineArbiter
 *
 * Paints the non-demand-unit polygon outcomes (reservoirs and the other
 * outcome layers) while the user clicks around in interactive mode. It is
 * the sibling of `InteractivePaintArbiter`: that one fully owns the
 * `demand-units` layer, while this one borrows a pre-existing outcome layer
 * and restores it. Both draw the same gold outline and spotlight / pinned /
 * base fill via the shared builders in `demandUnitsPaint.ts`.
 *
 * Event-driven, like `CameraArbiter`. It is held in a ref and called from
 * effects, not dispatched by the engine from `progress`.
 */

import type { MapboxGLMap } from "@repo/map"
import type { BeatEngineContext, DemandUnitsOverlayState } from "../types"
import {
  buildActiveOutlineExpr,
  buildFillOpacityExpr,
} from "../../demandUnitsPaint"

/** The layer ids and feature-id column for one non-DU polygon outcome. */
export interface OutlinePaintTarget {
  outcomeCode: string
  fillId: string
  outlineId: string
  idProperty: string
  /** When true, only the outline is painted and the fill is left alone. */
  outlineOnly: boolean
}

export class InteractiveOutlineArbiter {
  private currentlyOwns = false
  private currentOutcome: string | null = null

  /** A paint waiting for the map to go idle, or null if none. */
  private pendingTeardownCleanup: (() => void) | null = null

  /** True when this arbiter is currently the active writer. */
  owns(): boolean {
    return this.currentlyOwns
  }

  /** Reconcile ownership and repaint. Pass a null target to release
   *  (no map writes, matching the prior effect's deselect behavior).
   *  Painting is idempotent, so callers re-sync on any selection change. */
  sync(
    ctx: BeatEngineContext,
    target: OutlinePaintTarget | null,
    overlay: DemandUnitsOverlayState | null,
  ): void {
    if (!target || !overlay) {
      this.cancelPendingTeardown()
      this.currentlyOwns = false
      this.currentOutcome = null
      return
    }

    this.currentlyOwns = true
    this.currentOutcome = target.outcomeCode

    const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
    if (!map) return

    this.cancelPendingTeardown()
    const paint = () => this.paint(map, target, overlay)

    if (map.isStyleLoaded?.()) {
      paint()
      return
    }

    let ran = false
    const onIdle = () => {
      if (ran) return
      ran = true
      this.pendingTeardownCleanup = null
      paint()
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

  /** Cancel a paint that's waiting for idle. Safe to call when nothing is
   *  pending. */
  cancelPendingTeardown(): void {
    if (!this.pendingTeardownCleanup) return
    const cleanup = this.pendingTeardownCleanup
    this.pendingTeardownCleanup = null
    cleanup()
  }

  private paint(
    map: MapboxGLMap,
    target: OutlinePaintTarget,
    overlay: DemandUnitsOverlayState,
  ): void {
    if (!map.getLayer(target.fillId)) return

    try {
      if (map.getLayer(target.outlineId)) {
        // Capture the layer's current outline color and width so we can
        // restore them when no feature is active. Read fresh each paint
        // (the borrowed layer is the restore base).
        const origLineColor =
          map.getPaintProperty(target.outlineId, "line-color") ?? "#888"
        const origLineWidth =
          map.getPaintProperty(target.outlineId, "line-width") ?? 1

        if (overlay.activeFeatureIds.length > 0) {
          const { lineColor, lineWidth, lineOpacity } = buildActiveOutlineExpr(
            overlay.activeFeatureIds,
            target.idProperty,
            origLineColor,
          )
          map.setPaintProperty(target.outlineId, "line-color", lineColor as never)
          map.setPaintProperty(target.outlineId, "line-width", lineWidth as never)
          map.setPaintProperty(
            target.outlineId,
            "line-opacity",
            lineOpacity as never,
          )
        } else {
          map.setPaintProperty(
            target.outlineId,
            "line-color",
            origLineColor as never,
          )
          map.setPaintProperty(
            target.outlineId,
            "line-width",
            origLineWidth as never,
          )
        }
      }

      if (!target.outlineOnly) {
        // A spotlight that matches nothing leaves the fill untouched (the
        // prior behavior), so skip that one case. Otherwise the shared
        // builder picks spotlight, pinned, or base in priority order.
        const spotlightMatchesNothing =
          overlay.hasSpotlight && overlay.spotlightFeatureIds.length === 0
        if (!spotlightMatchesNothing) {
          map.setPaintProperty(
            target.fillId,
            "fill-opacity",
            buildFillOpacityExpr(overlay, target.idProperty) as never,
          )
        }
      }
    } catch {
      /* ok */
    }
  }
}
