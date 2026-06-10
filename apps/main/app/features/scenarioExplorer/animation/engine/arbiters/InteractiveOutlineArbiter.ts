/* InteractiveOutlineArbiter
 *
 * Highlights the active (hovered or pinned) features of a non-demand-unit
 * polygon outcome (groundwater, reservoirs, the delta) while the user clicks
 * around in interactive mode. It is the sibling of `InteractivePaintArbiter`:
 * that one fully owns the `demand-units` layer, whereas the non-DU base layers
 * (tier fill plus tier outline) are owned by `OutcomePolygonLayer`.
 *
 * To keep a single writer per layer, this arbiter never touches those base
 * layers. Two writers on one layer (OPL fading the fill in while this arbiter
 * overwrote the opacity and outline) caused the load / reload flicker. Instead
 * it draws the gold highlight in its own dedicated line layer, filtered to the
 * active features and sitting above the tier outline.
 *
 * Event-driven, like `CameraArbiter`. It is held in a ref and called from
 * effects, not dispatched by the engine from `progress`.
 */

import type { MapboxGLMap } from "@repo/map"
import type { BeatEngineContext, DemandUnitsOverlayState } from "../types"
import { HIGHLIGHT_GOLD } from "../../demandUnitsPaint"

/** The layer ids and feature-id column for one non-DU polygon outcome. */
export interface OutlinePaintTarget {
  outcomeCode: string
  fillId: string
  outlineId: string
  idProperty: string
  /** When true, only the outline is painted and the fill is left alone. */
  outlineOnly: boolean
}

/** Suffix for the dedicated gold highlight layer this arbiter owns. */
const HIGHLIGHT_SUFFIX = "-active-highlight"

export class InteractiveOutlineArbiter {
  private currentlyOwns = false
  private currentOutcome: string | null = null

  /** A paint waiting for the map to go idle, or null if none. */
  private pendingTeardownCleanup: (() => void) | null = null

  /** Highlight layer ids we have created, so we can hide them on release and
   *  when switching outcomes (only one outcome is highlighted at a time). */
  private highlightLayerIds = new Set<string>()

  /** True when this arbiter is currently the active writer. */
  owns(): boolean {
    return this.currentlyOwns
  }

  /** Reconcile ownership and repaint. Pass a null target to release (hides
   *  every highlight layer). Painting is idempotent, so callers re-sync on
   *  any selection change. */
  sync(
    ctx: BeatEngineContext,
    target: OutlinePaintTarget | null,
    overlay: DemandUnitsOverlayState | null,
  ): void {
    if (!target || !overlay) {
      this.cancelPendingTeardown()
      this.hideAllHighlights(ctx)
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

    const highlightId = `${target.fillId}${HIGHLIGHT_SUFFIX}`
    const activeIds = overlay.activeFeatureIds

    try {
      // Only one outcome is highlighted at a time: hide every other outcome's
      // highlight layer before showing this one.
      for (const id of this.highlightLayerIds) {
        if (id !== highlightId && map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", "none")
        }
      }

      // Create our own gold line layer once, borrowing the outcome layer's
      // source so it reads the same features. Sits above the tier outline.
      if (!map.getLayer(highlightId)) {
        const baseLayer =
          map.getLayer(target.outlineId) ?? map.getLayer(target.fillId)
        if (!baseLayer) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceId = (baseLayer as any).source as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sourceLayer = (baseLayer as any)["source-layer"] as
          | string
          | undefined
        map.addLayer({
          id: highlightId,
          type: "line",
          source: sourceId,
          ...(sourceLayer ? { "source-layer": sourceLayer } : {}),
          paint: {
            "line-color": HIGHLIGHT_GOLD,
            "line-width": 2.5,
            "line-opacity": 1,
          },
          layout: { visibility: "none" },
          filter: ["in", ["get", target.idProperty], ["literal", []]],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        this.highlightLayerIds.add(highlightId)
      }

      if (activeIds.length > 0) {
        map.setFilter(highlightId, [
          "in",
          ["get", target.idProperty],
          ["literal", [...activeIds]],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any)
        map.setLayoutProperty(highlightId, "visibility", "visible")
      } else {
        map.setLayoutProperty(highlightId, "visibility", "none")
      }
    } catch {
      /* ok */
    }
  }

  /** Hide every highlight layer we created (release / deselect). */
  private hideAllHighlights(ctx: BeatEngineContext): void {
    const map: MapboxGLMap | undefined = ctx?.mapRef?.current?.getMap?.()
    if (!map) return
    for (const id of this.highlightLayerIds) {
      try {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none")
      } catch {
        /* ok */
      }
    }
  }
}
