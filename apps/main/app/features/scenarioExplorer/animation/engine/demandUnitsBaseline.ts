/* Writer for the `demand-units` and `demand-units-outline`
 * Mapbox layers.
 *
 * Any code that takes over these layers must set every property the
 * next consumer reads, or a stale value (like `fill-color`) leaks in
 * from the previous writer. This helper writes the full set in one
 * place, so every caller goes through it.
 *
 * It knows nothing about beats or modes: callers pass a
 * `DemandUnitsBaselineSpec` describing the exact state they want.
 */

/** A narrower view of the Mapbox map than `MapboxGLMap`. Mapbox GL's
 *  strict paint/filter types reject the `readonly unknown[]`
 *  expressions our specs carry, so this view loosens those setters.
 *  Callers still get the real map from `mapRef.current.getMap()` and
 *  pass it in. See the Roadmap in packages/map/README.md for the
 *  eventual replacement. */
export type MapWriteView = {
  getLayer: (id: string) => unknown
  setFilter: (id: string, f: unknown) => void
  setPaintProperty: (id: string, prop: string, value: unknown) => void
  setLayoutProperty: (id: string, prop: string, value: unknown) => void
  addLayer: (spec: unknown) => void
}

/** Filter for normal choreography. Shows Agriculture, Urban, and
 *  Refuge demand-units, which correspond to tracked outcomes.
 *  Excludes "N/A" and other untracked classes. */
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
 *  `MapWriteView` above for the rationale and the roadmap entry that
 *  retires it. */
export type BaselineMap = MapWriteView

/** Permissive write view consumed by `ensureDemandUnitsOutlineLayer`.
 *  Same shape as `BaselineMap`, aliased for clarity */
export type SessionInitMap = MapWriteView

/** The full demand-units baseline state. Every field is required on
 *  purpose: making one optional would mean "inherit from the previous
 *  writer", which is exactly what this helper avoids. */
export type DemandUnitsOpacity =
  | { kind: "scalar"; value: number }
  | { kind: "preserve" }

export interface DemandUnitsBaselineSpec {
  /** Mapbox filter applied to both fill and outline layers. Typical
   *  values: `DU_CLASS_FILTER` or `DU_AG_ONLY_FILTER`. */
  filter: readonly unknown[]
  /** Tier color expression for fill, fill-outline, and outline color.
   *  Pass `null` only in pre-playback setup before tier data loads. */
  fillExpr: readonly unknown[] | null
  /** Fill opacity. `scalar` writes a fixed value (0 to seed a fade-in,
   *  ~0.65 at peak). `preserve` leaves opacity alone so the next writer
   *  can set it without a flicker. */
  fillOpacity: DemandUnitsOpacity
  /** Outline opacity. Same as `fillOpacity`. Usually matches it so fill
   *  and stroke move together. */
  lineOpacity: DemandUnitsOpacity
  /** Outline width. Baseline is `0.5`. The gold LOI ring is set
   *  separately by its own code. */
  lineWidth: number
  /** Outline line offset. Baseline is `-0.25` to keep strokes inside
   *  polygon boundaries. */
  lineOffset: number
  /** Layout visibility. Always `"visible"` during active playback or
   *  interactive modes. `"none"` is only appropriate when the map is
   *  being torn down. */
  visibility: "visible" | "none"
}

/** Apply a full baseline spec to the two layers. Safe to call
 *  repeatedly. First it zeroes the paint transitions, so a per-frame
 *  ramp isn't smoothed away by a leftover 350/400 ms transition from
 *  `OutcomePolygonLayer`. That transition reset is the most important
 *  thing this helper does. */
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
     *  re-applies on the next valid frame, so swallowing here is safe. */
  }
}

/** Specification for the outline-layer creation helper. All fields
 *  describe the layer's initial Mapbox paint. Visibility is always
 *  "visible" at creation. Callers that want it hidden should flip it
 *  via `setLayoutProperty` immediately after. */
export interface DemandUnitsOutlineInitSpec {
  filter: readonly unknown[]
  lineColor: readonly unknown[] | string
  lineWidth: number
  lineOpacity: number
  lineOffset: number
}

/** Create the `demand-units-outline` layer if it's missing. In normal
 *  map modes `OutcomePolygonLayer` makes it, but get-started mode skips
 *  that and the storyboard owns it. Safe to call every mount: it
 *  returns early if the layer already exists.
 *
 *  The outline copies its `source` and `source-layer` from the fill
 *  layer, and bails if the fill isn't there yet. */
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
    /* layer may already exist from another map mode, or style not
     *  loaded yet. */
  }
}
