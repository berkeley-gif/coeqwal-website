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
import { getDemandUnitDisplayName } from "../../../map/config/demandUnitNames"
import { getTierLabel } from "../../../../content/tiers"

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
// and `BEAT1C_BLEND_START` declarations at
// TierAnimationSection.tsx lines 2145 to 2150. Must stay in sync.
const FREEZE_AT = 0.09
const BEAT1C_BLEND_START = 0.26
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

// The table

export const BEAT_TABLE: readonly BeatTableEntry[] = [
  BEAT0_ENTRY,
  { id: "collapse-and-colors", actors: [] },
  { id: "ag-rev-morph", actors: [] },
  { id: "all-other-morphs", actors: [] },
  BEAT4_ENTRY,
  { id: "list-bar", actors: [] },
  { id: "radar", actors: [] },
  { id: "heatmap", actors: [] },
]
