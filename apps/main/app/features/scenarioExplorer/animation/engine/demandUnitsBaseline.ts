/* Baseline writer for the `demand-units` and `demand-units-outline`
 * Mapbox layers.
 *
 * Invariant 2 of the Storyboard Engine Hardening Plan v2 states that
 * every writer that takes ownership of these layers must assert the
 * full set of properties the next consumer depends on. Partial writes
 * cause bugs like the Step 4 to Step 5 "semi-transparent AG layer"
 * regression, where one writer set filter and opacity correctly but
 * inherited a stale `fill-color` from a previous writer. See the
 * plan at `.cursor/plans/storyboard_engine_hardening_plan_v2_*.plan.md`
 * for the full invariant list.
 *
 * This module centralizes the full-state write so all callers
 * (MapPaintArbiter beat enters, the interactive teardown effect, any
 * future arbiter that needs to reset these layers) go through one
 * function. Properties are listed exhaustively, not merged from
 * whatever was there, so it is impossible to accidentally leak state
 * from the previous writer.
 *
 * The helper does not know about storyboard beats or interactive
 * modes. Callers pass a `DemandUnitsBaselineSpec` describing the
 * state they need. That keeps the helper a pure, testable function
 * of its inputs.
 */

/** Not a parallel "Map type": it is intentionally narrower
 *  than `MapboxGLMap` (from `@repo/map`) because Mapbox GL's strict
 *  `keyof PaintSpecification` / `FilterSpecification` overloads reject
 *  the `readonly unknown[]` expressions carried on our spec/payload
 *  types. The package boundary is still honored upstream: callers
 *  obtain the map via `mapRef.current.getMap()` (typed `MapboxGLMap`
 *  from `@repo/map`) and then pass it into helpers that consume this
 *  write view. See the Roadmap section of packages/map/README.md for
 *  the long-term replacement (value-permissive setters on
 *  `MapOperationsAPI`), after which this type goes away. */
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

/** Filter used when the storyboard isolates Agriculture (Beat 1C tail
 *  and Beat 5). */
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
 *  Same shape as `BaselineMap`; aliased for call-site clarity. */
export type SessionInitMap = MapWriteView

/** Complete specification of the demand-units baseline state.
 *
 *  Every field is required. If you find yourself wanting to make
 *  something optional, think first about whether "inherit from the
 *  previous writer" is really what you want. The whole point of this
 *  helper is that the answer is no.
 *
 *  `fillExpr` is the result of `ctx.buildBlendedTierExpr(fromHex, t)`
 *  or equivalent. Callers that do not have a tier expression ready
 *  can pass `null` and fill-color / fill-outline-color will be left
 *  in place. That path is for the initial pre-playback setup when
 *  the tier table has not loaded yet. All playback and teardown
 *  callers should supply a non-null expression.
 *
 *  Opacity is a tagged union so the interactive-to-playback handoff
 *  can opt out of writing opacity explicitly. The teardown path
 *  deliberately preserves whatever opacity expression the next
 *  writer (the main choreography listener's per-tick branch) is
 *  about to set. Playback entries that need a definite opacity
 *  seeding the ramp pass `{ kind: "scalar", value }`. */
export type DemandUnitsOpacity =
  | { kind: "scalar"; value: number }
  | { kind: "preserve" }

export interface DemandUnitsBaselineSpec {
  /** Mapbox filter applied to both fill and outline layers. Typical
   *  values: `DU_CLASS_FILTER` or `DU_AG_ONLY_FILTER`. */
  filter: readonly unknown[]
  /** Tier color expression for fill, fill-outline, and outline line
   *  color. Pass `null` only in pre-playback setup when the tier data
   *  is not yet loaded. */
  fillExpr: readonly unknown[] | null
  /** Fill-layer opacity directive. `{ kind: "scalar", value }` writes
   *  a scalar opacity (callers seeding a fade-in write 0, callers
   *  landing at peak write the peak value, typically 0.65).
   *  `{ kind: "preserve" }` leaves fill-opacity alone so an
   *  immediately following writer can set it without a spurious
   *  intermediate value landing on the layer. */
  fillOpacity: DemandUnitsOpacity
  /** Outline-layer opacity directive. Same semantics as
   *  `fillOpacity`. Usually matches so fill and stroke move in
   *  lockstep. */
  lineOpacity: DemandUnitsOpacity
  /** Outline line width. Default baseline is `0.5`. Callers styling a
   *  gold LOI ring temporarily bump it via `setPaintProperty`
   *  directly in their own code path. This helper stays with the
   *  baseline value. */
  lineWidth: number
  /** Outline line offset. Baseline is `-0.25` to keep strokes inside
   *  polygon boundaries. */
  lineOffset: number
  /** Layout visibility. Always `"visible"` during active playback or
   *  interactive modes. `"none"` is only appropriate when the map is
   *  being torn down. */
  visibility: "visible" | "none"
}

/** Apply a complete baseline spec to `demand-units` and
 *  `demand-units-outline`. Idempotent: calling it twice in a row
 *  yields the same final Mapbox state.
 *
 *  Always clears fill-opacity-transition, fill-color-transition,
 *  line-opacity-transition, and line-color-transition to zero first
 *  so that subsequent opacity or color writes by per-frame ramps are
 *  not smoothed away by a stale 350 ms or 400 ms transition
 *  inherited from `OutcomePolygonLayer`. This is the single most
 *  important thing this helper does and it was the root cause of
 *  multiple Step 4 to Step 5 regressions. */
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
     *  re-asserts on the next valid tick, so swallowing here is safe. */
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

/** Ensure the `demand-units-outline` line layer exists. In regular
 *  map modes `OutcomePolygonLayer` creates it on demand, but in
 *  get-started mode OPL is skipped for demand-units and the storyboard
 *  owns the session lifecycle. This helper is idempotent: if the
 *  layer already exists it returns without writes, so callers can
 *  call it on every mount cycle without worrying about double-adds.
 *
 *  The outline layer inherits `source` and `source-layer` from the
 *  `demand-units` fill layer. If the fill doesn't exist yet the
 *  helper bails silently (caller should retry when the style is
 *  loaded). */
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
     *  loaded yet. Swallow: the next mount cycle retries. */
  }
}
