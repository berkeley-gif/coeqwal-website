/* Beat engine type definitions.
 *
 * Spike scope (Phase 0): defines the actor shapes needed to port Beat 4
 * (loi-highlight) end to end. The union intentionally enumerates only
 * the actor kinds Beat 4 uses. Phases 1 and 2 extend it for the
 * remaining beats.
 *
 * Design invariants.
 *
 * Actors are plain data. No closures, no React refs, no module state.
 * Everything an actor needs to do its job is either in its payload or
 * reachable from the `BeatEngineContext` passed in at dispatch time.
 *
 * An actor's `window` is a half-open progress interval `[start, end)`.
 * The engine calls `enter` exactly once the first tick `v` falls inside
 * the window, `update` on every tick while inside (including the entry
 * tick), and `exit` exactly once the first tick `v` falls outside after
 * having been inside. Arbiters must be idempotent under duplicate
 * update calls. The engine does not try to avoid them beyond the
 * enter/exit edge detection.
 *
 * Every actor declares which arbiter owns it via its `kind` discriminant.
 * The engine routes dispatches to the right arbiter. An actor never
 * reaches into another arbiter's state.
 */

import type { RefObject } from "react"
import type { BeatDef } from "../animationTiming"
import type { LocationInfo } from "../OutcomeMorphOverlay"
import type { LocationHighlight } from "../../../map/store"
import type { MapRef } from "@repo/map"

// Actor discriminants

export type ActorKind =
  | "mapPaint"
  | "mapPopup"
  | "overlayPopup"
  | "narration"
  | "overlayMorph"
  | "camera"

// Common actor fields

export interface ActorBase {
  /** Human-readable id for debugging (e.g. `"beat4:s1:layer-fade-in"`). */
  id: string
  /** Half-open progress interval `[start, end)`. */
  window: readonly [number, number]
}

// mapPaint actors

/**
 * A map-paint actor instructs the `MapPaintArbiter` to run one of a
 * fixed set of paint sequences over the actor's window. Each `payload`
 * variant corresponds to a paint sequence currently inlined in the main
 * choreography listener. Lifting them to named payloads lets the spike
 * reproduce Beat 4's behavior exactly while making future beats
 * additive.
 */
export type MapPaintPayload =
  | {
      kind: "beat5-enter"
      /** LOI demand-unit id to gold-stroke during step 4 (`BEAT5_LOI_ID`). */
      loiDuId: string
    }
  | {
      kind: "beat5-layer-fade"
      /** Opacity ramp start (step 1 onset, e.g. `0.555`). */
      fadeInStart: number
      /** Opacity ramp end (step 1 finish, e.g. `0.575`). */
      fadeInEnd: number
      /** Hold start (`BEAT5_SETTLE` = `0.62`). */
      holdUntil: number
      /** Hold end and tail-fade start (`BEAT5_TAIL_END` = `0.63`). */
      tailEnd: number
      /** Peak opacity during the hold (`BEAT5_LAYER_OPACITY` = `0.65`). */
      peakOpacity: number
    }
  | {
      kind: "beat5-poly-ring"
      loiDuId: string
      /** Color applied to the LOI outline (`HIGHLIGHT_GOLD`). */
      goldHex: string
    }
  | {
      kind: "beat5-exit"
      /** Whether to clear the gold ring (true if step 4 was active). */
      clearRing: boolean
    }

export interface MapPaintActor extends ActorBase {
  kind: "mapPaint"
  payload: MapPaintPayload
}

// mapPopup actors

/**
 * A map-popup actor pins a single `LocationHighlight` for the duration
 * of its window. The arbiter batches active highlights from all
 * map-popup actors into one `setLocationHighlights` call per frame.
 *
 * `buildHighlight` is a thunk rather than a value because the highlight
 * needs per-location centroid and tier data that comes from the engine
 * context, and the beat table is authored without knowing those values.
 * Returning `null` means "data not ready yet, skip this tick". The
 * arbiter will try again next tick.
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
 * `buildInfo` is a thunk for the same reason `buildHighlight` is on
 * `MapPopupActor`. It needs engine-context data.
 */
export interface OverlayPopupActor extends ActorBase {
  kind: "overlayPopup"
  target: "ring" | "hover"
  buildInfo: (ctx: BeatEngineContext) => LocationInfo | null
}

// Placeholder actor kinds (filled in by Phases 1 and 2)

export interface NarrationActor extends ActorBase {
  kind: "narration"
  /** Phases 2+. Stubbed shape so the `Actor` union is complete. */
  placeholder?: unknown
}

export interface OverlayMorphActor extends ActorBase {
  kind: "overlayMorph"
  /** Phases 2+. Stubbed shape so the `Actor` union is complete. */
  placeholder?: unknown
}

export interface CameraActor extends ActorBase {
  kind: "camera"
  /** Phases 2+. Stubbed shape so the `Actor` union is complete. */
  placeholder?: unknown
}

// Actor union

export type Actor =
  | MapPaintActor
  | MapPopupActor
  | OverlayPopupActor
  | NarrationActor
  | OverlayMorphActor
  | CameraActor

// Beat-table row

export interface BeatTableEntry {
  /** Matches `BeatDef.id` in `animationTiming.ts`. */
  id: BeatDef["id"]
  /** Actors this beat owns. Phase 0: only Beat 4's entry is populated. */
  actors: readonly Actor[]
}

// Engine context

/**
 * Data the engine passes to arbiters and actor thunks on every
 * dispatch. Intentionally a snapshot of refs and hot read-only values
 * rather than React state, so dispatch remains synchronous and
 * side-effect-ordered.
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
  /** DU-id to centroid lookup (the `centroidLookupRef` mirror). */
  centroidLookup: Map<string, { lng: number; lat: number }>
  /** Setter for the `demoLocation` React state (gold ring on square). */
  setDemoLocation: (info: LocationInfo | null) => void
  /** Setter for the `demoHoveredLocation` React state (square popup). */
  setDemoHoveredLocation: (info: LocationInfo | null) => void
  /**
   * Build a Mapbox `match` expression blending from `fromHex` toward
   * each DU's tier color at ratio `t`. Passed in because the expression
   * depends on the current `tierColorLookupRef` snapshot, which is set
   * up inside the component.
   */
  buildBlendedTierExpr: (fromHex: string, t: number) => unknown[] | null
  /**
   * Display-name resolver. Reads tier data's `nameMap`, falling back to
   * the static DU name table, falling back to the raw id.
   */
  resolveDuName: (duId: string) => string
  /** Tier-label resolver (1 becomes "Optimal", etc.). */
  resolveTierLabel: (tier: number) => string
}

// Arbiter interface

/**
 * Each arbiter handles one `ActorKind`. The engine calls.
 *
 * `onEnter(actor, v, ctx)` once per actor on the first tick `v` enters
 *   that actor's window.
 *
 * `onUpdate(actor, v, ctx)` on every tick while `v` is inside, starting
 *   with the same tick as `onEnter`.
 *
 * `onExit(actor, v, ctx)` once per actor on the first tick `v` leaves
 *   the window after having been inside, or on component unmount or
 *   navigation if the actor was still active.
 *
 * Arbiters may also participate in a per-frame `commit(ctx)` phase,
 * called once per tick after every actor has been dispatched. That is
 * where arbiters that batch per-frame writes (e.g. `MapPopupArbiter`
 * collecting highlights from multiple actors into one
 * `setLocationHighlights` call) do their work.
 */
export interface Arbiter<A extends Actor = Actor> {
  readonly kind: A["kind"]
  onEnter?(actor: A, v: number, ctx: BeatEngineContext): void
  onUpdate?(actor: A, v: number, ctx: BeatEngineContext): void
  onExit?(actor: A, v: number, ctx: BeatEngineContext): void
  /**
   * End-of-frame batch hook. Optional. Called exactly once per tick,
   * after all `onEnter`, `onUpdate`, and `onExit` calls for that tick
   * have resolved.
   */
  commit?(ctx: BeatEngineContext): void
  /**
   * Tear down any state the arbiter still owns. Called on component
   * unmount and from `clearInteractiveState`. Must be idempotent.
   */
  teardown?(ctx: BeatEngineContext): void
}
