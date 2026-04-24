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

/**
 * Per-outcome schedule entry describing when and where a set of Mapbox
 * features should hide as their SVG distribution-square morph takes
 * over the visual. One entry per `(outcomeCode, layer)` tuple.
 *
 * `code` is the outcome code the entry belongs to (`"AG_REV"`, `"DS"`,
 * ...). Used for provenance and debugging only.
 *
 * `geometryType` distinguishes the three rendering shapes the
 * storyboard uses. Only `"polygon"` entries with
 * `mapboxLayerId === "demand-units"` drive the Beat 2 fill-opacity
 * case expression. `"line"` entries drive a per-layer line-opacity
 * write in the main listener (not owned by the engine yet).
 * `"react-marker"` entries have no Mapbox layer to hide. They exist
 * so the overlay knows which DUs are tracked by the outcome.
 *
 * `mapboxLayerId` is the literal Mapbox layer id the entry fades.
 * Empty for `"react-marker"`.
 *
 * `idProperty` is the Mapbox feature property used to match
 * individual features (`"DU_ID"` for demand-units). Kept on the
 * entry so line layers with different id properties can coexist.
 *
 * `fadeStart` and `morphStart` are half-open progress interval
 * endpoints on the compressed `progress` domain. Opacity writes are
 * `1` before `fadeStart`, interpolate to `0` across the window, and
 * stay at `0` after `morphStart`.
 *
 * `locationIds` enumerates the individual feature ids (DU_IDs, line
 * ids) whose Mapbox paint this entry fades. Used as the literal
 * array in the Mapbox `["in", ["get", idProperty], ["literal",
 * locationIds]]` match clause.
 *
 * Populated by the outcome-schedule builder effect in
 * `TierAnimationSection.tsx` once tier data loads, and held on a
 * ref the engine reads via `ctx.getHideSchedule()`.
 */
export interface HideScheduleEntry {
  code: string
  geometryType: "polygon" | "line" | "react-marker"
  mapboxLayerId: string
  idProperty: string
  fadeStart: number
  morphStart: number
  locationIds: string[]
}

/**
 * Engine-level mode signal (Phase 3).
 *
 * Tracks which "regime" the storyboard is currently in, so each map
 * resource (most importantly `demand-units`) can be owned by exactly
 * one arbiter at a time without ad-hoc effect-based ownership checks.
 *
 * - `"idle"`: pre-play gate (before Play button) or post-Restart. No
 *   arbiter is actively writing `demand-units`; the layer is at its
 *   baseline (invisible / Beat 0 state).
 * - `"playback"`: storyboard beats 0..N are tweening. `MapPaintArbiter`
 *   owns `demand-units` and drives it via progress-keyed actors.
 * - `"interactive"`: storyboard has settled (reached the final beat's
 *   finished state) and the user can click squares. In Phase 3b,
 *   `InteractivePaintArbiter` takes ownership of `demand-units` in
 *   this mode; for Phase 3a the mode is signal-only and no arbiter
 *   keys on it yet.
 *
 * Phase 3a ships the signal (getMode/setMode on `BeatEngineApi`) with
 * no arbiter wiring, so it is observationally a no-op. Phase 3b/3c
 * then route the interactive-paint logic through it.
 */
export type EngineMode = "idle" | "playback" | "interactive"

/**
 * Snapshot of everything `InteractivePaintArbiter` needs to paint a
 * single demand-units outcome. Non-null iff TAS wants the arbiter to
 * own `demand-units` / `demand-units-outline` right now; null iff the
 * arbiter should exit (release paint back to the scalar-0 baseline).
 *
 * TAS computes the spec from the selected outcome's registry config +
 * the hydrated `outcomeLocations` tier data. The arbiter itself does
 * no React-side lookups -- it only touches Mapbox given the spec.
 *
 * `outcomeCode` is the identity used for crossfade detection: a
 * `sync(ctx, spec)` call with the same `outcomeCode` as `currentSpec`
 * is a no-op; a different `outcomeCode` triggers the crossfade path.
 *
 * `classFilter` scopes the demand-units layer to the outcome's DU
 * class (AG / Urban / Refuge). Combined with the `featureIds`-based
 * `in` filter so only the outcome's actual LOIs render.
 *
 * `colorExpression` is a Mapbox `match` expression keyed on `DU_ID`
 * (or the outcome's `idProperty`). Arbiter writes it to both fill and
 * outline so they stay color-aligned.
 */
export interface DemandUnitsPaintSpec {
  /** Outcome code (`"AG_REV"`, `"CWS_DEL"`). Identity for crossfade. */
  outcomeCode: string
  /** DU `Class` column filter value. Mirrors `OutcomeLayerConfig.classFilter`. */
  classFilter: "Agriculture" | "Urban" | "Refuge" | "N/A"
  /** Feature-id property column (`"DU_ID"` for all current DU outcomes). */
  idProperty: string
  /** Feature ids to include in the `["in", idProperty, ...]` filter. */
  featureIds: readonly string[]
  /** Mapbox `match` expression (or hex string fallback) for fill/line color. */
  colorExpression: unknown
}

/**
 * Snapshot of per-selection overlay state driving the gold outline +
 * spotlight / pinned fill-opacity overrides. Sent to
 * `InteractivePaintArbiter.applyOverlay` whenever the selection's
 * active / pinned / spotlight state changes.
 *
 * Held separately from `DemandUnitsPaintSpec` because it changes much
 * more frequently (hover, pin toggle, Beat 5 tier step) and can be
 * written as a pure overlay pass on top of the current base paint
 * without re-running the full enter / crossfade sequence.
 *
 * `hasSpotlight` is explicit because `spotlightFeatureIds` can legally
 * be empty (e.g. `spotlightedTier` set but no matching DUs for this
 * outcome). We still want the arbiter to treat that as a spotlight
 * mode (all DUs dimmed) rather than pinned/active mode.
 */
export interface DemandUnitsOverlayState {
  /** Sanity-check: which outcome this overlay is for. */
  outcomeCode: string
  /** Active (hovered or pinned) feature ids; gold outline + opacity 1. */
  activeFeatureIds: readonly string[]
  /** Pinned subset of actives; drives zoom-aware fill emphasis. */
  pinnedFeatureIds: readonly string[]
  /** Features matching the currently-spotlighted tier (Beat 5 demo). */
  spotlightFeatureIds: readonly string[]
  /** True iff spotlight mode is active; `spotlightFeatureIds` may be empty. */
  hasSpotlight: boolean
}

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
      /**
       * Pre-beat-1 reset. Fires once when the user scrubs or snaps
       * `progress` back to 0 (Restart button, or Back from Beat 0).
       * Restores the DU layers to their pre-animation baseline: the
       * full `DU_CLASS_FILTER`, the blue-cycle fill expression seeded
       * at phase 0, opacity 0 (Beat 1 will fade them in from 0), and
       * the `basemap-dim-overlay` fill-opacity cleared to 0.
       */
      kind: "reset"
    }
  | {
      /**
       * Beat 1 blue-cycle. Window `[RESET_END, FREEZE_AT)`. Per-tick
       * opacity ramp and rotating `beat1FillExpr(colorPhase)`. The
       * arbiter tracks `frozenColorPhase` on itself so the subsequent
       * `beat1-hold` actor can resume at the same color pattern the
       * cycle settled on.
       *
       * `cycleStart` and `cycleEnd` bound the window. `colorPhase =
       * ((v - cycleStart) / (cycleEnd - cycleStart)) * cycleRotations`
       * so that a single `cycleRotations` value controls how many
       * palette turns the blues make across the window.
       *
       * `peakOpacity` is what the ramp lands on (`0.65`). `fadeInFrac`
       * is the fraction of the window spent ramping in from 0.
       * `breathAmplitude` rides on top once the fade-in completes
       * (`0.05` in the legacy listener).
       */
      kind: "beat1-cycle"
      cycleStart: number
      cycleEnd: number
      cycleRotations: number
      peakOpacity: number
      fadeInFrac: number
      breathAmplitude: number
    }
  | {
      /**
       * Beat 1 hold. Window `[FREEZE_AT, BEAT1C_BLEND_START)`. Covers
       * both the "frozen" tail of the old `v < BEAT1B_START` branch
       * and the `BEAT1B_START <= v < BEAT1C_BLEND_START` hold, which
       * are visually identical (frozen palette, full filter, opacity
       * pinned at `peakOpacity`). The arbiter re-asserts the full
       * baseline on enter (using its stored `frozenColorPhase`) and
       * re-asserts opacity on each update tick so stray writers that
       * land on the layer during this window are self-healing.
       */
      kind: "beat1-hold"
      peakOpacity: number
    }
  | {
      /**
       * Beat 1C blend. Window `[blendStart, blendEnd)`. Two-stage
       * color morph from the frozen 3-blue palette to AG tier colors.
       *
       * `[blendStart, convergeEnd)` shrinks the 3-blue palette toward
       * `BEAT1_MID` (convergence ramps 0 to 1). Driven by
       * `beat1FillExpr(this.frozenColorPhase, convergence)` using the
       * arbiter's stored phase from Beat 1.
       *
       * `[convergeEnd, blendEnd)` morphs `BEAT1_MID` into each AG
       * DU's tier color. Driven by
       * `ctx.buildBlendedTierExpr(BEAT1_MID, t)` with `t` ramping 0
       * to 1.
       *
       * The DU class filter stays full across the whole window so
       * Urban and Refuge stay painted during the blend. The
       * subsequent `beat1c-tail` actor flips to AG-only.
       *
       * `peakOpacity` is the constant opacity held across the blend
       * (typically 0.65, matching the Beat 1 hold).
       */
      kind: "beat1c-blend"
      blendStart: number
      convergeEnd: number
      blendEnd: number
      peakOpacity: number
    }
  | {
      /**
       * Beat 1C tail. Window `[blendEnd, beat2Start)`. Static hold
       * on AG-only with fully blended tier colors. The arbiter
       * performs a full-state baseline assertion on `onEnter`
       * (`DU_AG_ONLY_FILTER`, `buildBlendedTierExpr(BEAT1_MID, 1)`,
       * `peakOpacity`) and no per-tick writes. Matches the legacy
       * listener's `phase !== "beat1c"` guard behavior.
       */
      kind: "beat1c-tail"
      peakOpacity: number
    }
  | {
      /**
       * Beat 2 hide-schedule. Window `[BEAT2_START, BEAT5_ENTER)`.
       * Drives the per-DU fade-out that escorts each outcome's
       * polygons off the map as the SVG distribution-square morph
       * takes over.
       *
       * `onEnter` re-asserts the full-state baseline (`DU_CLASS_FILTER`,
       * blended tier fill expression from
       * `ctx.buildBlendedTierExpr(BEAT1_MID, 1)`, line-width 0.5,
       * visibility visible) with `fillOpacity` and `lineOpacity`
       * preserved. The first `onUpdate` tick (same tick as enter)
       * overwrites opacity with the per-DU Mapbox `"case"` expression.
       *
       * `onUpdate` builds the case expression every tick from the
       * live hide schedule returned by `ctx.getHideSchedule()`. Each
       * polygon entry whose `mapboxLayerId` is `"demand-units"`
       * contributes a branch:
       *  - If `v < fadeStart`: hold at `peakOpacity`.
       *  - Else: interpolate `peakOpacity * (1 - t)` where
       *    `t = (v - fadeStart) / (morphStart - fadeStart)`, clamped.
       *
       * An Agriculture-class fallback branch covers AG_REV (which is
       * excluded from the schedule) and any untracked AG DUs. It
       * holds at `peakOpacity` before `agFadeOutStart`, ramps to 0
       * across `[agFadeOutStart, agFadeOutEnd)`, and stays at 0
       * after. The window straddles `BEAT2_START` so the fade
       * completes just as the SVG shapes start to deform, handing
       * the visual off cleanly to the morph overlay.
       *
       * The terminal `0` branch hides Urban, Refuge, and any other
       * DU that is neither tracked nor AG.
       *
       * The same case expression is written to both `fill-opacity`
       * and `line-opacity` so outlines fade in lockstep with fills.
       */
      kind: "beat2-hide-schedule"
      agFadeOutStart: number
      agFadeOutEnd: number
      peakOpacity: number
    }
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
  | {
      /** Beat 6+ DU restore. Window `[BEAT5_TAIL_END, 1]`. One-shot
       * `onEnter` performs a full `writeDemandUnitsBaseline` assertion
       * to take ownership back from the Beat 5 actor cluster. The
       * baseline restores the full DU class filter, the blended AG
       * tier color expression, the default outline line-width, and
       * pins both fill-opacity and line-opacity at scalar 0.
       *
       * The legacy listener accomplished the same end state via
       * `enterBeat2Phase()` (filter + colors + line-width) followed
       * by `paintDuHideSchedule()` (per-tick case expression that
       * evaluates to 0 for every DU at this point in the timeline).
       * We collapse both into a single one-shot scalar opacity write
       * because at v >= BEAT5_TAIL_END the case expression has no
       * remaining transitions to drive (every tracked DU is past its
       * morphStart and the AG-class fallback is past
       * `agFadeOutEnd`), so a scalar zero is observably equivalent
       * and avoids the per-tick Mapbox style cost.
       *
       * `onUpdate` and `onExit` are no-ops. Reverse scrubs back into
       * Beat 5 are handled by the Beat 5 cluster's own `onEnter`,
       * which performs its own full-state baseline assertion. */
      kind: "beat6-restore"
    }
  | {
      /** Per-line-layer fade-out for outcomes whose geometries are
       * lines rather than polygons. Window `[0, 1]`. The arbiter
       * iterates `ctx.getHideSchedule()` every tick, picks entries
       * with `geometryType === "line"`, and writes their
       * `line-opacity` per a three-state piecewise function:
       *   v < fadeStart                 -> opacity = 1
       *   fadeStart <= v <= morphStart  -> opacity = 1 - t
       *   v > morphStart                -> opacity = 0
       * Mirrors the legacy listener's trailing line-fade loop at
       * TierAnimationSection.tsx lines 2458 to 2481. The actor's
       * window is the full progress range so reverse scrubs (back
       * past a morphStart, then forward) re-establish the correct
       * opacity. There is no resource conflict with the polygon
       * arbiters because line layers (e.g. `cwf-flowline`,
       * `delta-detaw-line`) are disjoint from `demand-units` and
       * `demand-units-outline`. */
      kind: "beat-line-fades"
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

// narration actors

/**
 * A narration actor bridges the beat engine to a progress-driven
 * DOM-mutation callback owned by a React component (in practice:
 * `BeatTextOverlay`). The actor carries no payload. On each `onUpdate`
 * the `NarrationArbiter` reads the latest callback from
 * `ctx.narrationTickRef` and calls it with the current `v`.
 *
 * Rationale. The component's narration logic is ~320 lines of
 * per-beat opacity curves over component-local refs (`beat1Ref`,
 * `beat2IntroRef`, ...). Mechanically lifting that into the
 * declarative actor format is a large, risky rewrite with no
 * observable benefit beyond satisfying invariant 4 (only one
 * `progress.on("change")` subscriber). The bridge pattern gives us
 * invariant 4 while letting the component retain ownership of its
 * refs, timing constants, and closures.
 */
export interface NarrationActor extends ActorBase {
  kind: "narration"
}

// overlayMorph actors

/**
 * An overlay-morph actor bridges the beat engine to the per-frame
 * SVG transform pipeline owned by `OutcomeMorphOverlay`. Carries no
 * payload. On each `onUpdate` the `OverlayMorphArbiter` reads the
 * latest callback from `ctx.overlayMorphTickRef` and calls it with
 * the current `v`.
 *
 * Rationale. Same as `NarrationActor`: the component owns ~200
 * lines of path/transform/opacity writes over nested ref maps and
 * precomputed shape caches. Lifting that into a declarative actor
 * payload is a large rewrite with no observable benefit beyond
 * invariant 4. The bridge pattern gives us invariant 4 while letting
 * the component keep its refs, constants, and RAF coordination.
 */
export interface OverlayMorphActor extends ActorBase {
  kind: "overlayMorph"
}

// Placeholder actor kinds (filled in by later phases)

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
  /**
   * Live accessor for the per-outcome hide schedule. Returns the
   * current contents of the component-local `hideScheduleRef` so
   * arbiters read the latest entries without depending on React
   * state or re-memoizing `ctx` on every schedule rebuild.
   *
   * The returned array's entries are mutated/replaced when the
   * schedule rebuilds. Arbiters must not retain the reference across
   * ticks and must not mutate the array.
   */
  getHideSchedule: () => readonly HideScheduleEntry[]
  /**
   * Bridge slot for `NarrationArbiter`. `BeatTextOverlay` writes its
   * per-frame DOM-mutation callback into `.current` on mount and
   * clears it on unmount. The arbiter reads through the ref on every
   * `onUpdate` so the component can rebuild its closure on each
   * render without forcing re-subscription. `null` means no narration
   * component is mounted; the arbiter silently no-ops in that case.
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
   * Read the current engine mode. Arbiters that want to scope their
   * work to a particular mode (e.g. `InteractivePaintArbiter` only
   * writing `demand-units` while mode === "interactive") call this
   * from their lifecycle hooks. Lives on the context rather than as a
   * separate arg so all arbiters receive it uniformly.
   *
   * Phase 3a: unused by all current arbiters. Added here so Phase 3b
   * can consume it without another context shape change.
   */
  getMode: () => EngineMode
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
