/* Interactive layer schema.
 *
 * The ownership/transition half of "which map layer does this outcome use",
 * derived from `OUTCOME_LAYER_REGISTRY` (geometry, layer ids, id property).
 * The registry says what the layer is. This says who owns it interactively
 * and how it transitions.
 *
 * Consumed by `InteractiveLayerDirector` to pick a selection's driver and
 * sequence handoffs between families, in one lookup instead of recomputing
 * from scattered booleans.
 */

import { getOutcomeConfig } from "../../map/config/outcomeLayerRegistry"
import type { InteractiveLayerFamily } from "./engine"

export interface InteractiveLayerSchemaEntry {
  /** Outcome code this entry describes (e.g. `"AG_REV"`). */
  outcomeCode: string
  /** Rendering family that owns the layer. */
  family: InteractiveLayerFamily
  /** Mapbox fill-layer id. Empty string for React-rendered families. */
  fillId: string
  /** Mapbox outline-layer id, or null for families without an outline. */
  outlineId: string | null
  /** Feature-id property column used in filters and overlays. */
  idProperty: string
  /** When true, fill stays transparent and only the broad outline paints. */
  outlineOnly: boolean
  /** Fade-in duration (ms) when this layer enters. */
  fadeInMs: number
  /** Fade-out duration (ms) when this layer exits. */
  fadeOutMs: number
}

/** Initial fade-in for an entering layer. Matches the arbiters' constant. */
const FADE_IN_MS = 350
/** Fast fade-out for an outgoing layer during a cross-family handoff. */
const FADE_OUT_MS = 200

function resolveFamily(
  geometryType: string,
  layerType: string,
): InteractiveLayerFamily | null {
  if (geometryType === "polygon") {
    return layerType === "demand-units" ? "demand-units" : "polygon"
  }
  if (geometryType === "line") return "river"
  if (geometryType === "react-marker") return "marker"
  return null
}

/** Interactive-layer schema for an outcome, or null when the outcome is
 *  unknown or has no interactive layer family. */
export function getInteractiveLayerSchema(
  outcomeCode: string,
): InteractiveLayerSchemaEntry | null {
  const config = getOutcomeConfig(outcomeCode)
  if (!config) return null

  const family = resolveFamily(config.geometryType, config.layerType)
  if (!family) return null

  const fillId = config.mapboxLayerId
  const idProperty = config.idProperty ?? "DU_ID"
  const hasOutline = family === "demand-units" || family === "polygon"

  return {
    outcomeCode,
    family,
    fillId,
    outlineId: hasOutline && fillId ? `${fillId}-outline` : null,
    idProperty,
    outlineOnly: !!config.outlineOnly,
    fadeInMs: FADE_IN_MS,
    fadeOutMs: FADE_OUT_MS,
  }
}
