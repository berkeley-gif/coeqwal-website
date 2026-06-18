/* Actor groups: the actors that play under each timing beat. Each group
 * pairs a timing-beat id (see animationTiming.ts) with its active
 * actors. The engine flattens these and routes each actor to the arbiter
 * for its kind (`mapPaint`, `mapPopup`, `overlayPopup`, `narration`,
 * `overlayMorph`). Empty `actors` groups still drive choreography from
 * component effects and the overlay bridges.
 *
 * For the beat-by-beat timeline that lists these actors alongside what is on
 * screen, see BEATS.md. For the concepts (beat, actor, window, arbiter) see
 * the animation README. */

import type { ActorGroup } from "./types"
import { getDemandUnitDisplayName } from "../../../map/config/demandUnitNames"
import { getTierLabel } from "../../../../content/tiers"
import { LOI_DU_ID, HIGHLIGHT_GOLD } from "../demandUnitsPaint"

/* Progress thresholds, ordered along the shared 0-to-1 progress axis so the
 * file reads top to bottom as the storyboard plays forward. Each is tagged
 * with the beat it drives (see animationTiming.ts for beat ids and indices).
 */

// legend [0]
// Reset window `[0, RESET_END)`. Enter asserts the full baseline for
// `demand-units` and `demand-units-outline`.
const RESET_END = 0.01
// Blue color-cycle ends and the blue hold begins.
const FREEZE_AT = 0.09

// collapse-and-colors [1]
const TIER_BLEND_START = 0.26
// Splits the tier-color blend: first collapse the three blues to
// BLUE_MID, then blend BLUE_MID into the AG tier colors.
const TIER_CONVERGE_END = 0.27
const TIER_BLEND_END = 0.28

// ag-rev-morph [2]. The AG fade-out window straddles `BEAT2_START`.
const BEAT2_AG_FADE_OUT_START = 0.378
const BEAT2_START = 0.38
const BEAT2_AG_FADE_OUT_END = 0.383

// loi-highlight [4]
const LOI_ENTER = 0.5
const LOI_LAYER_IN_START = 0.5
const LOI_LAYER_IN_END = 0.52
// The four highlight steps run right after the layer settles so the gold
// ring does not sit on a long pause, finishing well before LOI_SETTLE.
const LOI_SQUARE_RING_AT = 0.54
const LOI_SQUARE_POPUP_AT = 0.55
const LOI_POLYGON_RING_AT = 0.56
const LOI_POLYGON_POPUP_AT = 0.565
const LOI_SETTLE = 0.62
// list-bar [5] keys its one-shot DU restore off this same value.
const LOI_TAIL_END = 0.63

/* Tuning constants (amplitudes and opacities, not positions on the
 * progress axis). */
// Color-cycle rotations. 90 is one full cycle across `[0, FREEZE_AT)`.
const BLUE_CYCLE_ROTATIONS = 90
// Fraction of the cycle window spent fading the colored locations in.
// Most of the window so the layer eases in rather than snapping on. The
// remainder holds with a breathing oscillation.
const BLUE_FADE_IN_FRAC = 0.85
const LAYER_PEAK_OPACITY = 0.65
const BLUE_BREATH_AMPLITUDE = 0.05
// Peak opacity of the AG demand-unit layer during loi-highlight.
const LOI_LAYER_OPACITY = 0.65

// legend [0] actors
const BEAT0_ACTORS: ActorGroup = {
  id: "legend",
  actors: [
    // Narration bridge. Runs every frame across the storyboard, calling
    // the callback `BeatTextOverlay` registers via `ctx.narrationTickRef`.
    // Lives under the first beat only.
    // (Actor windows don't have to line up with beats.)
    {
      kind: "narration",
      id: "legend:narration:tick",
      window: [0, 1],
    },
    // Overlay-morph bridge. Same shape and rationale as the narration
    // bridge. `OutcomeMorphOverlay` registers its per-frame SVG-transform
    // callback via `ctx.overlayMorphTickRef`. See
    // `engine/arbiters/OverlayMorphArbiter.ts`.
    {
      kind: "overlayMorph",
      id: "legend:overlayMorph:tick",
      window: [0, 1],
    },
    {
      kind: "mapPaint",
      id: "legend:mapPaint:reset",
      window: [0, RESET_END],
      payload: { kind: "reset" },
    },
    {
      kind: "mapPaint",
      id: "legend:mapPaint:cycle",
      window: [RESET_END, FREEZE_AT],
      payload: {
        kind: "blue-cycle",
        cycleStart: 0,
        cycleEnd: FREEZE_AT,
        cycleRotations: BLUE_CYCLE_ROTATIONS,
        peakOpacity: LAYER_PEAK_OPACITY,
        fadeInFrac: BLUE_FADE_IN_FRAC,
        breathAmplitude: BLUE_BREATH_AMPLITUDE,
      },
    },
    {
      kind: "mapPaint",
      id: "legend:mapPaint:hold",
      window: [FREEZE_AT, TIER_BLEND_START],
      payload: {
        kind: "blue-hold",
        peakOpacity: LAYER_PEAK_OPACITY,
      },
    },
  ],
}

// collapse-and-colors [1] actors. Two-stage color morph from the
// three blues to AG tier colors (`tier-color-blend`), then an AG-only
// hold (`tier-color-hold`). The tail's window runs slightly past this
// beat into `ag-rev-morph`, fine since windows needn't match beats.
const BEAT1_ACTORS: ActorGroup = {
  id: "collapse-and-colors",
  actors: [
    {
      kind: "mapPaint",
      id: "collapse-and-colors:mapPaint:blend",
      window: [TIER_BLEND_START, TIER_BLEND_END],
      payload: {
        kind: "tier-color-blend",
        blendStart: TIER_BLEND_START,
        convergeEnd: TIER_CONVERGE_END,
        blendEnd: TIER_BLEND_END,
        peakOpacity: LAYER_PEAK_OPACITY,
      },
    },
    {
      kind: "mapPaint",
      id: "collapse-and-colors:mapPaint:tail",
      window: [TIER_BLEND_END, BEAT2_START],
      payload: {
        kind: "tier-color-hold",
        peakOpacity: LAYER_PEAK_OPACITY,
      },
    },
  ],
}

// ag-rev-morph [2] actors. Fades each outcome's polygons off the
// map as the SVG morph takes over. The arbiter reads
// `ctx.getHideSchedule()` every frame because the schedule is built
// after tier data loads and can rebuild. Window ends at `LOI_ENTER`.
//
// The `lineFades` companion handles the line layers in the same
// schedule. Its window runs to the end so lines stay hidden and reverse
// scrubs restore the right opacity. Line layers don't overlap
// `demand-units`, so this never conflicts with later actors.
const BEAT2_ACTORS: ActorGroup = {
  id: "ag-rev-morph",
  actors: [
    {
      kind: "mapPaint",
      id: "ag-rev-morph:mapPaint:hideSchedule",
      window: [BEAT2_START, LOI_ENTER],
      payload: {
        kind: "polygon-hide-schedule",
        agFadeOutStart: BEAT2_AG_FADE_OUT_START,
        agFadeOutEnd: BEAT2_AG_FADE_OUT_END,
        peakOpacity: LAYER_PEAK_OPACITY,
      },
    },
    {
      kind: "mapPaint",
      id: "ag-rev-morph:mapPaint:lineFades",
      window: [BEAT2_START, 1],
      payload: { kind: "line-hide-schedule" },
    },
  ],
}

// loi-highlight [4] helper and actors.

const LOI_CODE = "AG_REV"

/** Resolve `info`, `coord`, `name`, and `tierColor` for `LOI_DU_ID`.
 *  Returns null if data isn't ready. The engine retries next frame. */
function resolveLoiData(ctx: {
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
  const tier = agData.tierMap[LOI_DU_ID]
  if (tier == null) return null
  const coord = ctx.centroidLookup.get(LOI_DU_ID) ?? null
  const tierColor = agData.colorMap[LOI_DU_ID] ?? "#888888"
  // Match the interactive popup's name precedence: prefer a meaningful
  // API name, but treat an API value equal to the raw id as missing and
  // fall back to the friendly display name. Otherwise the animated popup
  // could show the raw id while a click shows the friendly name.
  const apiName = agData.nameMap[LOI_DU_ID]
  const name =
    apiName && apiName !== LOI_DU_ID
      ? apiName
      : (getDemandUnitDisplayName(LOI_DU_ID) ?? LOI_DU_ID)
  return {
    info: { code: LOI_CODE, sourceId: LOI_DU_ID, tier },
    coord,
    tierColor,
    name,
  }
}

const BEAT4_ACTORS: ActorGroup = {
  id: "loi-highlight",
  actors: [
    // Map paint. One-shot filter swap at window entry.
    {
      kind: "mapPaint",
      id: "loi-highlight:mapPaint:enter",
      // Window is a hair wider than the layer-fade so enter runs before
      // the first opacity write.
      window: [LOI_ENTER, LOI_TAIL_END],
      payload: { kind: "loi-enter", loiDuId: LOI_DU_ID },
    },
    // Map paint. Per-frame opacity ramp for the AG demand-unit layer.
    {
      kind: "mapPaint",
      id: "loi-highlight:mapPaint:layerFade",
      window: [LOI_ENTER, LOI_TAIL_END],
      payload: {
        kind: "loi-layer-fade",
        fadeInStart: LOI_LAYER_IN_START,
        fadeInEnd: LOI_LAYER_IN_END,
        holdUntil: LOI_SETTLE,
        tailEnd: LOI_TAIL_END,
        peakOpacity: LOI_LAYER_OPACITY,
      },
    },
    // Overlay popup. Gold ring on the distribution square at step 2.
    {
      kind: "overlayPopup",
      id: "loi-highlight:overlayPopup:ring",
      window: [LOI_SQUARE_RING_AT, LOI_SETTLE],
      target: "ring",
      buildInfo: (ctx) => resolveLoiData(ctx)?.info ?? null,
    },
    // Overlay popup. Square-side popup at step 3.
    {
      kind: "overlayPopup",
      id: "loi-highlight:overlayPopup:hover",
      window: [LOI_SQUARE_POPUP_AT, LOI_SETTLE],
      target: "hover",
      buildInfo: (ctx) => resolveLoiData(ctx)?.info ?? null,
    },
    // Map paint. Gold stroke on the LOI polygon at step 4.
    {
      kind: "mapPaint",
      id: "loi-highlight:mapPaint:polyRing",
      window: [LOI_POLYGON_RING_AT, LOI_SETTLE],
      payload: {
        kind: "loi-gold-ring",
        loiDuId: LOI_DU_ID,
        goldHex: HIGHLIGHT_GOLD,
      },
    },
    // Map popup. `LocationHighlight` anchored to the LOI polygon at step 5.
    {
      kind: "mapPopup",
      id: "loi-highlight:mapPopup:loi",
      // Runs through `LOI_TAIL_END` (not just `LOI_SETTLE`) so the popup
      // stays readable during the ~0.01-wide tail.
      window: [LOI_POLYGON_POPUP_AT, LOI_TAIL_END],
      buildHighlight: (ctx) => {
        const data = resolveLoiData(ctx)
        if (!data || !data.coord) return null
        return {
          key: `loi-highlight:${data.info.code}:${data.info.sourceId}`,
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
    // Map paint. Clears the gold ring on the last frame of the beat.
    {
      kind: "mapPaint",
      id: "loi-highlight:mapPaint:exit",
      window: [LOI_TAIL_END - 0.0005, LOI_TAIL_END],
      payload: { kind: "loi-exit", clearRing: true },
    },
  ],
}

// list-bar [5] actors. A one-shot DU restore at `LOI_TAIL_END` that takes
// the layers back from the loi-highlight actors and pins both opacities
// at 0 for the rest of the storyboard. Lives under `list-bar`, the first
// beat at or after `LOI_TAIL_END`. Scrubbing back into loi-highlight is
// handled by its own enter.
const BEAT5_ACTORS: ActorGroup = {
  id: "list-bar",
  actors: [
    {
      kind: "mapPaint",
      id: "list-bar:mapPaint:restore",
      window: [LOI_TAIL_END, 1],
      payload: { kind: "du-clear-hold" },
    },
  ],
}

export const ACTOR_GROUPS: readonly ActorGroup[] = [
  BEAT0_ACTORS,
  BEAT1_ACTORS,
  BEAT2_ACTORS,
  { id: "all-other-morphs", actors: [] },
  BEAT4_ACTORS,
  BEAT5_ACTORS,
  { id: "radar", actors: [] },
  { id: "heatmap", actors: [] },
]
