/* Beat table (Phase 0 spike, Beat 4 only).
 *
 * The ground truth for what happens in each beat. Phase 0 ships Beat 4
 * fully. Every other beat has an empty `actors` array and its
 * choreography continues to live in the legacy per-effect code paths.
 * Phase 1 fills in map-paint actors for beats 0 to 3 and 5 to 7.
 * Phase 2 fills in narration, map popups, overlay popups, and camera
 * actors.
 *
 * Beat 4 comment map (progress domain, compressed).
 *
 *   BEAT5_ENTER               0.500  main-choreography filter swap
 *   BEAT5_S1_LAYER_IN_START   0.500  AG layer begins fading in
 *   BEAT5_S1_LAYER_IN_END     0.520  AG layer at full opacity
 *   BEAT5_S2_SQUARE_RING_AT   0.580  gold ring on distribution square
 *   BEAT5_S3_SQUARE_POPUP_AT  0.590  overlay popup near square
 *   BEAT5_S4_POLYGON_RING_AT  0.600  gold stroke on map polygon
 *   BEAT5_S5_POLYGON_POPUP_AT 0.605  map popup near polygon
 *   BEAT5_SETTLE              0.620  beat settles, demo clears
 *   BEAT5_TAIL_END            0.630  AG layer faded back out
 *
 * These thresholds match the const declarations at
 * `TierAnimationSection.tsx` lines 233 to 244 exactly.
 */

import type { BeatTableEntry } from "./types"
import { getDemandUnitDisplayName } from "../../../../map/config/demandUnitNames"
import { getTierLabel } from "../../../../../content/tiers"

// Beat 4 thresholds. Kept here rather than imported from
// `TierAnimationSection.tsx` so the engine package has no upward
// dependency on the component. Must stay in sync with those
// declarations (there is a check in the spec doc's H3).
const BEAT5_ENTER = 0.5
const BEAT5_S1_LAYER_IN_START = 0.5
const BEAT5_S1_LAYER_IN_END = 0.52
const BEAT5_S2_SQUARE_RING_AT = 0.58
const BEAT5_S3_SQUARE_POPUP_AT = 0.59
const BEAT5_S4_POLYGON_RING_AT = 0.6
const BEAT5_S5_POLYGON_POPUP_AT = 0.605
const BEAT5_SETTLE = 0.62
const BEAT5_TAIL_END = 0.63
const BEAT5_LAYER_OPACITY = 0.65

const BEAT5_LOI_ID = "08N_SA2"
const HIGHLIGHT_GOLD = "#ffd87e"

// Beat 4 (loi-highlight) actors

const LOI_CODE = "AG_REV"

/** Resolve the `info`, `coord`, `name`, and `tierColor` for
 *  `BEAT5_LOI_ID`. Returns null if data is not ready yet. The engine
 *  will retry next tick. */
function resolveBeat5LoiData(ctx: {
  outcomeLocations: Record<
    string,
    {
      ids: Set<string>
      tierMap: Record<string, number>
      colorMap: Record<string, string>
      nameMap: Record<string, string>
    }
  >
  centroidLookup: Map<string, { lng: number; lat: number }>
}): {
  info: { code: string; sourceId: string; tier: number }
  coord: { lng: number; lat: number } | null
  tierColor: string
  name: string
} | null {
  const agData = ctx.outcomeLocations[LOI_CODE]
  if (!agData || agData.ids.size === 0) return null
  const tier = agData.tierMap[BEAT5_LOI_ID]
  if (tier == null) return null
  const coord = ctx.centroidLookup.get(BEAT5_LOI_ID) ?? null
  const tierColor = agData.colorMap[BEAT5_LOI_ID] ?? "#888888"
  const name =
    agData.nameMap[BEAT5_LOI_ID] ??
    getDemandUnitDisplayName(BEAT5_LOI_ID) ??
    BEAT5_LOI_ID
  return {
    info: { code: LOI_CODE, sourceId: BEAT5_LOI_ID, tier },
    coord,
    tierColor,
    name,
  }
}

const BEAT4_ENTRY: BeatTableEntry = {
  id: "loi-highlight",
  actors: [
    // Map paint. One-shot filter swap at window entry.
    {
      kind: "mapPaint",
      id: "beat4:mapPaint:enter",
      // One-shot `onEnter` at `BEAT5_ENTER`. The window is minimally
      // wider than the following layer-fade so the enter hook strictly
      // precedes the first opacity write.
      window: [BEAT5_ENTER, BEAT5_TAIL_END],
      payload: { kind: "beat5-enter", loiDuId: BEAT5_LOI_ID },
    },
    // Map paint. Per-tick opacity ramp for the AG demand-unit layer.
    {
      kind: "mapPaint",
      id: "beat4:mapPaint:layerFade",
      window: [BEAT5_ENTER, BEAT5_TAIL_END],
      payload: {
        kind: "beat5-layer-fade",
        fadeInStart: BEAT5_S1_LAYER_IN_START,
        fadeInEnd: BEAT5_S1_LAYER_IN_END,
        holdUntil: BEAT5_SETTLE,
        tailEnd: BEAT5_TAIL_END,
        peakOpacity: BEAT5_LAYER_OPACITY,
      },
    },
    // Overlay popup. Gold ring on the distribution square at step 2.
    {
      kind: "overlayPopup",
      id: "beat4:overlayPopup:ring",
      window: [BEAT5_S2_SQUARE_RING_AT, BEAT5_SETTLE],
      target: "ring",
      buildInfo: (ctx) => resolveBeat5LoiData(ctx)?.info ?? null,
    },
    // Overlay popup. Square-side popup at step 3.
    {
      kind: "overlayPopup",
      id: "beat4:overlayPopup:hover",
      window: [BEAT5_S3_SQUARE_POPUP_AT, BEAT5_SETTLE],
      target: "hover",
      buildInfo: (ctx) => resolveBeat5LoiData(ctx)?.info ?? null,
    },
    // Map paint. Gold stroke on the LOI polygon at step 4.
    {
      kind: "mapPaint",
      id: "beat4:mapPaint:polyRing",
      window: [BEAT5_S4_POLYGON_RING_AT, BEAT5_SETTLE],
      payload: {
        kind: "beat5-poly-ring",
        loiDuId: BEAT5_LOI_ID,
        goldHex: HIGHLIGHT_GOLD,
      },
    },
    // Map popup. `LocationHighlight` anchored to the LOI polygon at
    // step 5.
    {
      kind: "mapPopup",
      id: "beat4:mapPopup:loi",
      // Runs through `BEAT5_TAIL_END` (not just `BEAT5_SETTLE`) so the
      // popup stays readable during the ~0.01-wide tail. Matches the
      // old Beat 5 driver's `wantPopup` window at lines 2646 and 2647.
      window: [BEAT5_S5_POLYGON_POPUP_AT, BEAT5_TAIL_END],
      buildHighlight: (ctx) => {
        const data = resolveBeat5LoiData(ctx)
        if (!data || !data.coord) return null
        return {
          key: `beat5:${data.info.code}:${data.info.sourceId}`,
          longitude: data.coord.lng,
          latitude: data.coord.lat,
          name: data.name,
          tierLevel: data.info.tier,
          tierLabel: getTierLabel(data.info.tier),
          tierColor: data.tierColor,
          pinned: true,
        }
      },
    },
    // Map paint. One-shot exit restores the base tier expression. Owns
    // only the gold-ring cleanup. The full beat2-phase restore is left
    // to the main-choreography listener on the first tick after the
    // window closes.
    //
    // The exit actor's window is
    // `[BEAT5_TAIL_END - epsilon, BEAT5_TAIL_END)` so its `onEnter`
    // fires on the last tick of Beat 5 rather than the first tick of
    // Beat 6 (avoiding a race with the main listener's
    // `phase !== "beat2"` branch, which also runs that tick).
    {
      kind: "mapPaint",
      id: "beat4:mapPaint:exit",
      window: [BEAT5_TAIL_END - 0.0005, BEAT5_TAIL_END],
      payload: { kind: "beat5-exit", clearRing: true },
    },
  ],
}

// Beat 0 (legend) and Beat 1 (collapse-and-colors) actors

// Reset window. Half-open `[0, RESET_END)`. Mirrors the
// main-choreography listener's `v < 0.01` branch at
// TierAnimationSection.tsx line 2166. The arbiter's `onEnter` hook
// does a full-state baseline assertion on `demand-units` and
// `demand-units-outline`. `onExit` is unused. Hosted under the
// "legend" beat (the first beat, whose window starts at 0) because
// actor windows are independent of beat checkpoints. Beats are just
// a grouping key for the table.
const RESET_END = 0.01

// Beat 1 thresholds. Mirror the inline `FREEZE_AT`, `BEAT1B_START`,
// `BEAT1C_BLEND_START`, `BEAT1C_BLEND_END`, and `BEAT2_START`
// declarations at TierAnimationSection.tsx lines 2145 to 2158.
// Must stay in sync.
const FREEZE_AT = 0.09
const BEAT1C_BLEND_START = 0.26
// Sub-window divider inside Beat 1C blend. `[BEAT1C_BLEND_START,
// BEAT1C_CONVERGE_END)` shrinks the 3-blue palette to BEAT1_MID.
// `[BEAT1C_CONVERGE_END, BEAT1C_BLEND_END)` blends BEAT1_MID to AG
// tier colors. Matches the inline `CONVERGE_END = 0.27` at
// TierAnimationSection.tsx line 2243.
const BEAT1C_CONVERGE_END = 0.27
const BEAT1C_BLEND_END = 0.28
const BEAT2_START = 0.38

// Beat 2 hide-schedule thresholds. Mirror the inline
// `BEAT2_AG_FADE_OUT_START`, `BEAT2_AG_FADE_OUT_END` declarations at
// TierAnimationSection.tsx lines 2330 and 2331. The AG fade-out
// window straddles `BEAT2_START` so the map layer finishes fading
// out just as the SVG distribution-square morph begins its shape
// deformation. `BEAT5_ENTER` is declared above at line 34 (mirror of
// the module-level constant at TierAnimationSection.tsx line 261).
const BEAT2_AG_FADE_OUT_START = 0.378
const BEAT2_AG_FADE_OUT_END = 0.383
// Reference point for `cycleRotations`. The legacy cycling expression
// was `beat1T * BEAT1_CYCLE` where `beat1T = v / FREEZE_AT`, so the
// full cycle window runs one rotation of `BEAT1_CYCLE = 90` phase
// units across `[0, FREEZE_AT)`. We pass that rotation count to the
// arbiter as a payload number rather than importing `BEAT1_CYCLE`
// so the beat table stays free of palette internals.
const BEAT1_CYCLE_ROTATIONS = 90
// `beat1T / 0.33` is the legacy fade-in ramp, i.e. the first third
// of the cycle window is fade-in, the rest is hold with breath.
const BEAT1_FADE_IN_FRAC = 0.33
const BEAT1_PEAK_OPACITY = 0.65
const BEAT1_BREATH_AMPLITUDE = 0.05

const BEAT0_ENTRY: BeatTableEntry = {
  id: "legend",
  actors: [
    // Narration bridge. Fires every tick across the full progress
    // range. The arbiter delegates to the callback that
    // `BeatTextOverlay` registers via `ctx.narrationTickRef`. Hosted
    // under the first beat because actor windows are independent of
    // beat checkpoints and narration has no natural "owner" beat.
    // Half-open `[0, 1)` matches engine convention. The final tick
    // at v=1 is harmless because narration opacity curves have
    // already latched to their final values well before v approaches 1.
    {
      kind: "narration",
      id: "beat0:narration:tick",
      window: [0, 1],
    },
    // Overlay-morph bridge. Same shape and rationale as the
    // narration bridge above. `OutcomeMorphOverlay` registers its
    // per-frame SVG-transform callback via
    // `ctx.overlayMorphTickRef`. See
    // `engine/arbiters/OverlayMorphArbiter.ts`.
    {
      kind: "overlayMorph",
      id: "beat0:overlayMorph:tick",
      window: [0, 1],
    },
    {
      kind: "mapPaint",
      id: "beat0:mapPaint:reset",
      window: [0, RESET_END],
      payload: { kind: "reset" },
    },
    {
      kind: "mapPaint",
      id: "beat0:mapPaint:cycle",
      window: [RESET_END, FREEZE_AT],
      payload: {
        kind: "beat1-cycle",
        cycleStart: 0,
        cycleEnd: FREEZE_AT,
        cycleRotations: BEAT1_CYCLE_ROTATIONS,
        peakOpacity: BEAT1_PEAK_OPACITY,
        fadeInFrac: BEAT1_FADE_IN_FRAC,
        breathAmplitude: BEAT1_BREATH_AMPLITUDE,
      },
    },
    {
      kind: "mapPaint",
      id: "beat0:mapPaint:hold",
      window: [FREEZE_AT, BEAT1C_BLEND_START],
      payload: {
        kind: "beat1-hold",
        peakOpacity: BEAT1_PEAK_OPACITY,
      },
    },
  ],
}

// Beat 1 (collapse-and-colors) actors. Covers the two-stage color
// morph from the 3-blue palette to AG tier colors (`beat1c-blend`)
// and the subsequent AG-only tier-color hold (`beat1c-tail`). The
// tail actor's window extends past the `collapse-and-colors`
// checkpoint (0.365) into the start of `ag-rev-morph` (ending at
// `BEAT2_START` = 0.38), but actor windows are independent of beat
// checkpoints so hosting under `collapse-and-colors` stays
// consistent with this beat's semantic role.
const BEAT1_ENTRY: BeatTableEntry = {
  id: "collapse-and-colors",
  actors: [
    {
      kind: "mapPaint",
      id: "beat1:mapPaint:blend",
      window: [BEAT1C_BLEND_START, BEAT1C_BLEND_END],
      payload: {
        kind: "beat1c-blend",
        blendStart: BEAT1C_BLEND_START,
        convergeEnd: BEAT1C_CONVERGE_END,
        blendEnd: BEAT1C_BLEND_END,
        peakOpacity: BEAT1_PEAK_OPACITY,
      },
    },
    {
      kind: "mapPaint",
      id: "beat1:mapPaint:tail",
      window: [BEAT1C_BLEND_END, BEAT2_START],
      payload: {
        kind: "beat1c-tail",
        peakOpacity: BEAT1_PEAK_OPACITY,
      },
    },
  ],
}

// Beat 2 (ag-rev-morph) actors. Covers the per-DU fade-out that
// escorts each outcome's polygons off the map as the SVG
// distribution-square morph takes over. The arbiter reads the
// current hide schedule every tick via `ctx.getHideSchedule()`
// because the schedule is built after tier data loads and can
// re-build as outcomes change. Window end
// (`BEAT5_ENTER`) is where the Beat 5 actor takes ownership and
// writes its own AG-only baseline.
//
// The `beat2:mapPaint:lineFades` companion actor handles the
// line-geometry side of the same hide schedule. Its window extends
// past `BEAT5_ENTER` because the line layers (e.g. `cwf-flowline`,
// `delta-detaw-line`) stay at opacity 0 through the rest of the
// storyboard, and a wider window ensures reverse scrubs (back past
// a `morphStart`, then forward) re-establish the correct opacity.
// Line layers are disjoint from `demand-units` and
// `demand-units-outline`, so coexisting with the Beat 5 cluster and
// `beat6:mapPaint:restore` is conflict-free.
const BEAT2_ENTRY: BeatTableEntry = {
  id: "ag-rev-morph",
  actors: [
    {
      kind: "mapPaint",
      id: "beat2:mapPaint:hideSchedule",
      window: [BEAT2_START, BEAT5_ENTER],
      payload: {
        kind: "beat2-hide-schedule",
        agFadeOutStart: BEAT2_AG_FADE_OUT_START,
        agFadeOutEnd: BEAT2_AG_FADE_OUT_END,
        peakOpacity: BEAT1_PEAK_OPACITY,
      },
    },
    {
      kind: "mapPaint",
      id: "beat2:mapPaint:lineFades",
      window: [BEAT2_START, 1],
      payload: { kind: "beat-line-fades" },
    },
  ],
}

// Beat 6 (post-Beat-5 tail) actors. One-shot DU restore at
// `BEAT5_TAIL_END`. Hosted under the `list-bar` checkpoint because
// actor windows are independent of beat checkpoints and `list-bar`
// is the first beat checkpoint at or after `BEAT5_TAIL_END`. The
// arbiter performs a full-state baseline that takes ownership back
// from the Beat 5 cluster's AG-only filter and pins both DU
// opacities at scalar 0 for the rest of the storyboard. Reverse
// scrubs back into Beat 5 are handled by the Beat 5 cluster's own
// `onEnter`.
const BEAT6_ENTRY: BeatTableEntry = {
  id: "list-bar",
  actors: [
    {
      kind: "mapPaint",
      id: "beat6:mapPaint:restore",
      window: [BEAT5_TAIL_END, 1],
      payload: { kind: "beat6-restore" },
    },
  ],
}

// The table

export const BEAT_TABLE: readonly BeatTableEntry[] = [
  BEAT0_ENTRY,
  BEAT1_ENTRY,
  BEAT2_ENTRY,
  { id: "all-other-morphs", actors: [] },
  BEAT4_ENTRY,
  BEAT6_ENTRY,
  { id: "radar", actors: [] },
  { id: "heatmap", actors: [] },
]
