/* Beat engine type definitions
 *
 * Actors are plain data.
 * Everything an actor needs to do its job is either in its payload or
 * reachable from the `BeatEngineContext` passed in at dispatch time.
 *
 * An actor's `window` is a half-open progress interval `[start, end)`.
 * The engine calls `enter` once when `v` first enters the window,
 * `update` every frame while inside (including the enter frame), and
 * `exit` once when `v` leaves. Arbiters tolerate repeated
 * `update` calls.
 *
 * Every actor declares which arbiter owns it via its `kind`.
 * The engine routes dispatches to the right arbiter. An actor never
 * reaches into another arbiter's state.
 */

import type { RefObject } from "react"
import type { TimingBeat } from "../animationTiming"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import type { LocationHighlight } from "../../../map/store"
import type { MapRef } from "@repo/map"

/**
 * Tells the engine when and where to fade out a set of Mapbox features
 * as their SVG distribution-square morph takes over. One entry per
 * (outcome, layer).
 */
export interface HideScheduleEntry {
  /** Outcome this entry belongs to (`"AG_REV"`, `"DS"`). For debugging. */
  code: string
  /** Which shape the feature is. Only `"polygon"` entries on the
   *  `demand-units` layer drive the Beat 2 fill fade. `"line"` entries
   *  fade a line layer. `"react-marker"` entries have no Mapbox layer
   *  and just mark which units the outcome tracks. */
  geometryType: "polygon" | "line" | "react-marker"
  /** The Mapbox layer id to fade. Empty for `"react-marker"`. */
  mapboxLayerId: string
  /** Feature property used to match features (`"DU_ID"` for demand-units). */
  idProperty: string
  /** Opacity is 1 before `fadeStart`, fades to 0 across the window, and
   *  stays 0 after `morphStart`. */
  fadeStart: number
  morphStart: number
  /** The feature ids this entry fades. */
  locationIds: string[]
}

/**
 * Engine-level mode signal
 *
 * Tracks which stage the storyboard is in so each map resource (above
 * all `demand-units`) is owned by exactly one arbiter at a time.
 *
 * `demand-units` matters most because more than one arbiter paints it.
 * `MapPaintArbiter` owns it during playback and `InteractivePaintArbiter`
 * owns it while interactive. If both wrote at once, or one handed off
 * without setting every property, a stale color or opacity from the
 * previous owner would leak through. The mode keeps that ownership
 * clear.
 *
 * - `"idle"`: pre-play gate (before Play) or post-Restart. No arbiter
 *   writes `demand-units`. The layer is at its baseline (Beat 0 state).
 * - `"playback"`: storyboard beats are tweening. `MapPaintArbiter` owns
 *   `demand-units` and drives it via progress-keyed actors.
 * - `"interactive"`: storyboard has settled and the user can click
 *   squares. `InteractivePaintArbiter` owns `demand-units` in this mode.
 */
export type EngineMode = "idle" | "playback" | "interactive"

/**
 * Everything `InteractivePaintArbiter` needs to paint one demand-units'
 * outcome. `TierAnimationSection` builds it from the selected outcome's
 * config and the loaded tier data. Then pass it to `sync` to paint, or pass
 * null to release the layers.
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
 * The per-selection overlay on top of the base paint: gold outline plus
 * spotlight / pinned fill-opacity. Sent to
 * `InteractivePaintArbiter.applyOverlay` whenever the selection's
 * active, pinned, or spotlight state changes.
 *
 * Kept separate from `DemandUnitsPaintSpec` because it changes far more
 * often (hover, pin, tier step) and can be applied on top of the
 * current paint without re-running the full enter or crossfade.
 */
export interface DemandUnitsOverlayState {
  /** Which outcome this overlay is for */
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
 * A map-paint actor instructs the `MapPaintArbiter` to run one of a
 * fixed set of paint sequences over the actor's window. Each `payload`
 * variant names one paint sequence.
 */
export type MapPaintPayload =
  | {
      /**
       * Pre-Beat-1 reset. Fires once when `progress` snaps back to 0
       * (Restart, or Back from Beat 0). Puts the DU layers back to
       * their starting state: full class filter, blue-cycle colors,
       * opacity 0, and the basemap dim overlay cleared.
       */
      kind: "reset"
    }
  | {
      /**
       * Blue cycle. Window `[RESET_END, FREEZE_AT)`. Fades the
       * layers in while cycling through the blues. The arbiter saves
       * the final color step so the following `blue-hold` can freeze
       * on it.
       *
       * `cycleRotations` sets how many times the blues turn over the
       * window. `peakOpacity` is the opacity the fade lands on (`0.65`).
       * `fadeInFrac` is how much of the window is spent fading in.
       * `breathAmplitude` (~`0.05`) is a gentle breath after that.
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
       * Blue hold. Window `[FREEZE_AT, TIER_BLEND_START)`. Holds
       * the frozen blue palette at full filter and `peakOpacity`. On
       * enter it re-applies the baseline from the saved
       * `frozenColorPhase`. Each update re-applies opacity so a stray
       * write gets corrected.
       */
      kind: "blue-hold"
      peakOpacity: number
    }
  | {
      /**
       * Tier-color blend. Window `[blendStart, blendEnd)`. Morphs color in
       * two stages. First, `[blendStart, convergeEnd)` collapses the
       * three blues toward `BLUE_MID`. Then `[convergeEnd, blendEnd)`
       * blends `BLUE_MID` into each AG unit's tier color.
       *
       * The class filter stays full so Urban and Refuge keep painting.
       * `tier-color-hold` is what switches to AG-only. `peakOpacity` is the
       * opacity held throughout (usually 0.65, same as the hold).
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
       * `peakOpacity`. Written once on enter, nothing per frame.
       */
      kind: "tier-color-hold"
      peakOpacity: number
    }
  | {
      /**
       * Polygon hide-schedule. Window `[BEAT2_START, LOI_ENTER)`.
       * Fades each outcome's polygons off the map as the SVG
       * distribution-square morph takes over.
       *
       * On enter it re-applies the baseline (full filter, blended tier
       * colors, opacity preserved). Each update rebuilds a per-unit
       * Mapbox `case` expression from `ctx.getHideSchedule()`. A tracked
       * unit holds at `peakOpacity` until its `fadeStart`, then fades to
       * 0 by its `morphStart`. An Agriculture fallback covers AG_REV and
       * untracked AG units, fading across `[agFadeOutStart, agFadeOutEnd)`.
       * Everything else is 0. The same expression goes to both fill and
       * line opacity so outlines fade with fills.
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
       * Runs once on enter to take the layers back from the
       * loi-highlight actors: full class filter, blended tier colors,
       * default outline width, and both fill and line opacity pinned
       * at 0.
       *
       * No update or exit work. Scrubbing back into loi-highlight is
       * handled by the loi-highlight actors' own enter. */
      kind: "du-clear-hold"
    }
  | {
      /** Per-line-layer fade-out for outcomes whose geometries are
       * lines rather than polygons. Window `[0, 1]`. Every frame the
       * arbiter picks `ctx.getHideSchedule()` entries with
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
 * Shows one map popup (`LocationHighlight`) for the length of its
 * window. The arbiter combines popups from all map-popup actors into
 * one store update per frame.
 *
 * `buildHighlight` is a function because the popup needs
 * centroid and tier data from the engine context that isn't known when
 * the actor groups are written. Returning `null` means the data isn't
 * ready, so skip this frame and try again next frame.
 */
export interface MapPopupActor extends ActorBase {
  kind: "mapPopup"
  buildHighlight: (ctx: BeatEngineContext) => LocationHighlight | null
}

// overlayPopup actors

/**
 * An overlay-popup actor drives the `demoLocation` and
 * `demoHoveredLocation` React state that `OutcomeMorphOverlay` reads
 * via its `demoHighlightedLocationKey` and `hoveredLocation` props.
 *
 * `target` picks which state slot the actor writes.
 *
 * `"ring"` sets `demoLocation` (gold ring around the square).
 * `"hover"` sets `demoHoveredLocation` (square-side popup).
 *
 * `buildInfo` is a function for the same reason as `buildHighlight`...
 * it needs engine-context data.
 */
export interface OverlayPopupActor extends ActorBase {
  kind: "overlayPopup"
  target: "ring" | "hover"
  buildInfo: (ctx: BeatEngineContext) => LocationInfo | null
}

// narration actors

/**
 * Bridges the engine to a per-frame callback registered by the
 * `useOutcomeLabelGeometry` hook, which `BeatTextOverlay` mounts. No
 * payload. Each `onUpdate`, the `NarrationArbiter` calls the latest
 * callback from `ctx.narrationTickRef` with the current `v`.
 *
 * This lets the overlay keep its own opacity curves and refs while the
 * engine stays the only progress subscriber.
 */
export interface NarrationActor extends ActorBase {
  kind: "narration"
}

// overlayMorph actors

/**
 * Bridges the engine to the per-frame SVG transform pipeline owned by
 * `OutcomeMorphOverlay`. No payload. Each `onUpdate`, the
 * `OverlayMorphArbiter` calls the latest callback from
 * `ctx.overlayMorphTickRef` with the current `v`.
 *
 * Same bridge as `NarrationActor`. The component keeps its pipeline and
 * refs while the engine stays the only progress subscriber.
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
 * What the engine hands to arbiters and actor functions on every
 * frame. It's refs and read-only values, not React state, so dispatch
 * stays synchronous and in order.
 */
export interface BeatEngineContext {
  /** Live Mapbox map ref (the `mapRef` yielded by `useMap()`).
   *  Nullable because the context may mount before Mapbox finishes
   *  attaching its ref. Arbiters guard on `current?.getMap?.()`. */
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
   * each unit's tier color by ratio `t`. Lives on the context because
   * it depends on the component's current tier-color lookup.
   */
  buildBlendedTierExpr: (fromHex: string, t: number) => unknown[] | null
  /**
   * Display-name resolver. Reads tier data's `nameMap`, falling back to
   * the static DU name table, falling back to the raw id.
   */
  resolveDuName: (duId: string) => string
  /** Tier-label resolver (1 becomes "Optimal", etc.). */
  resolveTierLabel: (tier: number) => string
  /**
   * Returns the current hide schedule so arbiters always read the
   * latest entries. The array is replaced when the schedule rebuilds,
   * so don't hold the reference across frames or mutate it.
   */
  getHideSchedule: () => readonly HideScheduleEntry[]
  /**
   * Bridge slot for `NarrationArbiter`. The `useOutcomeLabelGeometry`
   * hook that `BeatTextOverlay` mounts writes its per-frame callback
   * here on mount and clears it on unmount. `null` means nothing is
   * mounted, and the arbiter does nothing.
   */
  narrationTickRef: RefObject<((v: number) => void) | null>
  /**
   * Bridge slot for `OverlayMorphArbiter`. `OutcomeMorphOverlay`
   * writes its per-frame SVG-transform callback into `.current` on
   * mount and clears it on unmount. Same semantics as
   * `narrationTickRef`.
   */
  overlayMorphTickRef: RefObject<((v: number) => void) | null>
  /**
   * Read the current engine mode. Arbiters that only act in a certain
   * mode (like `InteractivePaintArbiter` in `interactive`) check this
   * in their hooks.
   */
  getMode: () => EngineMode
}

// Arbiter interface

/**
 * Each arbiter handles one `ActorKind`. The engine calls its hooks:
 *
 * - `onEnter(actor, v, ctx)` once when `v` first enters the actor's
 *   window.
 * - `onUpdate(actor, v, ctx)` every frame while inside, starting with
 *   the enter frame.
 * - `onExit(actor, v, ctx)` once when `v` leaves the window, or on
 *   unmount/navigation if still active.
 *
 * An arbiter can also do an end-of-frame `commit(ctx)`, called once per
 * frame after all actors are dispatched. That's where batching arbiters
 * (like `MapPopupArbiter`) write.
 */
export interface Arbiter<A extends Actor = Actor> {
  readonly kind: A["kind"]
  onEnter?(actor: A, v: number, ctx: BeatEngineContext): void
  onUpdate?(actor: A, v: number, ctx: BeatEngineContext): void
  onExit?(actor: A, v: number, ctx: BeatEngineContext): void
  /**
   * Optional end-of-frame hook. Called once per frame after all
   * enter/update/exit calls.
   */
  commit?(ctx: BeatEngineContext): void
  /**
   * Clear any state the arbiter still owns. Called on unmount and
   * navigation. Must be safe to call more than once.
   */
  teardown?(ctx: BeatEngineContext): void
}
