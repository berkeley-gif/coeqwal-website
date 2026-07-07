/* Beat engine type definitions.
 *
 * Actors are plain data. Everything they need is in their payload or the
 * `BeatEngineContext` passed at dispatch. An actor's `window` is a
 * half-open progress interval `[start, end)`: `enter` once on entry,
 * `update` every frame inside (including the enter frame), `exit` once on
 * leave. Each actor's `kind` declares which arbiter owns it.
 */

import type { RefObject } from "react"
import type { TimingBeat } from "../animationTiming"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import type { LocationHighlight } from "../../../map/store"
import type { MapRef } from "@repo/map"

/**
 * When and where to fade out a set of Mapbox features as their SVG
 * distribution-square morph takes over. One entry per (outcome, layer).
 */
export interface HideScheduleEntry {
  /** Outcome this entry belongs to (`"AG_REV"`, `"DS"`). For debugging. */
  code: string
  /** Feature shape. `"polygon"` on `demand-units` drives the Beat 2 fill
   *  fade. `"line"` fades a line layer. `"react-marker"` has no Mapbox
   *  layer and just marks which units the outcome tracks. */
  geometryType: "polygon" | "line" | "react-marker"
  /** Mapbox layer id to fade. Empty for `"react-marker"`. */
  mapboxLayerId: string
  /** Feature property used to match features (`"DU_ID"` for demand-units). */
  idProperty: string
  /** Opacity is 1 before `fadeStart`, fades to 0 across the window, stays
   *  0 after `morphStart`. */
  fadeStart: number
  morphStart: number
  /** Feature ids this entry fades. */
  locationIds: string[]
}

/**
 * Engine-level mode signal. Ensures each map resource (above all
 * `demand-units`) is owned by exactly one arbiter at a time, since both
 * `MapPaintArbiter` and `InteractivePaintArbiter` paint `demand-units`
 * and a sloppy handoff would leak a stale color or opacity.
 *
 * - `"idle"`: pre-play (before Play) or post-Restart. No arbiter writes
 *   `demand-units`. It sits at its Beat 0 baseline.
 * - `"playback"`: beats tweening. `MapPaintArbiter` owns `demand-units`.
 * - `"interactive"`: storyboard settled, user can click squares.
 *   `InteractivePaintArbiter` owns `demand-units`.
 */
export type EngineMode = "idle" | "playback" | "interactive"

/**
 * Everything `InteractivePaintArbiter` needs to paint one demand-units
 * outcome. Built by `TierAnimationSection` from the outcome config and
 * tier data. Pass to `sync` to paint, or null to release the layers.
 */
export interface DemandUnitsPaintSpec {
  /** Outcome code (`"AG_REV"`, `"CWS_DEL"`). Identity for crossfade. */
  outcomeCode: string
  /** DU `Class` column filter value. Same as `OutcomeLayerConfig.classFilter`. */
  classFilter: "Agriculture" | "Urban" | "Refuge" | "N/A"
  /** Feature-id property column (`"DU_ID"` for all current DU outcomes). */
  idProperty: string
  /** Feature ids to include in the `["in", idProperty, ...]` filter. */
  featureIds: readonly string[]
  /** Mapbox `match` expression (or hex string fallback) for fill/line color. */
  colorExpression: unknown
}

/**
 * Per-selection overlay on top of the base paint: gold outline plus
 * spotlight / pinned fill-opacity. Sent to
 * `InteractivePaintArbiter.applyOverlay` on active/pinned/spotlight
 * changes. Separate from `DemandUnitsPaintSpec` because it changes far
 * more often (hover, pin, tier step) and applies without re-running the
 * full enter or crossfade.
 */
export interface DemandUnitsOverlayState {
  /** Which outcome this overlay is for. */
  outcomeCode: string
  /** Active (hovered or pinned) feature ids. Gold outline, opacity 1. */
  activeFeatureIds: readonly string[]
  /** Pinned subset of actives. Drives zoom-aware fill emphasis. */
  pinnedFeatureIds: readonly string[]
  /** Features matching the currently-spotlighted tier (loi-highlight beat). */
  spotlightFeatureIds: readonly string[]
  /** True when spotlight mode is on, even if `spotlightFeatureIds` is
   *  empty (then all units dim). */
  hasSpotlight: boolean
}

// Actor discriminants

export type ActorKind =
  | "mapPaint"
  | "mapPopup"
  | "overlayPopup"
  | "narration"
  | "overlayMorph"

// Common actor fields

export interface ActorBase {
  /** Human-readable id for debugging (e.g. `"loi-highlight:mapPaint:layerFade"`). */
  id: string
  /** Half-open progress interval `[start, end)`. */
  window: readonly [number, number]
}

// mapPaint actors

/**
 * Instructs `MapPaintArbiter` to run one of a fixed set of paint
 * sequences over the actor's window. Each `payload` variant names one.
 */
export type MapPaintPayload =
  | {
      /**
       * Pre-Beat-1 reset. Fires once when `progress` snaps back to 0
       * (Restart, or Back from Beat 0). Restores DU layers to their start
       * state: full class filter, blue-cycle colors, opacity 0, basemap
       * dim overlay cleared.
       */
      kind: "reset"
    }
  | {
      /**
       * Blue cycle. Window `[RESET_END, FREEZE_AT)`. Fades the layers in
       * while cycling the blues, saving the final color step so the
       * following `blue-hold` freezes on it.
       *
       * `cycleRotations`: how many times the blues turn over the window.
       * `peakOpacity`: opacity the fade lands on (`0.65`).
       * `fadeInFrac`: fraction of window spent fading in.
       * `breathAmplitude` (~`0.05`): gentle breath after that.
       */
      kind: "blue-cycle"
      cycleStart: number
      cycleEnd: number
      cycleRotations: number
      peakOpacity: number
      fadeInFrac: number
      breathAmplitude: number
    }
  | {
      /**
       * Blue hold. Window `[FREEZE_AT, TIER_BLEND_START)`. Holds the
       * frozen blue palette at full filter and `peakOpacity`. Enter
       * re-applies the baseline from the saved `frozenColorPhase`. Each
       * update re-applies opacity to correct stray writes.
       */
      kind: "blue-hold"
      peakOpacity: number
    }
  | {
      /**
       * Tier-color blend. Window `[blendStart, blendEnd)`. Two stages:
       * `[blendStart, convergeEnd)` collapses the three blues toward
       * `BLUE_MID`, then `[convergeEnd, blendEnd)` blends `BLUE_MID` into
       * each AG unit's tier color. Class filter stays full so Urban and
       * Refuge keep painting (`tier-color-hold` switches to AG-only).
       * `peakOpacity` held throughout (usually 0.65).
       */
      kind: "tier-color-blend"
      blendStart: number
      convergeEnd: number
      blendEnd: number
      peakOpacity: number
    }
  | {
      /**
       * Tier-color hold. Window `[blendEnd, beat2Start)`. Static hold:
       * AG-only filter, fully blended tier colors, opacity at
       * `peakOpacity`. Written once on enter.
       */
      kind: "tier-color-hold"
      peakOpacity: number
    }
  | {
      /**
       * Polygon hide-schedule. Window `[BEAT2_START, LOI_ENTER)`. Fades
       * each outcome's polygons off the map as the SVG morph takes over.
       *
       * Enter re-applies the baseline (full filter, blended tier colors,
       * opacity preserved). Each update rebuilds a per-unit Mapbox `case`
       * expression from `ctx.getHideSchedule()`: a tracked unit holds at
       * `peakOpacity` until its `fadeStart`, then fades to 0 by its
       * `morphStart`. An Agriculture fallback covers AG_REV and untracked
       * AG units across `[agFadeOutStart, agFadeOutEnd)`. Everything else
       * is 0. Same expression drives fill and line opacity so outlines
       * fade with fills.
       */
      kind: "polygon-hide-schedule"
      agFadeOutStart: number
      agFadeOutEnd: number
      peakOpacity: number
    }
  | {
      kind: "loi-enter"
      /** LOI demand-unit id to gold-stroke during step 4 (`LOI_DU_ID`). */
      loiDuId: string
    }
  | {
      kind: "loi-layer-fade"
      /** Opacity ramp start (step 1 onset, e.g. `0.555`). */
      fadeInStart: number
      /** Opacity ramp end (step 1 finish, e.g. `0.575`). */
      fadeInEnd: number
      /** Hold start (`LOI_SETTLE` = `0.62`). */
      holdUntil: number
      /** Hold end and tail-fade start (`LOI_TAIL_END` = `0.63`). */
      tailEnd: number
      /** Peak opacity during the hold (`LOI_LAYER_OPACITY` = `0.65`). */
      peakOpacity: number
    }
  | {
      kind: "loi-gold-ring"
      loiDuId: string
      /** Color applied to the LOI outline (`HIGHLIGHT_GOLD`). */
      goldHex: string
    }
  | {
      kind: "loi-exit"
      /** Whether to clear the gold ring (true if step 4 was active). */
      clearRing: boolean
    }
  | {
      /** DU restore for the list-bar beat. Window `[LOI_TAIL_END, 1]`.
       * Enter takes the layers back from the loi-highlight actors: full
       * class filter, blended tier colors, default outline width, both
       * fill and line opacity pinned at 0. No update or exit. Scrubbing
       * back into loi-highlight is handled by its own enter. */
      kind: "du-clear-hold"
    }
  | {
      /** Per-line-layer fade-out for line-geometry outcomes. Window
       * `[0, 1]`. Each frame picks `ctx.getHideSchedule()` entries with
       * `geometryType === "line"` and sets `line-opacity`: full before
       * `fadeStart`, ramping to 0 between `fadeStart` and `morphStart`,
       * then 0 after. */
      kind: "line-hide-schedule"
    }

export interface MapPaintActor extends ActorBase {
  kind: "mapPaint"
  payload: MapPaintPayload
}

// mapPopup actors

/**
 * Shows one map popup (`LocationHighlight`) for its window. The arbiter
 * combines popups from all map-popup actors into one store update per
 * frame. `buildHighlight` is a function because the popup needs centroid
 * and tier data from the context, unknown when actor groups are written.
 * Returning `null` means data isn't ready, so retry next frame.
 */
export interface MapPopupActor extends ActorBase {
  kind: "mapPopup"
  buildHighlight: (ctx: BeatEngineContext) => LocationHighlight | null
}

// overlayPopup actors

/**
 * Drives the `demoLocation` and `demoHoveredLocation` React state that
 * `OutcomeMorphOverlay` reads. `target` picks the slot: `"ring"` sets
 * `demoLocation` (gold ring around the square), `"hover"` sets
 * `demoHoveredLocation` (square-side popup). `buildInfo` is a function
 * for the same reason as `buildHighlight`: it needs context data.
 */
export interface OverlayPopupActor extends ActorBase {
  kind: "overlayPopup"
  target: "ring" | "hover"
  buildInfo: (ctx: BeatEngineContext) => LocationInfo | null
}

// narration actors

/**
 * Bridges the engine to a per-frame callback registered by the
 * `useOutcomeLabelGeometry` hook (mounted by `BeatTextOverlay`). Each
 * `onUpdate`, `NarrationArbiter` calls the latest `ctx.narrationTickRef`
 * with the current `v`, letting the overlay keep its own curves and refs
 * while the engine stays the only progress subscriber.
 */
export interface NarrationActor extends ActorBase {
  kind: "narration"
}

// overlayMorph actors

/**
 * Bridges the engine to the per-frame SVG transform pipeline owned by
 * `OutcomeMorphOverlay`. Each `onUpdate`, `OverlayMorphArbiter` calls the
 * latest `ctx.overlayMorphTickRef` with the current `v`. Same bridge as
 * `NarrationActor`.
 */
export interface OverlayMorphActor extends ActorBase {
  kind: "overlayMorph"
}

// Actor union

export type Actor =
  | MapPaintActor
  | MapPopupActor
  | OverlayPopupActor
  | NarrationActor
  | OverlayMorphActor

export interface ActorGroup {
  /** Matches `TimingBeat.id` in `animationTiming.ts`. */
  id: TimingBeat["id"]
  /** Actors this beat owns. */
  actors: readonly Actor[]
}

// Engine context

/**
 * What the engine hands to arbiters and actor functions every frame.
 * Refs and read-only values, not React state, so dispatch stays
 * synchronous and ordered.
 */
export interface BeatEngineContext {
  /** Live Mapbox map ref (`mapRef` from `useMap()`). Nullable because the
   *  context may mount before Mapbox attaches its ref. Arbiters guard on
   *  `current?.getMap?.()`. */
  mapRef: RefObject<MapRef | null> | null
  /** `outcomeLocations["AG_REV"]`-style accessor for current tier data. */
  outcomeLocations: Record<
    string,
    {
      ids: Set<string>
      tierMap: Record<string, number>
      colorMap: Record<string, string>
      nameMap: Record<string, string>
    }
  >
  /** DU-id to centroid lookup (a copy of `centroidLookupRef`). */
  centroidLookup: Map<string, { lng: number; lat: number }>
  /** Setter for the `demoLocation` React state (gold ring on square). */
  setDemoLocation: (info: LocationInfo | null) => void
  /** Setter for the `demoHoveredLocation` React state (square popup). */
  setDemoHoveredLocation: (info: LocationInfo | null) => void
  /**
   * Builds a Mapbox `match` expression blending from `fromHex` toward
   * each unit's tier color by ratio `t`. On the context because it
   * depends on the component's current tier-color lookup.
   */
  buildBlendedTierExpr: (fromHex: string, t: number) => unknown[] | null
  /**
   * Display-name resolver. Tier data `nameMap`, then the static DU name
   * table, then the raw id.
   */
  resolveDuName: (duId: string) => string
  /** Tier-label resolver (1 becomes "Optimal", etc.). */
  resolveTierLabel: (tier: number) => string
  /**
   * Current hide schedule. The array is replaced when the schedule
   * rebuilds, so don't hold the reference across frames or mutate it.
   */
  getHideSchedule: () => readonly HideScheduleEntry[]
  /**
   * Bridge slot for `NarrationArbiter`. The `useOutcomeLabelGeometry`
   * hook (mounted by `BeatTextOverlay`) writes its per-frame callback
   * here on mount, clears on unmount. `null` means nothing is mounted.
   */
  narrationTickRef: RefObject<((v: number) => void) | null>
  /**
   * Bridge slot for `OverlayMorphArbiter`. `OutcomeMorphOverlay` writes
   * its per-frame SVG-transform callback here. Same as `narrationTickRef`.
   */
  overlayMorphTickRef: RefObject<((v: number) => void) | null>
  /**
   * Current engine mode. Arbiters that only act in a certain mode (like
   * `InteractivePaintArbiter` in `interactive`) check this.
   */
  getMode: () => EngineMode,

}

// Arbiter interface

/**
 * Two families of arbiter exist.
 *
 * Playback arbiters implement this interface and are dispatched from the
 * `progress` clock: `MapPaintArbiter`, `MapPopupArbiter`,
 * `OverlayPopupArbiter`, `NarrationArbiter`, `OverlayMorphArbiter`.
 *
 * Event-driven arbiters do not implement this interface and are not in
 * the dispatch list. Held in refs and called from effects or nav
 * handlers because their work is driven by React state or user events,
 * not `progress`: `CameraArbiter` (fly home) and the
 * `InteractiveLayerDirector`, which holds the two interactive drivers,
 * `InteractivePaintArbiter` (demand-units after settle) and
 * `PolygonLayerDriver` (other polygon outcomes). `getMode()` is an input
 * to those decisions.
 *
 * Each playback arbiter handles one `ActorKind`:
 * - `onEnter(actor, v, ctx)` once when `v` enters the window.
 * - `onUpdate(actor, v, ctx)` every frame inside, including the enter frame.
 * - `onExit(actor, v, ctx)` once when `v` leaves, or on unmount/nav if
 *   still active.
 *
 * Once per frame, after every actor has been dispatched, the engine calls
 * each arbiter's optional `commit(ctx)`. An arbiter that gathers up changes
 * during the frame (like `MapPopupArbiter`) makes its single write here.
 */
export interface Arbiter<A extends Actor = Actor> {
  readonly kind: A["kind"]
  onEnter?(actor: A, v: number, ctx: BeatEngineContext): void
  onUpdate?(actor: A, v: number, ctx: BeatEngineContext): void
  onExit?(actor: A, v: number, ctx: BeatEngineContext): void
  /** Optional end-of-frame hook, once per frame after all
   *  enter/update/exit calls. */
  commit?(ctx: BeatEngineContext): void
  /** Clear any state the arbiter still owns. Called on unmount and
   *  navigation. Must be safe to call more than once. */
  teardown?(ctx: BeatEngineContext): void
}
