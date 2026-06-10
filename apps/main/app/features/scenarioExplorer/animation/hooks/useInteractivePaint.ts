"use client"

/* useInteractivePaint: the interactive demand-units painter
 *
 * Wires the event-driven InteractivePaintArbiter that owns the
 * `demand-units` layers while the user clicks around in interactive
 * mode. Reconciles ownership on selection and mode changes and applies
 * the per-selection overlay. The parent keeps the unmount release so
 * its cleanup order relative to the map-layer reset stays fixed. One of
 * the TierAnimationSection hooks (see "Who paints the map" in README.md).
 */

import { useEffect } from "react"
import type { Theme } from "@repo/ui/mui"
import { getOutcomeConfig } from "../../../map/config/outcomeLayerRegistry"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import type { OutcomeLocationData } from "../useTierAnimationData"
import type {
  InteractivePaintArbiter,
  BeatEngineContext,
  BeatEngineApi,
  DemandUnitsOverlayState,
  DemandUnitsPaintSpec,
} from "../engine"

type PlayState = "idle" | "playing" | "paused" | "finished"

interface InteractivePaintParams {
  /** The arbiter instance, created in the parent so the navigation
   *  handlers can release it on Back and Restart. */
  interactivePaintArbiterRef: React.RefObject<InteractivePaintArbiter | null>
  engineContext: BeatEngineContext
  engineApiRef: React.RefObject<BeatEngineApi | null>
  selectedOutcomeCode: string | null
  playState: PlayState
  theme: Theme
  outcomeLocations: Record<string, OutcomeLocationData>
  outcomeLocationsRef: React.RefObject<Record<string, OutcomeLocationData>>
  activeLocationSet: Map<string, LocationInfo>
  pinnedLocations: Map<string, LocationInfo>
  spotlightedTier: number | null
}

/** See the file header. */
export function useInteractivePaint({
  interactivePaintArbiterRef,
  engineContext,
  engineApiRef,
  selectedOutcomeCode,
  playState,
  theme,
  outcomeLocations,
  outcomeLocationsRef,
  activeLocationSet,
  pinnedLocations,
  spotlightedTier,
}: InteractivePaintParams): void {
  /* 
   *
   * Reconcile the arbiter's ownership of `demand-units` /
   * `demand-units-outline` whenever selection, engine mode, or
   * `playState` changes. The arbiter owns (and paints) only when all of:
   *
   *   1. A DU outcome (`layerType === "demand-units"`) is selected.
   *   2. Engine mode is not `"idle"` (we're in or past the storyboard).
   *   3. `playState !== "playing"` (no active tween, since
   *      `MapPaintArbiter` owns during tweens).
   *   4. Tier data for that outcome has hydrated
   *      (`outcomeLocationsRef` has the colorMap).
   *
   * When all four hold, we build a `DemandUnitsPaintSpec` and pass it
   * to `sync`. When any fail, we pass `null` and the arbiter tears
   * down. Condition (3) lets the arbiter also own during the
   * paused-between-beats state, so a mid-storyboard square click's
   * gold outline is cleaned up on deselect.
   *
   * Mode isn't reactive (it lives on a ref inside `BeatEngine`), so
   * we depend on `playState` as a proxy: every `setMode(...)` call in
   * the parent happens alongside a `setPlayState(...)` call, so the
   * effect fires on the same frame the mode transitioned. */
  useEffect(() => {
    const arbiter = interactivePaintArbiterRef.current
    if (!arbiter) return

    const mode = engineApiRef.current?.getMode?.() ?? "idle"
    const canOwn =
      selectedOutcomeCode !== null && mode !== "idle" && playState !== "playing"

    let spec: DemandUnitsPaintSpec | null = null
    if (canOwn) {
      const config = getOutcomeConfig(selectedOutcomeCode!)
      if (
        config?.layerType === "demand-units" &&
        config.classFilter &&
        config.mapboxLayerId === "demand-units"
      ) {
        const locData = outcomeLocationsRef.current[selectedOutcomeCode!]
        const colorMap = locData?.colorMap
        if (colorMap && Object.keys(colorMap).length > 0) {
          const idProperty = config.idProperty ?? "DU_ID"
          // Build the tier-colored match expression: keyed on idProperty,
          // one pair per feature id, `theme.palette.grey[500]` fallback.
          const colorPairs: (string | number)[] = []
          for (const [featureId, color] of Object.entries(colorMap)) {
            colorPairs.push(featureId)
            colorPairs.push(color)
          }
          const colorExpression =
            colorPairs.length > 0
              ? [
                  "match",
                  ["get", idProperty],
                  ...colorPairs,
                  theme.palette.grey[500],
                ]
              : theme.palette.grey[500]
          spec = {
            outcomeCode: selectedOutcomeCode!,
            classFilter: config.classFilter,
            idProperty,
            featureIds: Array.from(locData!.ids),
            colorExpression,
          }
        }
      }
    }

    arbiter.sync(engineContext, spec)
    // `theme` dep covers the grey fallback. `outcomeLocations` fires
    // the re-sync when tier data hydrates for the current outcome.
  }, [engineContext, selectedOutcomeCode, playState, theme, outcomeLocations])

  /* Overlay
   *
   * Apply the per-selection overlay (gold outline + zoom-aware
   * fill-opacity with optional spotlight / pinned overrides) whenever
   * active locations, pinned locations, or the loi-highlight beat's spotlighted tier
   * change. Separated from `sync` because overlay state changes much
   * more frequently (hover, pin toggle, tier step) and can be written
   * as a pure overlay pass without re-running the full enter /
   * crossfade sequence.
   *
   * No-op when the arbiter doesn't own. Cheap guard inside the
   * arbiter, so we don't duplicate the ownership check here. */
  useEffect(() => {
    const arbiter = interactivePaintArbiterRef.current
    if (!arbiter || !arbiter.owns() || !selectedOutcomeCode) return

    // Translate active + pinned keys into feature ids matching the
    // demand-units `idProperty`. DU outcomes don't use the reservoir
    // name-translation map, so `sourceId` is already the feature id.
    const activeFeatureIds: string[] = []
    const pinnedFeatureIds: string[] = []
    for (const [key, info] of activeLocationSet) {
      if (info.code !== selectedOutcomeCode) continue
      activeFeatureIds.push(info.sourceId)
      if (pinnedLocations.has(key)) pinnedFeatureIds.push(info.sourceId)
    }

    // Spotlight: only meaningful for AG_REV + matching tier.
    const locData = outcomeLocationsRef.current[selectedOutcomeCode]
    const spotlightFeatureIds: string[] = []
    if (spotlightedTier != null && locData) {
      for (const [locId, tier] of Object.entries(locData.tierMap)) {
        if (tier === spotlightedTier) spotlightFeatureIds.push(locId)
      }
    }

    const overlay: DemandUnitsOverlayState = {
      outcomeCode: selectedOutcomeCode,
      activeFeatureIds,
      pinnedFeatureIds,
      spotlightFeatureIds,
      hasSpotlight: spotlightedTier != null,
    }
    arbiter.applyOverlay(engineContext, overlay)
  }, [
    engineContext,
    selectedOutcomeCode,
    activeLocationSet,
    pinnedLocations,
    spotlightedTier,
    outcomeLocations,
  ])

  /* Teardown cancellation
   *
   * When `playState` flips to `"playing"` the storyboard is tweening
   * and `MapPaintArbiter`'s beat actors are writing `demand-units`
   * every frame. If the arbiter has a deferred-idle teardown pending
   * from a just-prior deselect, it would land after the tween settles
   * and overwrite whatever beat paint `MapPaintArbiter` left on the
   * layer. Cancel it here so the pending listener detaches cleanly.
   * Safe to call when no teardown is pending. */
  useEffect(() => {
    if (playState !== "playing") return
    interactivePaintArbiterRef.current?.cancelPendingTeardown()
  }, [playState])
}
