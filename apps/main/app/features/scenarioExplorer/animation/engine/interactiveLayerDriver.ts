/* InteractiveLayerDriver
 *
 * Uniform contract every interactive map-layer owner implements so
 * `InteractiveLayerDirector` can treat them the same on select, swap, or
 * deselect during get-started interactive mode.
 *
 * Two concrete imperative drivers exist:
 *   - `InteractivePaintArbiter` owns `demand-units` / `demand-units-outline`
 *   - `PolygonLayerDriver`      owns the non-DU vector polygons
 *                               (`calsim-wba`, `california-reservoir`,
 *                               `delta-detaw`) plus their outlines
 *
 * The river (`RiversLayer`) and React markers (`TierMarkers`,
 * `TierLocationLabels`) are not drivers: they render in React and recolor
 * in place. The director only tracks their family so it can fade an
 * outgoing imperative driver out before the React-owned layer takes over.
 * Those families are in the schema (`map/config/interactiveLayerSchema.ts`)
 * but have no driver object.
 */

import type { BeatEngineContext } from "./types"

/** Which rendering family owns a given outcome's interactive map layer. */
export type InteractiveLayerFamily =
  | "demand-units"
  | "polygon"
  | "river"
  | "marker"

/**
 * Common surface the director relies on. Each driver also exposes its own
 * `sync(ctx, spec | null)` and `applyOverlay(ctx, overlay)` with a
 * family-specific spec type. The director calls those on the concrete
 * driver, so they are not part of this shared interface.
 */
export interface InteractiveLayerDriver {
  /** The family this driver owns. */
  readonly family: InteractiveLayerFamily
  /** True while the driver is the active writer of its layers. */
  owns(): boolean
  /** Mapbox fill-layer id the driver currently owns, or null. Compared
   *  against an incoming selection's fill id to decide recolor-in-place
   *  vs cross-layer handoff. */
  ownedLayerId(): string | null
  /** Force the driver to release its layers (nav teardown / unmount). */
  release(ctx: BeatEngineContext): void
}
