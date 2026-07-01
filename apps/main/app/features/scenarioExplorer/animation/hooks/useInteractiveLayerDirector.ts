"use client"

/* useInteractiveLayerDirector: routes interactive-layer wiring through one
 * `InteractiveLayerDirector`, which owns the demand-units and polygon drivers
 * and sequences family swaps so cross-family transitions don't flicker.
 *
 * Three effects:
 *   1. Select   reconcile ownership on (mode, selection, tier-data) change
 *   2. Overlay  apply gold/spotlight/pin on the more frequent changes
 *   3. Cancel   drop a pending fade-in + DU idle-teardown when playback starts
 *
 * Spec building lives here (not the drivers) because it reads React state.
 * One of the TierAnimationSection hooks (see "Who paints the map" in README.md).
 */

import { useEffect } from "react"
import type { Theme } from "@repo/ui/mui"
import {
  getOutcomeConfig,
  RESERVOIR_CALSIM_TO_GNISIDLABEL,
} from "../../../map/config/outcomeLayerRegistry"
import { getInteractiveLayerSchema } from "../interactiveLayerSchema"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import type { OutcomeLocationData } from "../useTierAnimationData"
import type {
  InteractiveLayerDirector,
  BeatEngineContext,
  BeatEngineApi,
  DemandUnitsOverlayState,
  DemandUnitsPaintSpec,
  PolygonPaintSpec,
  SelectRequest,
} from "../engine"

type PlayState = "idle" | "playing" | "paused" | "finished"

interface DirectorParams {
  directorRef: React.RefObject<InteractiveLayerDirector | null>
  engineContext: BeatEngineContext
  engineApiRef: React.RefObject<BeatEngineApi | null>
  selectedOutcomeCode: string | null
  playState: PlayState
  theme: Theme
  /** Climate-overlaid tier data the demand-units painter reads. */
  duOutcomeLocations: Record<string, OutcomeLocationData>
  duOutcomeLocationsRef: React.RefObject<Record<string, OutcomeLocationData>>
  /** Base-scenario tier data the polygon driver reads. */
  polyOutcomeLocations: Record<string, OutcomeLocationData>
  polyOutcomeLocationsRef: React.RefObject<Record<string, OutcomeLocationData>>
  activeLocationSet: Map<string, LocationInfo>
  pinnedLocations: Map<string, LocationInfo>
  spotlightedTier: number | null
}

/** Build the tier-color match expression keyed on `idProperty`. */
function buildColorExpression(
  colorMap: Record<string, string>,
  idProperty: string,
  fallback: string,
): unknown {
  const pairs: (string | number)[] = []
  for (const [featureId, color] of Object.entries(colorMap)) {
    pairs.push(featureId)
    pairs.push(color)
  }
  if (pairs.length === 0) return fallback
  return ["match", ["get", idProperty], ...pairs, fallback]
}

/** See the file header. */
export function useInteractiveLayerDirector({
  directorRef,
  engineContext,
  engineApiRef,
  selectedOutcomeCode,
  playState,
  theme,
  duOutcomeLocations,
  duOutcomeLocationsRef,
  polyOutcomeLocations,
  polyOutcomeLocationsRef,
  activeLocationSet,
  pinnedLocations,
  spotlightedTier,
}: DirectorParams): void {
  /* Select: reconcile ownership. Owns only when a selection exists, the engine
   * is past idle, and no tween runs (`MapPaintArbiter` owns during tweens). The
   * schema picks the family. Spec builders read tier data. Before tier data
   * hydrates the request is null and the director releases. */
  useEffect(() => {
    const director = directorRef.current
    if (!director) return
    const mode = engineApiRef.current?.getMode?.() ?? "idle"
    const canOwn =
      selectedOutcomeCode !== null && mode !== "idle" && playState !== "playing"

    if (!canOwn) {
      director.select(engineContext, null)
      return
    }

    const schema = getInteractiveLayerSchema(selectedOutcomeCode!)
    if (!schema) {
      director.select(engineContext, null)
      return
    }

    let req: SelectRequest | null = null

    if (schema.family === "demand-units") {
      const config = getOutcomeConfig(selectedOutcomeCode!)
      const locData = duOutcomeLocationsRef.current[selectedOutcomeCode!]
      const colorMap = locData?.colorMap
      if (
        config?.classFilter &&
        config.mapboxLayerId === "demand-units" &&
        colorMap &&
        Object.keys(colorMap).length > 0
      ) {
        const idProperty = schema.idProperty
        const spec: DemandUnitsPaintSpec = {
          outcomeCode: selectedOutcomeCode!,
          classFilter: config.classFilter,
          idProperty,
          featureIds: Array.from(locData!.ids),
          colorExpression: buildColorExpression(
            colorMap,
            idProperty,
            theme.palette.grey[500],
          ),
        }
        req = { family: "demand-units", spec }
      }
    } else if (schema.family === "polygon") {
      const locData = polyOutcomeLocationsRef.current[selectedOutcomeCode!]
      if (locData && schema.outlineId) {
        const isReservoir = selectedOutcomeCode === "RES_STOR"
        let ids = Array.from(locData.ids)
        let colorMap = locData.colorMap
        if (isReservoir) {
          const translatedIds: string[] = []
          const translatedColorMap: Record<string, string> = {}
          for (const id of ids) {
            const mapped = RESERVOIR_CALSIM_TO_GNISIDLABEL[id]
            if (mapped) translatedIds.push(mapped)
          }
          for (const [id, color] of Object.entries(colorMap)) {
            const mapped = RESERVOIR_CALSIM_TO_GNISIDLABEL[id]
            if (mapped && !translatedColorMap[mapped]) {
              translatedColorMap[mapped] = color
            }
          }
          ids = [...new Set(translatedIds)]
          colorMap = translatedColorMap
        }
        if (Object.keys(colorMap).length > 0) {
          const idProperty = schema.idProperty
          const spec: PolygonPaintSpec = {
            outcomeCode: selectedOutcomeCode!,
            fillId: schema.fillId,
            outlineId: schema.outlineId,
            idProperty,
            featureIds: ids,
            colorExpression: buildColorExpression(
              colorMap,
              idProperty,
              theme.palette.grey[500],
            ),
            outlineOnly: schema.outlineOnly,
          }
          req = { family: "polygon", spec }
        }
      }
    } else {
      // river/marker: rendered in React. Director only fades out any
      // imperative driver that was showing.
      req = { family: schema.family }
    }

    director.select(engineContext, req)
  }, [
    engineContext,
    selectedOutcomeCode,
    playState,
    theme,
    duOutcomeLocations,
    polyOutcomeLocations,
    directorRef,
    engineApiRef,
    duOutcomeLocationsRef,
    polyOutcomeLocationsRef,
  ])

  /* Overlay: gold highlight + spotlight/pin fill emphasis. Fires far more often
   *  than Select (hover, pin, tier step), so it is a separate pure pass.
   *  Reservoir keys are translated to Mapbox feature ids. */
  useEffect(() => {
    const director = directorRef.current
    if (!director || !selectedOutcomeCode) return

    const schema = getInteractiveLayerSchema(selectedOutcomeCode)
    if (
      !schema ||
      (schema.family !== "demand-units" && schema.family !== "polygon")
    ) {
      return
    }

    const isReservoir = selectedOutcomeCode === "RES_STOR"
    const translate = (id: string) =>
      isReservoir ? (RESERVOIR_CALSIM_TO_GNISIDLABEL[id] ?? id) : id

    const activeFeatureIds: string[] = []
    const pinnedFeatureIds: string[] = []
    for (const [key, info] of activeLocationSet) {
      if (info.code !== selectedOutcomeCode) continue
      const fid = translate(info.sourceId)
      activeFeatureIds.push(fid)
      if (pinnedLocations.has(key)) pinnedFeatureIds.push(fid)
    }

    const ref =
      schema.family === "demand-units"
        ? duOutcomeLocationsRef
        : polyOutcomeLocationsRef
    const locData = ref.current[selectedOutcomeCode]
    const spotlightFeatureIds: string[] = []
    if (spotlightedTier != null && locData) {
      for (const [locId, tier] of Object.entries(locData.tierMap)) {
        if (tier === spotlightedTier) spotlightFeatureIds.push(translate(locId))
      }
    }

    const overlay: DemandUnitsOverlayState = {
      outcomeCode: selectedOutcomeCode,
      activeFeatureIds,
      pinnedFeatureIds,
      spotlightFeatureIds,
      hasSpotlight: spotlightedTier != null,
    }
    director.applyOverlay(engineContext, overlay)
  }, [
    engineContext,
    selectedOutcomeCode,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
    duOutcomeLocations,
    polyOutcomeLocations,
    directorRef,
    duOutcomeLocationsRef,
    polyOutcomeLocationsRef,
  ])

  /* Cancel: when a tween starts, `MapPaintArbiter` writes the layers every
   *  frame. Drop a pending fade-in and the DU deferred-idle teardown so neither
   *  lands late over the beat paint. */
  useEffect(() => {
    if (playState !== "playing") return
    directorRef.current?.cancelPending()
  }, [playState, directorRef])
}
