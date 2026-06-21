/* Writer for the `demand-units` and `demand-units-outline` Mapbox
 * layers. Whoever takes over these layers must set every property the
 * next consumer reads, or a stale value (like `fill-color`) leaks from
 * the previous writer. This helper writes the full set in one place.
 * Callers pass a `DemandUnitsBaselineSpec`. It knows nothing of beats
 * or modes.
 */

/** Narrower view of the Mapbox map than `MapboxGLMap`. Mapbox GL's
 *  strict paint/filter types reject the `readonly unknown[]` expressions
 *  our specs carry, so this loosens those setters. See the Roadmap in
 *  packages/map/README.md for the eventual replacement. */
export type MapWriteView = {
  getLayer: (id: string) => unknown
  setFilter: (id: string, f: unknown) => void
  setPaintProperty: (id: string, prop: string, value: unknown) => void
  setLayoutProperty: (id: string, prop: string, value: unknown) => void
  addLayer: (spec: unknown) => void
}

/** Filter for normal choreography. Shows Agriculture, Urban, and Refuge
 *  demand-units (tracked outcomes), excluding "N/A" and other classes. */
export const DU_CLASS_FILTER: readonly unknown[] = [
  "in",
  ["get", "Class"],
  ["literal", ["Agriculture", "Urban", "Refuge"]],
] as const

/** Filter used when the storyboard isolates Agriculture (tier-color
 *  hold and loi-highlight). */
export const DU_AG_ONLY_FILTER: readonly unknown[] = [
  "==",
  ["get", "Class"],
  "Agriculture",
] as const

/** Permissive write view consumed by `writeDemandUnitsBaseline`. See
 *  `MapWriteView` above. */
export type BaselineMap = MapWriteView

/** Permissive write view consumed by `ensureDemandUnitsOutlineLayer`.
 *  Same shape as `BaselineMap`, aliased for clarity. */
export type SessionInitMap = MapWriteView

/** Full demand-units baseline state. Every field is required on purpose:
 *  an optional one would mean "inherit from the previous writer", which
 *  is exactly what this helper avoids. */
export type DemandUnitsOpacity =
  | { kind: "scalar"; value: number }
  | { kind: "preserve" }

export interface DemandUnitsBaselineSpec {
  /** Mapbox filter for both fill and outline layers. Typically
   *  `DU_CLASS_FILTER` or `DU_AG_ONLY_FILTER`. */
  filter: readonly unknown[]
  /** Tier color expression for fill, fill-outline, and outline color.
   *  `null` only in pre-playback setup before tier data loads. */
  fillExpr: readonly unknown[] | null
  /** Fill opacity. `scalar` writes a fixed value (0 to seed a fade-in,
   *  ~0.65 at peak). `preserve` leaves opacity alone to avoid a flicker. */
  fillOpacity: DemandUnitsOpacity
  /** Outline opacity. Usually matches `fillOpacity` so fill and stroke
   *  move together. */
  lineOpacity: DemandUnitsOpacity
  /** Outline width. Baseline `0.5`. The gold LOI ring is set separately. */
  lineWidth: number
  /** Outline line offset. Baseline `-0.25` to keep strokes inside polygon
   *  boundaries. */
  lineOffset: number
  /** Layout visibility. `"visible"` during playback or interactive modes;
   *  `"none"` only when the map is being torn down. */
  visibility: "visible" | "none"
}

/** Apply a full baseline spec to the two layers. Safe to call
 *  repeatedly. Zeroes the paint transitions first, so a per-frame ramp
 *  isn't smoothed away by a leftover 350/400 ms transition from
 *  `OutcomePolygonLayer`. That transition reset is the key job here. */
export function writeDemandUnitsBaseline(
  map: BaselineMap,
  spec: DemandUnitsBaselineSpec,
): void {
  try {
    if (map.getLayer("demand-units")) {
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      })
      map.setPaintProperty("demand-units", "fill-color-transition", {
        duration: 0,
        delay: 0,
      })
      map.setFilter("demand-units", spec.filter)
      if (spec.fillExpr) {
        map.setPaintProperty("demand-units", "fill-color", spec.fillExpr)
        map.setPaintProperty(
          "demand-units",
          "fill-outline-color",
          spec.fillExpr,
        )
      }
      if (spec.fillOpacity.kind === "scalar") {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          spec.fillOpacity.value,
        )
      }
      map.setLayoutProperty("demand-units", "visibility", spec.visibility)
    }
    if (map.getLayer("demand-units-outline")) {
      map.setPaintProperty("demand-units-outline", "line-opacity-transition", {
        duration: 0,
        delay: 0,
      })
      map.setPaintProperty("demand-units-outline", "line-color-transition", {
        duration: 0,
        delay: 0,
      })
      map.setFilter("demand-units-outline", spec.filter)
      if (spec.fillExpr) {
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.fillExpr,
        )
      }
      if (spec.lineOpacity.kind === "scalar") {
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity",
          spec.lineOpacity.value,
        )
      }
      map.setPaintProperty("demand-units-outline", "line-width", spec.lineWidth)
      map.setPaintProperty(
        "demand-units-outline",
        "line-offset",
        spec.lineOffset,
      )
      map.setLayoutProperty(
        "demand-units-outline",
        "visibility",
        spec.visibility,
      )
    }
  } catch {
    /* Mapbox can throw transiently during style reloads. The caller
     *  re-applies on the next valid frame, so swallowing is safe. */
  }
}

/** Spec for the outline-layer creation helper. Visibility is always
 *  "visible" at creation. Callers wanting it hidden flip it via
 *  `setLayoutProperty` immediately after. */
export interface DemandUnitsOutlineInitSpec {
  filter: readonly unknown[]
  lineColor: readonly unknown[] | string
  lineWidth: number
  lineOpacity: number
  lineOffset: number
}

/** Create the `demand-units-outline` layer if missing. Normally
 *  `OutcomePolygonLayer` makes it, but get-started mode skips that and
 *  the storyboard owns it. Safe to call every mount (returns early if it
 *  exists). Copies `source` and `source-layer` from the fill layer, and
 *  bails if the fill isn't there yet. */
export function ensureDemandUnitsOutlineLayer(
  map: SessionInitMap,
  spec: DemandUnitsOutlineInitSpec,
): void {
  try {
    if (!map.getLayer("demand-units")) return
    if (map.getLayer("demand-units-outline")) return
    const fillLayer = map.getLayer("demand-units") as unknown as {
      source: string
      "source-layer": string
    }
    map.addLayer({
      id: "demand-units-outline",
      type: "line",
      source: fillLayer.source,
      "source-layer": fillLayer["source-layer"],
      filter: spec.filter,
      paint: {
        "line-color": spec.lineColor,
        "line-width": spec.lineWidth,
        "line-opacity": spec.lineOpacity,
        "line-offset": spec.lineOffset,
      },
      layout: { visibility: "visible" },
    })
  } catch {
    /* layer may already exist from another map mode, or style not loaded
     *  yet. */
  }
}
