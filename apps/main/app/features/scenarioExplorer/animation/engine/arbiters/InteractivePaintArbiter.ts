/* InteractivePaintArbiter
 *
 * Paints the demand-units layers while the user clicks around in
 * interactive mode (after the storyboard has finished). It takes over
 * the layers when a demand-units outcome is selected and hands them
 * back when the selection clears.
 */

import type {
  BeatEngineContext,
  DemandUnitsPaintSpec,
  DemandUnitsOverlayState,
} from "../types"
import {
  writeDemandUnitsBaseline,
  DU_CLASS_FILTER,
  type MapWriteView,
} from "../demandUnitsBaseline"
import { BLUE_MID } from "../bluePalette"
import {
  ZOOM_AWARE_BASE_OPACITY,
  OUTCOME_FILL_OPACITY,
  OUTCOME_OUTLINE_WIDTH,
  OUTCOME_OUTLINE_OFFSET,
  buildActiveOutlineExpr,
  buildFillOpacityExpr,
} from "../../demandUnitsPaint"

/** What the last `sync` call did. For tests and logging only; nothing
 *  branches on it. */
export type InteractivePaintTransition =
  | "enter"
  | "exit"
  | "change-selection"
  | "no-op"

// Gold outline and zoom-aware opacities are shared with the scripted
// storyboard. They live in `demandUnitsPaint.ts` so the interactive view
// matches the beats. The durations below are interactive-only.

/** Fade-in duration (ms) for the initial enter transition. */
const FADE_IN_DURATION = 350
/** Crossfade duration (ms) when swapping between DU outcomes. */
const COLOR_TRANSITION_DURATION = 400

/** The exit teardown also needs Mapbox's style-load probe and one-shot
 *  idle listener, which the permissive write view omits. */
type InteractiveExitMap = MapWriteView & {
  isStyleLoaded: () => boolean
  once: (event: string, cb: () => void) => void
  off?: (event: string, cb: () => void) => void
}

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

  /** The outcome currently being painted, or null when we don't own
   *  the layers. Used to decide whether a new selection is a crossfade,
   *  and as the base paint to restore when an overlay clears. */
  private currentSpec: DemandUnitsPaintSpec | null = null

  /** Handle for the queued fade-in frame, or null when none is
   *  pending. */
  private pendingFadeRaf: number | null = null

  /** A teardown waiting for the engine to go idle, or null if none. */
  private pendingTeardownCleanup: (() => void) | null = null

  /** Bring our state in line with the caller's paint spec (pass null
   *  to release the layers). */
  sync(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec | null,
  ): InteractivePaintTransition {
    const shouldOwn = spec !== null

    // Enter. No prior claim, now should own.
    if (shouldOwn && !this.currentlyOwns) {
      // Cancel any teardown left over from a previous exit.
      this.cancelPendingTeardown()
      this.currentlyOwns = true
      this.currentSpec = spec
      this.onEnter(ctx, spec)
      return "enter"
    }

    // Exit. Had prior claim, now should not own.
    if (!shouldOwn && this.currentlyOwns) {
      this.currentlyOwns = false
      this.currentSpec = null
      this.cancelPendingFadeRaf()
      this.onExit(ctx)
      return "exit"
    }

    // Selection changed. Still owning, but a different outcome.
    if (
      shouldOwn &&
      this.currentlyOwns &&
      spec.outcomeCode !== this.currentSpec?.outcomeCode
    ) {
      const prev = this.currentSpec
      this.currentSpec = spec
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

    const map = this.getWriteMap(ctx)
    if (!map) return

    const spec = this.currentSpec
    const idProp = spec.idProperty

    try {
      // Outline pass: gold case on active features, tier color otherwise.
      if (map.getLayer("demand-units-outline")) {
        if (overlay.activeFeatureIds.length > 0) {
          const { lineColor, lineWidth, lineOpacity } = buildActiveOutlineExpr(
            overlay.activeFeatureIds,
            idProp,
            spec.colorExpression,
          )
          map.setPaintProperty("demand-units-outline", "line-color", lineColor)
          map.setPaintProperty("demand-units-outline", "line-width", lineWidth)
          map.setPaintProperty(
            "demand-units-outline",
            "line-opacity",
            lineOpacity,
          )
        } else {
          map.setPaintProperty(
            "demand-units-outline",
            "line-color",
            spec.colorExpression,
          )
          map.setPaintProperty(
            "demand-units-outline",
            "line-width",
            OUTCOME_OUTLINE_WIDTH,
          )
          map.setPaintProperty("demand-units-outline", "line-opacity", 1)
        }
      }

      // Fill pass, in priority order: spotlight, then pinned, then base.
      if (!map.getLayer("demand-units")) return

      map.setPaintProperty(
        "demand-units",
        "fill-opacity",
        buildFillOpacityExpr(overlay, idProp),
      )
    } catch {
      /* ok */
    }
  }

  /** Release the layers no matter what. Called on unmount or when a
   *  nav handler force-clears without going through `sync`. */
  release(ctx: BeatEngineContext): void {
    if (!this.currentlyOwns) return
    this.currentlyOwns = false
    this.currentSpec = null
    this.cancelPendingFadeRaf()
    this.onExit(ctx)
  }

  /** True when this arbiter is currently the active writer. */
  owns(): boolean {
    return this.currentlyOwns
  }

  /** Cancel a teardown that's waiting for idle. `TierAnimationSection`
   *  calls this when playback starts: `MapPaintArbiter` is about to
   *  take over, and a late teardown would overwrite its paint. Safe to
   *  call when nothing is pending. */
  cancelPendingTeardown(): void {
    if (!this.pendingTeardownCleanup) return
    const cleanup = this.pendingTeardownCleanup
    this.pendingTeardownCleanup = null
    cleanup()
  }

  //────
  // Lifecycle hooks
  //────

  /** The live Mapbox handle viewed through the permissive write surface.
   *  Its setters accept `unknown`, so the dynamic Mapbox expressions this
   *  arbiter builds type-check without per-call casts. */
  private getWriteMap(ctx: BeatEngineContext): MapWriteView | undefined {
    return ctx.mapRef?.current?.getMap?.() as unknown as
      | MapWriteView
      | undefined
  }

  /** Take ownership of the `demand-units` and `demand-units-outline`
   *  layers. */
  private onEnter(ctx: BeatEngineContext, spec: DemandUnitsPaintSpec): void {
    const map = this.getWriteMap(ctx)
    if (!map) return
    if (!map.getLayer("demand-units")) return

    this.cancelPendingFadeRaf()

    try {
      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter)
      map.setPaintProperty("demand-units", "fill-color", spec.colorExpression)
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: FADE_IN_DURATION,
        delay: 0,
      })
      map.setPaintProperty("demand-units", "fill-opacity", 0)
      map.setLayoutProperty("demand-units", "visibility", "visible")

      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter)
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity-transition",
          {
            duration: FADE_IN_DURATION,
            delay: 0,
          },
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 0)
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTCOME_OUTLINE_WIDTH,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-offset",
          OUTCOME_OUTLINE_OFFSET,
        )
      }
    } catch {
      return
    }

    // Next frame, set opacity to the target so the transition animates
    // instead of snapping.
    this.pendingFadeRaf = requestAnimationFrame(() => {
      this.pendingFadeRaf = null
      // Bail if we lost ownership while the frame was queued (rapid
      // click then deselect). Otherwise this paint would land after
      // `onExit` and make the layer visible again.
      if (!this.currentlyOwns) return
      if (this.currentSpec?.outcomeCode !== spec.outcomeCode) return
      if (!map.getLayer("demand-units")) return

      try {
        map.setPaintProperty(
          "demand-units",
          "fill-opacity",
          OUTCOME_FILL_OPACITY,
        )
        if (map.getLayer("demand-units-outline")) {
          map.setPaintProperty("demand-units-outline", "line-opacity", 1)
          map.setLayoutProperty("demand-units-outline", "visibility", "visible")
        }
      } catch {
        /* ok */
      }
    })
  }

  /** Crossfade to a different outcome while keeping ownership. */
  private onChangeSelection(
    ctx: BeatEngineContext,
    spec: DemandUnitsPaintSpec,
    _prev: DemandUnitsPaintSpec | null,
  ): void {
    const map = this.getWriteMap(ctx)
    if (!map || !map.getLayer("demand-units")) return

    this.cancelPendingFadeRaf()

    try {
      // Run before `setFilter`: otherwise the old overlay expression
      // and the new class filter can disagree for one frame.
      this.clearOverlayToBaseForCrossfade(map, spec)

      const filter = buildPaintFilter(spec)
      map.setFilter("demand-units", filter)
      if (map.getLayer("demand-units-outline")) {
        map.setFilter("demand-units-outline", filter)
      }

      map.setPaintProperty("demand-units", "fill-color-transition", {
        duration: COLOR_TRANSITION_DURATION,
        delay: 0,
      })
      map.setPaintProperty("demand-units", "fill-color", spec.colorExpression)

      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: COLOR_TRANSITION_DURATION,
          delay: 0,
        })
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression,
        )
      }
    } catch {
      /* ok */
    }
  }

  private clearOverlayToBaseForCrossfade(
    map: MapWriteView,
    spec: DemandUnitsPaintSpec,
  ) {
    try {
      map.setPaintProperty("demand-units", "fill-opacity-transition", {
        duration: 0,
        delay: 0,
      })
      map.setPaintProperty(
        "demand-units",
        "fill-opacity",
        ZOOM_AWARE_BASE_OPACITY,
      )
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty("demand-units-outline", "line-color-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty(
          "demand-units-outline",
          "line-color",
          spec.colorExpression,
        )
        map.setPaintProperty(
          "demand-units-outline",
          "line-width",
          OUTCOME_OUTLINE_WIDTH,
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 1)
      }
    } catch {
      /* ok */
    }
  }

  private onExit(ctx: BeatEngineContext): void {
    const map = ctx.mapRef?.current?.getMap?.() as unknown as
      | InteractiveExitMap
      | undefined
    if (!map) return

    this.cancelPendingTeardown()

    // Hide the layers immediately, even when the style isn't fully loaded
    // (mid camera-fly). The full baseline reset below may be deferred to
    // `idle`, but the hide must land now so demand-units is gone before the
    // next outcome's layer fades in, rather than lingering under it.
    this.hideImmediately(map)

    const runTeardownWrites = (m: InteractiveExitMap): void => {
      try {
        writeDemandUnitsBaseline(m, {
          filter: DU_CLASS_FILTER,
          fillExpr: ctx.buildBlendedTierExpr(BLUE_MID, 1) as
            | readonly unknown[]
            | null,
          fillOpacity: { kind: "scalar", value: 0 },
          lineOpacity: { kind: "scalar", value: 0 },
          lineWidth: 0.5,
          lineOffset: -0.25,
          visibility: "visible",
        })
      } catch {
        /* ok */
      }
    }

    if (map.isStyleLoaded()) {
      runTeardownWrites(map)
      return
    }

    let ran = false
    const onIdle = () => {
      if (ran) return
      ran = true
      this.pendingTeardownCleanup = null

      if (this.currentlyOwns) return
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

  /** Snap both layers to opacity 0 with no transition. Best-effort: works
   *  on existing layers even while the style is mid-load, so the layer
   *  disappears at once instead of waiting for the deferred baseline. */
  private hideImmediately(map: MapWriteView): void {
    try {
      if (map.getLayer("demand-units")) {
        map.setPaintProperty("demand-units", "fill-opacity-transition", {
          duration: 0,
          delay: 0,
        })
        map.setPaintProperty("demand-units", "fill-opacity", 0)
      }
      if (map.getLayer("demand-units-outline")) {
        map.setPaintProperty(
          "demand-units-outline",
          "line-opacity-transition",
          {
            duration: 0,
            delay: 0,
          },
        )
        map.setPaintProperty("demand-units-outline", "line-opacity", 0)
      }
    } catch {
      /* ok */
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
