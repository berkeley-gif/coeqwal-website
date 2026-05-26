/* InteractivePaintArbiter */

import type { MapboxGLMap } from "@repo/map"
import type {
  BeatEngineContext,
  DemandUnitsPaintSpec,
  DemandUnitsOverlayState,
} from "../types"
import { debugLog, logDuState } from "../debug"
import {
  writeDemandUnitsBaseline,
  DU_CLASS_FILTER,
  type BaselineMap,
} from "../demandUnitsBaseline"
import { BEAT1_MID } from "../beat1Palette"

/** Transition observed by the most recent `sync` call. Used for tests
 *  and log correlation. No control flow depends on it. */
export type InteractivePaintTransition =
  | "enter"
  | "exit"
  | "change-selection"
  | "no-op"

//────
// Constants (duplicated from TierAnimationSection to avoid React
// file-level coupling). If any of these diverge here and there the
// gold-outline overlay will look different from the non-DU outcomes,
// so keep them in sync.
//────

/** Fade-in duration (ms) for the initial enter transition. */
const FADE_IN_DURATION = 350
/** Crossfade duration (ms) when swapping between DU outcomes. */
const COLOR_TRANSITION_DURATION = 400
/** Gold highlight color applied to active outlines (hover + pin). */
const HIGHLIGHT_GOLD = "#ffd87e"
/** Base fill opacity below the zoom threshold (zoomed-out view). */
const BASE_FILL_OPACITY = 0.75
/** Zoom level at which the step expression switches branches. */
const ZOOM_THRESHOLD = 8
/** Fill opacity at and above the zoom threshold. */
const ZOOMED_IN_OPACITY = 0.75

/** Zoom-aware fill-opacity for the demand-units layer when no
 *  spotlight / pin overlay is applied. Mirrors the non-outlineOnly
 *  default in `applyPaintChanges`. */
const ZOOM_AWARE_BASE_OPACITY: unknown = [
  "step",
  ["zoom"],
  BASE_FILL_OPACITY,
  ZOOM_THRESHOLD,
  ZOOMED_IN_OPACITY,
]

/** Zoom-aware fill-opacity used during initial fade-in (matches OPL's
 *  default-path final value). Interpolates between zoom 5 and 10. */
const FADE_IN_FILL_OPACITY: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.75,
  8,
  0.55,
  10,
  0.35,
]

/** Zoom-aware outline line-width used in fade-in. Mirrors OPL. */
const OUTLINE_LINE_WIDTH: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  0.5,
  7,
  1,
  9,
  2,
  11,
  3,
]

/** Zoom-aware outline line-offset used in fade-in. Mirrors OPL. */
const OUTLINE_LINE_OFFSET: unknown = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  -0.25,
  7,
  -0.5,
  9,
  -1,
  11,
  -1.5,
]

//────
// Helpers
//────

function buildPaintFilter(spec: DemandUnitsPaintSpec): unknown {
  const conditions: unknown[] = []
  if (spec.classFilter && spec.classFilter !== "N/A") {
    conditions.push(["==", ["get", "Class"], spec.classFilter])
  }
  if (spec.featureIds.length > 0) {
    conditions.push([
      "in",
      ["get", spec.idProperty],
      ["literal", [...spec.featureIds]],
    ])
  }
  if (conditions.length === 0) return null
  if (conditions.length === 1) return conditions[0]
  return ["all", ...conditions]
}

export class InteractivePaintArbiter {
  /** True while this arbiter holds the interactive paint claim. */
  private currentlyOwns = false

  /** Spec for the currently-painted outcome. Null iff `currentlyOwns`
   *  is false. Used by `onChangeSelection` to decide crossfade vs no-op
   *  and by `applyOverlay` as the "base" paint to fall back to when the
   *  overlay clears. */
  private currentSpec: DemandUnitsPaintSpec | null = null

  /** Whether we armed the fade-in transition and flipped opacity to 0
   *  awaiting the RAF follow-up. Guards the RAF handle and reset-on-
   *  re-enter semantics. */
  private pendingFadeRaf: number | null = null

  /** Pending deferred-teardown cleanup fn, or null if no teardown is
   *  waiting on `idle`. */
  private pendingTeardownCleanup: (() => void) | null = null

  /**
   * Reconcile arbiter state against the caller's paint spec */
  sync(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec | null,
  ): InteractivePaintTransition {
    const shouldOwn = spec !== null

    // Enter. No prior claim, now should own.
    if (shouldOwn && !this.currentlyOwns) {
      // Supersede any stale deferred teardown from a previous exit.
      this.cancelPendingTeardown()
      this.currentlyOwns = true
      this.currentSpec = spec
      debugLog(
        `InteractivePaintArbiter ENTER outcome=${spec.outcomeCode} features=${spec.featureIds.length}`,
      )
      this.onEnter(ctx, spec)
      return "enter"
    }

    // Exit. Had prior claim, now should not own.
    if (!shouldOwn && this.currentlyOwns) {
      const prev = this.currentSpec?.outcomeCode ?? null
      this.currentlyOwns = false
      this.currentSpec = null
      this.cancelPendingFadeRaf()
      debugLog(`InteractivePaintArbiter EXIT prevOutcome=${prev}`)
      this.onExit(ctx)
      return "exit"
    }

    // Change selection. Still owning, outcome identity changed.
    if (
      shouldOwn &&
      this.currentlyOwns &&
      spec.outcomeCode !== this.currentSpec?.outcomeCode
    ) {
      const prev = this.currentSpec
      this.currentSpec = spec
      debugLog(
        `InteractivePaintArbiter CHANGE prev=${prev?.outcomeCode ?? "null"} new=${spec.outcomeCode}`,
      )
      this.onChangeSelection(ctx, spec, prev)
      return "change-selection"
    }

    return "no-op"
  }

  /**
   * Apply the selection overlay: gold outline + zoom-aware
   * fill-opacity
   */
  applyOverlay(ctx: BeatEngineContext, overlay: DemandUnitsOverlayState): void {
    if (!this.currentlyOwns || !this.currentSpec) return
    if (overlay.outcomeCode !== this.currentSpec.outcomeCode) return

    const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
    if (!map) return

    const spec = this.currentSpec
    const idProp = spec.idProperty

    try {
      // Outline pass: gold case on active features, tier color otherwise.
      if (map.getLayer("demand-units-outline")) {
        if (overlay.activeFeatureIds.length > 0) {
          const activeMatch: unknown = [
            "in",
            ["get", idProp],
            ["literal", [...overlay.activeFeatureIds]],
          ]
          map.setPaintProperty("demand-units-outline", "line-color", [
            "case",
            activeMatch,
            HIGHLIGHT_GOLD,
            spec.colorExpression,
          ] as never)
          map.setPaintProperty("demand-units-outline", "line-width", [
            "case",
            activeMatch,
            2,
            1,
          ] as never)
          map.setPaintProperty("demand-units-outline", "line-opacity", [
            "case",
            activeMatch,
            1,
            0,
          ] as never)
        } else {
          map.setPaintProperty(
            "demand-units-outline",
            "line-color",
            spec.colorExpression as never,
          )
          map.setPaintProperty(
            "demand-units-outline",
            "line-width",
            OUTLINE_LINE_WIDTH as never,
          )
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            1 as never,
          )
        }
      }

      // Fill pass: spotlight > pinned > zoom-aware base.
      if (!map.getLayer("demand-units")) return

      if (overlay.hasSpotlight) {
        if (overlay.spotlightFeatureIds.length > 0) {
          const spotlightMatch: unknown = [
            "in",
            ["get", idProp],
            ["literal", [...overlay.spotlightFeatureIds]],
          ]
          map.setPaintProperty("demand-units", "fill-opacity", [
            "case",
            spotlightMatch,
            0.9,
            0.12,
          ] as never)
        } else {
          // Spotlight requested but no matching DUs -- dim all.
          map.setPaintProperty("demand-units", "fill-opacity", 0.12 as never)
        }
      } else if (overlay.pinnedFeatureIds.length > 0) {
        const pinnedMatch: unknown = [
          "in",
          ["get", idProp],
          ["literal", [...overlay.pinnedFeatureIds]],
        ]
        map.setPaintProperty("demand-units", "fill-opacity", [
          "step",
          ["zoom"],
          ["case", pinnedMatch, 1, BASE_FILL_OPACITY],
          ZOOM_THRESHOLD,
          ZOOMED_IN_OPACITY,
        ] as never)
      } else {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          ZOOM_AWARE_BASE_OPACITY as never,
        )
      }
    } catch (e) {
      debugLog(`InteractivePaintArbiter.applyOverlay ERROR`, e)
    }
  }

  /**
   * Unconditionally release ownership. Called on engine unmount or
   * when a nav handler wants to force-clear interactive state without
   * driving through `sync`.
   */
  release(ctx: BeatEngineContext): void {
    if (!this.currentlyOwns) return
    const prev = this.currentSpec?.outcomeCode ?? null
    this.currentlyOwns = false
    this.currentSpec = null
    this.cancelPendingFadeRaf()
    debugLog(`InteractivePaintArbiter RELEASE prev=${prev}`)
    this.onExit(ctx)
  }

  /** True iff the arbiter is currently the active writer. */
  owns(): boolean {
    return this.currentlyOwns
  }

  /** Cancel any pending deferred-teardown `idle` listener. Public so
   *  `TierAnimationSection` can abort a teardown when `playState`
   *  transitions to `"playing"` -- at that point `MapPaintArbiter` is
   *  about to take the wheel and the pending teardown would stomp
   *  whatever beat it writes. Idempotent. */
  cancelPendingTeardown(): void {
    if (!this.pendingTeardownCleanup) return
    const cleanup = this.pendingTeardownCleanup
    this.pendingTeardownCleanup = null
    cleanup()
  }

  //────
  // Lifecycle hooks
  //────

  /**
   * Take ownership of `demand-units` / `demand-units-outline`.
   */
  private onEnter(ctx: BeatEngineContext, spec: DemandUnitsPaintSpec): void {
    const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
    if (!map) {
      debugLog(`  interactive.onEnter: no map, skipping`)
      return
    }
    if (!map.getLayer("demand-units")) {
      debugLog(`  interactive.onEnter: no demand-units layer, skipping`)
      return
    }

    this.cancelPendingFadeRaf()

    try {
      logDuState("InteractivePaintArbiter.onEnter PRE", map)

      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter as never)
      map.setPaintProperty(
        "demand-units",
        "fill-color",
        spec.colorExpression as never,
      )
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: FADE_IN_DURATION,
        delay: 0,
      } as never)
      map.setPaintProperty("demand-units", "fill-opacity", 0 as never)
      map.setLayoutProperty("demand-units", "visibility", "visible")

      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity-transition",
          {
            duration: FADE_IN_DURATION,
            delay: 0,
          } as never,
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 0 as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTLINE_LINE_WIDTH as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-offset",
          OUTLINE_LINE_OFFSET as never,
        )
      }

      logDuState("InteractivePaintArbiter.onEnter POST-sync", map)
    } catch (e) {
      debugLog(`InteractivePaintArbiter.onEnter ERROR (pre-RAF)`, e)
      return
    }

    // Step 2: next frame, flip opacity to target so the armed
    // transition actually animates instead of snapping.
    this.pendingFadeRaf = requestAnimationFrame(() => {
      this.pendingFadeRaf = null
      // Bail if we lost ownership while the RAF was in flight (rapid
      // click/deselect). The post-enter paint would otherwise land
      // after `onExit`'s baseline write and re-make the layer visible.
      if (!this.currentlyOwns) return
      if (this.currentSpec?.outcomeCode !== spec.outcomeCode) return
      if (!map.getLayer("demand-units")) return

      try {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          FADE_IN_FILL_OPACITY as never,
        )
        if (map.getLayer("demand-units-outline")) {
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            1 as never,
          )
          map.setLayoutProperty("demand-units-outline", "visibility", "visible")
        }
        logDuState("InteractivePaintArbiter.onEnter POST-RAF", map)
      } catch (e) {
        debugLog(`InteractivePaintArbiter.onEnter ERROR (RAF)`, e)
      }
    })
  }

  /**
   * Crossfade to a different DU outcome while retaining ownership.
   */
  private onChangeSelection(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec,
    _prev: DemandUnitsPaintSpec | null,
  ): void {
    const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
    if (!map || !map.getLayer("demand-units")) return

    this.cancelPendingFadeRaf()

    try {
      logDuState("InteractivePaintArbiter.onChangeSelection PRE", map)

      // Must run **before** setFilter: old overlay expressions + new
      // class slice can disagree for a single paint otherwise.
      this.clearOverlayToBaseForCrossfade(map, spec)

      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter as never)
      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter as never)
      }

      map.setPaintProperty("demand-units", "fill-color-transition", {
        duration: COLOR_TRANSITION_DURATION,
        delay: 0,
      } as never)
      map.setPaintProperty(
        "demand-units",
        "fill-color",
        spec.colorExpression as never,
      )

      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: COLOR_TRANSITION_DURATION,
          delay: 0,
        } as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
      }

      logDuState("InteractivePaintArbiter.onChangeSelection POST", map)
    } catch (e) {
      debugLog(`InteractivePaintArbiter.onChangeSelection ERROR`, e)
    }
  }

  private clearOverlayToBaseForCrossfade(
    map: MapboxGLMap,
    spec: DemandUnitsPaintSpec,
  ) {
    try {
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      } as never)
      map.setPaintProperty(
        "demand-units",
        "fill-opacity",
        ZOOM_AWARE_BASE_OPACITY as never,
      )
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: 0,
          delay: 0,
        } as never)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression as never,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTLINE_LINE_WIDTH as never,
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 1 as never)
      }
    } catch {
      /* ok */
    }
  }

  private onExit(ctx: BeatEngineContext): void {
    debugLog(`  interactive.onExit: scheduling teardown`)
    const map: MapboxGLMap | undefined = ctx.mapRef?.current?.getMap?.()
    if (!map) {
      debugLog(`  interactive.onExit: no map, skipping`)
      return
    }

    this.cancelPendingTeardown()

    const runTeardownWrites = (m: MapboxGLMap): void => {
      try {
        logDuState("InteractivePaintArbiter.onExit PRE-write", m)
        writeDemandUnitsBaseline(m as unknown as BaselineMap, {
          filter: DU_CLASS_FILTER,
          fillExpr: ctx.buildBlendedTierExpr(BEAT1_MID, 1) as
            | readonly unknown[]
            | null,
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
        logDuState("InteractivePaintArbiter.onExit POST-write", m)
      } catch (e) {
        debugLog(`InteractivePaintArbiter.onExit ERROR`, e)
      }
    }

    if (map.isStyleLoaded()) {
      runTeardownWrites(map)
      return
    }

    debugLog(`  interactive.onExit: style busy, deferring to idle`)
    let ran = false
    const onIdle = () => {
      if (ran) return
      ran = true
      this.pendingTeardownCleanup = null

      if (this.currentlyOwns) {
        debugLog(
          `  interactive.onExit idle-bail currentlyOwns=true mode=${ctx.getMode()}`,
        )
        return
      }
      debugLog(`  interactive.onExit: running after idle`)
      runTeardownWrites(map)
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
