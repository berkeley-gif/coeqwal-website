"use client"

/* Per-frame label geometry for the right column.
 *
 * Positions outcome titles, captions, radar/heatmap axis labels, and column
 * eyebrows as `progress` advances, and syncs the white backdrop height. Runs
 * through the narration bridge. See "The bridge actors" in README.md.
 */

import { useRef, useEffect, useLayoutEffect, type RefObject } from "react"
import { useTheme } from "@repo/ui/mui"
import type { MotionValue } from "@repo/motion"
import {
  BLOCK_EXIT_SEC,
  secondsToProgress,
  BACKDROP_FADE_IN_PROGRESS,
  BACKDROP_FADE_IN_WIDTH,
} from "./animationTiming"
import {
  computeRadarFrame,
  radarVertexAngle,
  computeHeatmapColumnFrame,
  heatmapCellCenterY,
  HEAT_LABEL_COL_W,
} from "./storyboardGeometry"
import { OUTCOME_CODE_ORDER } from "../../../content/outcomes"
import type { Beat2Layout, ColumnEyebrow, GlyphRect } from "./overlayTypes"

// Eyebrow / caption fade-out widths (`progress`), authored in seconds so
// they hold their pace if a beat is retuned.
const LOI_HIGHLIGHT_EXIT = secondsToProgress(4, BLOCK_EXIT_SEC)
const RADAR_EXIT = secondsToProgress(6, BLOCK_EXIT_SEC)

// Progress points where the eyebrows / captions start fading out.
const ALL_OTHER_OUTCOMES_OUT = 0.5
const RADAR_CAPTION_OUT = 0.72

/* Radar / heatmap label phase boundaries, in `progress`.
 *
 * Each title slides onto its radar axis, holds, fades out, then snaps
 * (invisibly) to its heatmap row and fades back in.
 *
 *   RADAR_SLIDE_START .. RADAR_SLIDE_END  title glides onto its radar axis
 *   RADAR_SETTLE                          radar beat's resting value
 *   RADAR_LABEL_FADE_START .. _FADE_END   radar labels fade out
 *   HEATMAP_TAKEOVER                      heatmap labels replace radar labels
 */
const RADAR_SLIDE_START = 0.75
const RADAR_SLIDE_END = 0.82
/** Radar beat's resting progress. Fade-out must begin after this or labels
 *  settle dimmed on the radar beat. */
const RADAR_SETTLE = 0.87
const RADAR_LABEL_FADE_START = RADAR_SETTLE + 0.01
const RADAR_LABEL_FADE_END = 0.92
const HEATMAP_TAKEOVER = 0.95
/** Ramp width of the radar slide (RADAR_SLIDE_END - RADAR_SLIDE_START). */
const RADAR_SLIDE_WIDTH = RADAR_SLIDE_END - RADAR_SLIDE_START
/** Ramp width shared by the radar-out and heatmap-in opacity fades. */
const LABEL_FADE_WIDTH = 0.04

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v))
}

interface UseOutcomeLabelGeometryParams {
  progress: MotionValue<number>
  /** Bridge into `NarrationArbiter`. The hook writes its per-frame
   *  dispatcher here. See `engine/arbiters/NarrationArbiter.ts`. */
  narrationTickRef: RefObject<((v: number) => void) | null>
  beat2Layout?: Beat2Layout | null
  /** Per-outcome Beat 2 morph window: `start` drives the title fade-in,
   *  `end` the caption. */
  outcomeMorphWindows?: Record<string, { start: number; end: number }>
  /** Reports panel-relative glyph landing rects to the SVG morph overlay. */
  onGlyphLayoutChange?: (layout: Record<string, GlyphRect>) => void
  /** Reports the right column's full scrollable content height (not just
   *  what's currently visible), so the SVG overlay can size itself to
   *  cover the whole scroll range instead of just the visible window. */
  onContentHeightChange?: (height: number) => void
  /** Fires once when the backdrop crosses from invisible to visible (or
   *  back), not every frame - lets the parent gate the scroll-down chevron
   *  on real visibility instead of an approximate beatIndex threshold. */
  onBackdropVisibilityChange?: (visible: boolean) => void
  /** Extra heatmap columns beyond the primary one. Defaults to 0. */
  heatmapExtraColumnCount?: number
}

/** Refs the parent attaches to the right-column DOM so this hook can
 *  measure and animate the labels. */
export interface OutcomeLabelRefs {
  /** Outer panel box (`inset: 0`). The `y` reference frame. */
  panelRootRef: RefObject<HTMLDivElement | null>
  /** Right-column root (left edge at `panelWidth * 2/3`). The `x` frame. */
  rightColumnRootRef: RefObject<HTMLDivElement | null>
  /** White backdrop behind the right-column content. */
  beat2PanelRef: RefObject<HTMLDivElement | null>
  /** Title rows, keyed by outcome code. */
  titleRefsMap: RefObject<Map<string, HTMLDivElement | null>>
  /** Transparent glyph placeholders reserving SVG landing space. */
  placeholderRefsMap: RefObject<Map<string, HTMLDivElement | null>>
  /** Captions under each glyph. */
  captionRefsMap: RefObject<Map<string, HTMLDivElement | null>>
  /** Column eyebrows, indexed by column (0 / 1). */
  eyebrowRefs: RefObject<(HTMLDivElement | null)[]>
  /** Outer two-column grid wrapper, clipped during radar/heatmap. */
  gridWrapperRef: RefObject<HTMLDivElement | null>
}

/* ──────────────────────────────────────────────────────────────
 * Per-frame label geometry for the right panel.
 *
 * Owns the continuous-clock work: SVG-coupled outcome titles and captions,
 * radar/heatmap label positions, and column eyebrows. The only
 * `progress.on("change")` subscriber (via `NarrationArbiter`). The parent
 * (`BeatTextOverlay`) renders the DOM and attaches the refs returned here.
 * This hook writes their inline styles each frame. Narration prose and
 * view-mode headers are rendered by the parent (by `beatIndex`), not here.
 *
 * Two facts used throughout:
 *   - Positions are panel-relative. `x` from `rightColumnRootRef` (left edge
 *     at `panelWidth * 2/3`), `y` from `panelRootRef` (the `inset: 0` box,
 *   - Radar and heatmap geometry comes from `storyboardGeometry.ts` (shared
 *     with `OutcomeMorphOverlay`) so labels land on the SVG vertices.
 * ────────────────────────────────────────────────────────────── */
export function useOutcomeLabelGeometry({
  progress,
  narrationTickRef,
  beat2Layout,
  outcomeMorphWindows,
  onGlyphLayoutChange,
  onContentHeightChange,
  onBackdropVisibilityChange,
  heatmapExtraColumnCount = 0,
}: UseOutcomeLabelGeometryParams): OutcomeLabelRefs {
  const theme = useTheme()

  const beat2PanelRef = useRef<HTMLDivElement>(null)
  const panelRootRef = useRef<HTMLDivElement>(null)
  const rightColumnRootRef = useRef<HTMLDivElement>(null)

  const titleRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const placeholderRefsMap = useRef<Map<string, HTMLDivElement | null>>(
    new Map(),
  )
  const captionRefsMap = useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Precomputed geometry, filled by the measure pass and read each frame.
  /** Wrapped (radar-layout) center of each title block, panel-relative. */
  const wrappedTitleGeomRef = useRef<
    Map<
      string,
      { textCenterX: number; textCenterY: number; textHeight: number }
    >
  >(new Map())
  /** Per-outcome translate to slide a title onto its radar axis. */
  const radarLabelDeltaRef = useRef<Map<string, { dx: number; dy: number }>>(
    new Map(),
  )
  /** Per-outcome offset from single-line rest center to wrapped (radar) rest
   *  center. The wrap flip moves the box instantly. We cancel that shift at
   *  the start of the radar slide so the label glides from where it sat. */
  const radarReflowShiftRef = useRef<Map<string, { dx: number; dy: number }>>(
    new Map(),
  )
  /** Per-outcome translate to move a title to its heatmap y-axis row. */
  const heatmapLabelDeltaRef = useRef<Map<string, { dx: number; dy: number }>>(
    new Map(),
  )
  /** Wrap `max-width` (px) for radar labels, re-applied when wrap turns on. */
  const radarLabelMaxWidthRef = useRef<number>(110)
  /** Per-outcome wrap `max-width` (px) for heatmap y-axis labels. */
  const heatmapLabelMaxWRef = useRef<Map<string, number>>(new Map())
  // Track the applied wrap mode so styles toggle on change, not every frame.
  // The two modes are mutually exclusive.
  const heatmapTextActiveRef = useRef(false)
  const radarWrapActiveRef = useRef<boolean>(false)
  const eyebrowRefs = useRef<(HTMLDivElement | null)[]>([])
  /** Outer two-column grid wrapper. Clipped to the visible height during
   *  radar/heatmap so its placeholder rows (locked tall, see
   *  useStoryboardLayout.ts) stop inflating `root`'s scrollHeight once
   *  they're just invisible dead space underneath the compact chart. */
  const gridWrapperRef = useRef<HTMLDivElement>(null)
  /** Distribution grid's measured bottom edge, cached from `measure()`'s
   *  caption scan so the tick handler below can reuse it without
   *  re-scanning the DOM every frame. */
  const tallContentHeightRef = useRef(0)
  /** Which content-height regime is currently applied, so the tick
   *  handler only recomputes on an actual crossing, not every frame.
   *  Three states, not just tall/compact, because radar and heatmap need
   *  their own heights tracked separately below - blending them with a
   *  single `Math.max` made radar inherit heatmap's (larger) requirement
   *  for the whole compact span, reintroducing empty space under radar. */
  const contentHeightPhaseRef = useRef<"tall" | "radar" | "heatmap">("tall")

  /** Radar's and heatmap's own real bottom edges (from their geometry,
   *  not just assumed to always fit in one viewport) - see the comment at
   *  the end of `measure()`. Reused by the tick handler for a
   *  scroll-driven crossing, same as `tallContentHeightRef`. */
  const radarContentHeightRef = useRef(0)
  const heatmapContentHeightRef = useRef(0)

  // Mirror props into refs so the per-frame closure reads the latest values
  // without re-subscribing the engine.
  const eyebrowDataRef = useRef<ColumnEyebrow[] | undefined>(undefined)
  eyebrowDataRef.current = beat2Layout?.eyebrows
  const beat2LayoutRef = useRef<Beat2Layout | null | undefined>(undefined)
  beat2LayoutRef.current = beat2Layout
  const outcomeMorphWindowsRef = useRef(outcomeMorphWindows)
  outcomeMorphWindowsRef.current = outcomeMorphWindows

  /* ── Per-frame applier (engine bridge) ──
   *
   * Writes morph-coupled label styles each frame: title/caption fades tied to
   * the SVG morph windows, wrap-flip opacity dips, and radar/heatmap label
   * translates. Rebuilt every render and invoked via `narrationTickRef` (set
   * in the bridge effect below). Fades are `clamp01((v - START) / WIDTH)`,
   * combined as `fadeIn * (1 - fadeOut)`. */
  const backdropVisibleRef = useRef(false)

  const latestNarrationFrameRef = useRef<(v: number) => void>(() => {})
  latestNarrationFrameRef.current = (v: number) => {
    // White backdrop fades in with AG_REV's morph (the first graphic). The
    // right column's overflow is gated on the same signal so its native
    // scrollbar can't peek out from behind an invisible panel on beat 0/1.
    const fadeIn = clamp01(
      (v - BACKDROP_FADE_IN_PROGRESS) / BACKDROP_FADE_IN_WIDTH,
    )
    if (beat2PanelRef.current) {
      beat2PanelRef.current.style.opacity = String(fadeIn)
    }
    if (rightColumnRootRef.current) {
      rightColumnRootRef.current.style.overflowY =
        fadeIn > 0 ? "auto" : "hidden"
    }
    const isBackdropVisible = fadeIn > 0
    if (isBackdropVisible !== backdropVisibleRef.current) {
      backdropVisibleRef.current = isBackdropVisible
      onBackdropVisibilityChange?.(isBackdropVisible)
    }

    // Titles fade in just before their morph slice. Captions over the tail
    // of the morph window, so both read as the polygons settle.
    const windows = outcomeMorphWindowsRef.current
    const TITLE_LEAD = 0.004
    const TITLE_FADE = 0.009
    const HEATMAP_WRAP_DIP_CENTER = HEATMAP_TAKEOVER
    const HEATMAP_WRAP_DIP_HALF = 0.01
    let wrapDip = 1
    if (
      v >= HEATMAP_WRAP_DIP_CENTER - HEATMAP_WRAP_DIP_HALF &&
      v <= HEATMAP_WRAP_DIP_CENTER + HEATMAP_WRAP_DIP_HALF
    ) {
      wrapDip =
        v < HEATMAP_WRAP_DIP_CENTER
          ? 1 -
            (v - (HEATMAP_WRAP_DIP_CENTER - HEATMAP_WRAP_DIP_HALF)) /
              HEATMAP_WRAP_DIP_HALF
          : (v - HEATMAP_WRAP_DIP_CENTER) / HEATMAP_WRAP_DIP_HALF
    }
    // Hold radar labels opaque through RADAR_SETTLE, fade out, hold invisible
    // while the layout snaps to the heatmap, then fade heatmap labels in.
    const pathOpacity =
      v < RADAR_LABEL_FADE_START
        ? 1
        : v < RADAR_LABEL_FADE_END
          ? 1 - (v - RADAR_LABEL_FADE_START) / LABEL_FADE_WIDTH
          : v < HEATMAP_TAKEOVER
            ? 0
            : Math.min(1, (v - HEATMAP_TAKEOVER) / LABEL_FADE_WIDTH)
    // CAPTION_LEAD == CAPTION_FADE so the caption is fully opaque exactly
    // when the squares lock in.
    const CAPTION_FADE = 0.006
    const CAPTION_LEAD = CAPTION_FADE
    // Cap the fade end so short slices still settle opaque before
    // all-other-morphs ends (0.5).
    const CAPTION_FADE_END_CEILING = 0.495
    const layoutItems = beat2LayoutRef.current?.items
    if (layoutItems) {
      for (const item of layoutItems) {
        const win = windows?.[item.code]
        const titleEl = titleRefsMap.current.get(item.code)
        const captionEl = captionRefsMap.current.get(item.code)

        if (!win) {
          // No morph window yet: hide title + caption so a stale slot
          // doesn't leak into an earlier beat.
          if (titleEl) titleEl.style.opacity = "0"
          if (captionEl) captionEl.style.opacity = "0"
          continue
        }

        const morphStart = win.start
        const morphEnd = win.end

        if (titleEl) {
          const titleFadeStart = morphStart - TITLE_LEAD
          // `wrapDip` is 1 outside the flip windows.
          titleEl.style.opacity = String(
            clamp01((v - titleFadeStart) / TITLE_FADE) * wrapDip * pathOpacity,
          )
        }

        if (captionEl) {
          const rawFadeEnd = morphEnd + (CAPTION_FADE - CAPTION_LEAD)
          const captionFadeEnd = Math.min(rawFadeEnd, CAPTION_FADE_END_CEILING)
          const captionFadeStart = captionFadeEnd - CAPTION_FADE
          const captionFadeIn = clamp01((v - captionFadeStart) / CAPTION_FADE)
          // Captions hold through loi-highlight [4] and list-bar [5], then
          // fade out as the radar beat [6] begins to clear the right third.
          // Monotonic on `v`, so Back reverses it.
          const captionFadeOut = clamp01((v - RADAR_CAPTION_OUT) / RADAR_EXIT)
          captionEl.style.opacity = String(captionFadeIn * (1 - captionFadeOut))
        }
      }
    }

    // Radar wraps and centers titles. Heatmap wraps and right-aligns them.
    // Mutually exclusive modes. Toggle styles only when the mode changes.
    const wantHeatmapText = v >= HEATMAP_TAKEOVER
    // Wrap when the radar slide starts (RADAR_SLIDE_START) so the reflow lands
    // while the label is already moving, not as a separate dip. Stay wrapped
    // until HEATMAP_TAKEOVER so the label doesn't un-wrap while fading out.
    const wantRadarAxisWrap = v >= RADAR_SLIDE_START && !wantHeatmapText
    if (wantHeatmapText && !heatmapTextActiveRef.current) {
      heatmapTextActiveRef.current = true
      radarWrapActiveRef.current = false
      const maxWMap = heatmapLabelMaxWRef.current
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        textEl.style.whiteSpace = ""
        textEl.style.textAlign = ""
        textEl.style.maxWidth = ""
        textEl.style.overflowWrap = ""
        textEl.style.color = ""
        el.style.justifyContent = ""
        el.style.overflow = ""
        const mw = maxWMap.get(code) ?? 120
        textEl.style.whiteSpace = "normal"
        textEl.style.textAlign = "right"
        textEl.style.maxWidth = `${mw}px`
        textEl.style.overflowWrap = "break-word"
        textEl.style.color = theme.palette.text.primary
        el.style.justifyContent = "flex-end"
        el.style.overflow = "visible"
      })
    } else if (!wantHeatmapText && heatmapTextActiveRef.current) {
      heatmapTextActiveRef.current = false
      titleRefsMap.current.forEach((el) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        textEl.style.whiteSpace = ""
        textEl.style.textAlign = ""
        textEl.style.maxWidth = ""
        textEl.style.overflowWrap = ""
        textEl.style.color = ""
        el.style.justifyContent = ""
        el.style.overflow = ""
      })
    }
    if (!wantHeatmapText && wantRadarAxisWrap !== radarWrapActiveRef.current) {
      radarWrapActiveRef.current = wantRadarAxisWrap
      const maxW = radarLabelMaxWidthRef.current
      titleRefsMap.current.forEach((el) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        if (wantRadarAxisWrap) {
          textEl.style.whiteSpace = "normal"
          textEl.style.textAlign = "center"
          textEl.style.maxWidth = `${maxW}px`
          textEl.style.overflowWrap = "break-word"
          textEl.style.color = theme.palette.text.primary
          el.style.justifyContent = "center"
          el.style.overflow = "visible"
        } else {
          textEl.style.whiteSpace = ""
          textEl.style.textAlign = ""
          textEl.style.maxWidth = ""
          textEl.style.overflowWrap = ""
          textEl.style.color = ""
          el.style.justifyContent = ""
          el.style.overflow = ""
        }
      })
    }
    // Radar/heatmap are sized to their real measured content, but the
    // distribution grid's placeholder rows stay mounted at their locked
    // (tall) height underneath - they just fade out, clipped to the new
    // target height so they don't inflate scrollHeight past it.
    // `measure()` only recomputes content height on resize, so a plain
    // scroll across this boundary needs its own check here, on every
    // tick, to catch it.
    const contentPhase: "tall" | "radar" | "heatmap" =
      v < RADAR_SLIDE_START
        ? "tall"
        : v < HEATMAP_TAKEOVER
          ? "radar"
          : "heatmap"
    if (contentPhase !== contentHeightPhaseRef.current) {
      contentHeightPhaseRef.current = contentPhase
      const rootEl = rightColumnRootRef.current
      if (rootEl) {
        const targetHeight =
          contentPhase === "tall"
            ? tallContentHeightRef.current
            : contentPhase === "radar"
              ? radarContentHeightRef.current
              : heatmapContentHeightRef.current
        onContentHeightChange?.(targetHeight)
        const backdrop = beat2PanelRef.current
        if (backdrop) {
          backdrop.style.height = `${targetHeight}px`
        }
        const gridWrapperEl = gridWrapperRef.current
        if (gridWrapperEl) {
          if (contentPhase === "tall") {
            gridWrapperEl.style.height = ""
            gridWrapperEl.style.overflow = ""
          } else {
            gridWrapperEl.style.height = `${targetHeight}px`
            gridWrapperEl.style.overflow = "hidden"
          }
        }
      }
    }

    // Slide titles to the radar [RADAR_SLIDE_START-RADAR_SLIDE_END], hold
    // while they fade out, then snap to the heatmap axis at HEATMAP_TAKEOVER+.
    // The snap is hidden because the labels are invisible there.
    const radarDeltas = radarLabelDeltaRef.current
    const heatmapDeltas = heatmapLabelDeltaRef.current
    const reflowShift = radarReflowShiftRef.current
    if (radarDeltas.size > 0 || heatmapDeltas.size > 0) {
      const radarIn = clamp01((v - RADAR_SLIDE_START) / RADAR_SLIDE_WIDTH)
      const radarPosBlend =
        v < RADAR_SLIDE_START
          ? 0
          : v < RADAR_SLIDE_END
            ? radarIn
            : v < RADAR_LABEL_FADE_END
              ? 1
              : 0
      const heatmapPosBlend = v < HEATMAP_TAKEOVER ? 0 : 1
      // Once wrapped, the box jumps to its centered rest spot. Cancel that
      // jump at blend 0 (slide start) by translating back by the reflow shift,
      // then glide to the radar vertex. Single-line has no shift to cancel.
      const radarActive = radarWrapActiveRef.current
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const rd = radarDeltas.get(code)
        const hd = heatmapDeltas.get(code)
        const shift = radarActive ? reflowShift.get(code) : undefined
        const radarDx = rd
          ? (shift ? -shift.dx * (1 - radarPosBlend) : 0) +
            rd.dx * radarPosBlend
          : 0
        const radarDy = rd
          ? (shift ? -shift.dy * (1 - radarPosBlend) : 0) +
            rd.dy * radarPosBlend
          : 0
        const dx = radarDx + (hd ? hd.dx * heatmapPosBlend : 0)
        const dy = radarDy + (hd ? hd.dy * heatmapPosBlend : 0)
        if (dx !== 0 || dy !== 0) {
          el.style.transform = `translate(${dx}px, ${dy}px)`
        } else if (el.style.transform) {
          el.style.transform = ""
        }
      })
    }

    const eyebrows = eyebrowDataRef.current
    if (eyebrows) {
      for (let i = 0; i < eyebrows.length; i++) {
        const el = eyebrowRefs.current[i]
        if (!el) continue
        // Fade in with the backdrop, out at the loi-highlight beat so the
        // slot is free for the view-mode header.
        const fadeIn = clamp01(
          (v - eyebrows[i]!.animationStart) / BACKDROP_FADE_IN_WIDTH,
        )
        const fadeOut = clamp01(
          (v - ALL_OTHER_OUTCOMES_OUT) / LOI_HIGHLIGHT_EXIT,
        )
        el.style.opacity = String(fadeIn * (1 - fadeOut))
      }
    }
  }

  /* ── Bridge registration ──
   *
   * Point `narrationTickRef` at a stable dispatcher reading through
   * `latestNarrationFrameRef` so the engine runs the latest applier without
   * re-subscribing. The mount call syncs immediately. */
  useEffect(() => {
    const dispatch = (v: number) => latestNarrationFrameRef.current(v)
    narrationTickRef.current = dispatch
    dispatch(progress.get())
    return () => {
      if (narrationTickRef.current === dispatch) {
        narrationTickRef.current = null
      }
    }
  }, [narrationTickRef, progress])

  /* ── Measure layout and report glyph rects to the parent ──
   *
   * Runs on layout and on every ResizeObserver fire. Reports glyph
   * placeholder rects (panel-relative) and precomputes the radar + heatmap
   * label deltas. */
  useLayoutEffect(() => {
    if (!onGlyphLayoutChange) return
    const root = rightColumnRootRef.current
    const panel = panelRootRef.current
    if (!root || !panel) return

    const measure = () => {
      const rootRect = root.getBoundingClientRect()
      const layout: Record<string, GlyphRect> = {}
      let maxContentBottom = 0
      placeholderRefsMap.current.forEach((el, code) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        layout[code] = {
          x: r.left - rootRect.left,
          y: r.top - rootRect.top + root.scrollTop,
          width: r.width,
          height: r.height,
        }
      })
      captionRefsMap.current.forEach((el) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        maxContentBottom = Math.max(
          maxContentBottom,
          r.bottom - rootRect.top + root.scrollTop,
        )
      })
      onGlyphLayoutChange(layout)
      // The actual backdrop-height sync and `onContentHeightChange` call
      // happen further down, once the heatmap/radar geometry tells us
      // which phase we're in - see the `phase` block below.
      tallContentHeightRef.current = Math.max(maxContentBottom, rootRect.height)

      // Radar center / radius (shared with `OutcomeMorphOverlay`). Labels
      // ring `labelR` (just past the axis tips) so they clear the outer ring.
      // Sized off the scrolling column's own box, not the full panel's -
      // that's the coordinate space the portaled SVG actually renders in.
      const panelW = rootRect.width
      const panelH = rootRect.height
      const { cx, cy, rMax } = computeRadarFrame(panelW, panelH, 0)
      const LABEL_PAD = 22
      const labelR = rMax + LABEL_PAD
      const activeItems =
        beat2LayoutRef.current?.items.filter(
          (it) => it.isActive && it.targetHeight > 0,
        ) ?? []
      const N = activeItems.length
      // Cap label width to ~0.9 of the arc between neighbors so labels don't
      // collide. Clamp for few outcomes or small panels.
      const arc = N > 0 ? (2 * Math.PI * labelR) / N : 120
      const maxLabelW = Math.max(72, Math.min(160, arc * 0.9))
      radarLabelMaxWidthRef.current = maxLabelW

      // Radar-mode wrap geometry. Titles are single-line at rest but wrap +
      // center on the radar, which moves their center, so we need the wrapped
      // center as the slide target. Apply wrap styles to every title at once,
      // measure, then revert, all inside `useLayoutEffect` so the browser
      // never paints the transient layout. (All at once matches the reflow.)
      const wrapStateByCode = new Map<
        string,
        {
          textEl: HTMLElement
          prevWhiteSpace: string
          prevTextAlign: string
          prevMaxWidth: string
          prevOverflowWrap: string
          boxEl: HTMLDivElement
          prevBoxJustify: string
          prevBoxOverflow: string
          prevBoxTransform: string
        }
      >()
      titleRefsMap.current.forEach((el, code) => {
        if (!el) return
        const textEl = el.firstElementChild as HTMLElement | null
        if (!textEl) return
        wrapStateByCode.set(code, {
          textEl,
          prevWhiteSpace: textEl.style.whiteSpace,
          prevTextAlign: textEl.style.textAlign,
          prevMaxWidth: textEl.style.maxWidth,
          prevOverflowWrap: textEl.style.overflowWrap,
          boxEl: el,
          prevBoxJustify: el.style.justifyContent,
          prevBoxOverflow: el.style.overflow,
          prevBoxTransform: el.style.transform,
        })
      })
      // Apply wrap to every title and clear any runtime translate so a
      // mid-slide ResizeObserver fire measures the at-rest rect, not a
      // translated rect fed back into a compounding delta.
      wrapStateByCode.forEach(({ textEl, boxEl }) => {
        textEl.style.whiteSpace = "normal"
        textEl.style.textAlign = "center"
        textEl.style.maxWidth = `${maxLabelW}px`
        textEl.style.overflowWrap = "break-word"
        boxEl.style.justifyContent = "center"
        boxEl.style.overflow = "visible"
        boxEl.style.transform = ""
      })
      // Measure wrapped centers (panel-relative).
      const wrapGeom = wrappedTitleGeomRef.current
      wrapGeom.clear()
      wrapStateByCode.forEach(({ textEl }, code) => {
        const rText = textEl.getBoundingClientRect()
        wrapGeom.set(code, {
          textCenterX: (rText.left + rText.right) / 2 - rootRect.left,
          textCenterY: (rText.top + rText.bottom) / 2 - rootRect.top,
          textHeight: rText.height,
        })
      })
      // Revert wrap (leave transforms cleared) to measure the at-rest
      // rect, used by the heatmap migration below.
      wrapStateByCode.forEach(
        ({
          textEl,
          prevWhiteSpace,
          prevTextAlign,
          prevMaxWidth,
          prevOverflowWrap,
          boxEl,
          prevBoxJustify,
          prevBoxOverflow,
        }) => {
          textEl.style.whiteSpace = prevWhiteSpace
          textEl.style.textAlign = prevTextAlign
          textEl.style.maxWidth = prevMaxWidth
          textEl.style.overflowWrap = prevOverflowWrap
          boxEl.style.justifyContent = prevBoxJustify
          boxEl.style.overflow = prevBoxOverflow
        },
      )
      const atRestGeom = new Map<
        string,
        { textCenterX: number; textCenterY: number; textRightX: number }
      >()
      wrapStateByCode.forEach(({ textEl }, code) => {
        const r = textEl.getBoundingClientRect()
        atRestGeom.set(code, {
          textCenterX: (r.left + r.right) / 2 - rootRect.left,
          textCenterY: (r.top + r.bottom) / 2 - rootRect.top,
          textRightX: r.right - rootRect.left,
        })
      })
      // Restore transforms so the next frame resumes from its position.
      wrapStateByCode.forEach(({ boxEl, prevBoxTransform }) => {
        boxEl.style.transform = prevBoxTransform
      })

      // Reflow shift: how far the wrap flip moves each title's center from
      // single-line to wrapped rest spot. Keeps the radar slide continuous
      // through the flip (no jump at the start).
      const reflowShift = radarReflowShiftRef.current
      reflowShift.clear()
      wrapGeom.forEach((wrapped, code) => {
        const rest = atRestGeom.get(code)
        if (!rest) return
        reflowShift.set(code, {
          dx: wrapped.textCenterX - rest.textCenterX,
          dy: wrapped.textCenterY - rest.textCenterY,
        })
      })

      // Radar axis label positions on the `labelR` ring. Angle index must
      // follow OUTCOME_CODE_ORDER (the order the shared radar geometry walks).
      // `activeItems` is re-ordered, so rebuild a radar-order list here or
      // labels land on the wrong axis.
      const radarOrderCodes = OUTCOME_CODE_ORDER.filter((code) =>
        activeItems.some((it) => it.code === code),
      )
      const Nr = radarOrderCodes.length
      const delta = radarLabelDeltaRef.current
      delta.clear()
      // Real landed bottom edge of whichever label ends up lowest on the
      // ring, measured from its own rect rather than guessed from a
      // formula + padding - a label two lines tall lands lower than its
      // own center by more than a single-line one would.
      let radarLabelMaxBottom = 0
      if (Nr > 0) {
        for (let i = 0; i < Nr; i++) {
          const code = radarOrderCodes[i]!
          const wrapped = wrapGeom.get(code)
          if (!wrapped) continue
          const angle = radarVertexAngle(i, Nr)
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy + labelR * Math.sin(angle)
          delta.set(code, {
            dx: lx - wrapped.textCenterX,
            dy: ly - wrapped.textCenterY,
          })
          radarLabelMaxBottom = Math.max(
            radarLabelMaxBottom,
            ly + wrapped.textHeight / 2,
          )
        }
      }

      // Heatmap y-axis label positions. Frame comes from the shared
      // `computeHeatmapColumnFrame` so labels stay aligned with the cells in
      // `OutcomeMorphOverlay`. Labels right-align to `labelRightX`, so only
      // the left edge, row height, and top of the grid matter here.
      const {
        cellH: heatCellH,
        columnTop: heatColumnTop,
        labelRightX: targetRightX,
      } = computeHeatmapColumnFrame(panelW, panelH, Nr, 0)
      const heatmap = heatmapLabelDeltaRef.current
      const heatmapMaxW = heatmapLabelMaxWRef.current
      heatmap.clear()
      heatmapMaxW.clear()
      // Real landed bottom edge of whichever heatmap label ends up
      // lowest, measured the same way as radarLabelMaxBottom above.
      let heatmapLabelMaxBottom = 0
      if (Nr > 0) {
        wrapStateByCode.forEach(({ boxEl }) => {
          boxEl.style.transform = ""
        })
        for (let i = 0; i < Nr; i++) {
          const code = radarOrderCodes[i]!
          const targetCenterY = heatmapCellCenterY(heatColumnTop, heatCellH, i)
          const state = wrapStateByCode.get(code)
          if (!state) continue
          const { textEl, boxEl } = state
          // Measure in the final wrapped state, then revert. `dx`/`dy` land
          // the wrapped block's right edge + center on the targets.
          const prevJ = boxEl.style.justifyContent
          const prevWhite = textEl.style.whiteSpace
          const prevAlign = textEl.style.textAlign
          const prevMax = textEl.style.maxWidth
          const prevOW = textEl.style.overflowWrap
          const prevColor = textEl.style.color
          // Uniform max-width (the reserved label column) so every label
          // wraps the same regardless of its starting flex cell.
          const maxW = HEAT_LABEL_COL_W
          heatmapMaxW.set(code, maxW)
          boxEl.style.justifyContent = "flex-end"
          textEl.style.whiteSpace = "normal"
          textEl.style.textAlign = "right"
          textEl.style.maxWidth = `${maxW}px`
          textEl.style.overflowWrap = "break-word"
          textEl.style.color = theme.palette.text.primary
          const rH = textEl.getBoundingClientRect()
          const cye = (rH.top + rH.bottom) / 2 - rootRect.top
          heatmap.set(code, {
            dx: targetRightX - (rH.right - rootRect.left),
            dy: targetCenterY - cye,
          })
          heatmapLabelMaxBottom = Math.max(
            heatmapLabelMaxBottom,
            targetCenterY + rH.height / 2,
            // The colored cell (fixed ~44px, see computeHeatmapColumnFrame)
            // is usually taller than its row label's own text - without
            // this, the last row's cell rendered a few px past where we'd
            // sized the panel to.
            targetCenterY + heatCellH / 2,
          )
          boxEl.style.justifyContent = prevJ
          textEl.style.whiteSpace = prevWhite
          textEl.style.textAlign = prevAlign
          textEl.style.maxWidth = prevMax
          textEl.style.overflowWrap = prevOW
          textEl.style.color = prevColor
        }
        wrapStateByCode.forEach(({ boxEl, prevBoxTransform }) => {
          boxEl.style.transform = prevBoxTransform
        })
      }

      // Bottom breathing room, matching BeatTextOverlay's `pt: 6` (48px) top
      // padding so the panel reads as evenly padded top-and-bottom, not
      // clipped tight to the last label/cell.
      const CONTENT_BOTTOM_BUFFER = 48
      radarContentHeightRef.current =
        radarLabelMaxBottom + CONTENT_BOTTOM_BUFFER
      heatmapContentHeightRef.current =
        heatmapLabelMaxBottom + CONTENT_BOTTOM_BUFFER

      const v = progress.get()
      const phase: "tall" | "radar" | "heatmap" =
        v < RADAR_SLIDE_START
          ? "tall"
          : v < HEATMAP_TAKEOVER
            ? "radar"
            : "heatmap"
      contentHeightPhaseRef.current = phase
      const measuredContentHeight =
        phase === "tall"
          ? tallContentHeightRef.current
          : phase === "radar"
            ? radarContentHeightRef.current
            : heatmapContentHeightRef.current
      onContentHeightChange?.(measuredContentHeight)

      // Sync the white backdrop's height to the *actual* content for this
      // phase, not the fixed scroll viewport - they're siblings (nesting
      // would z-index-conflict with the SVG overlay), so copy the height
      // instead of nesting.
      const backdrop = beat2PanelRef.current
      if (backdrop) {
        backdrop.style.height = `${measuredContentHeight}px`
      }

      // A resize (e.g. sidebar toggle) just recomputed radar/heatmap label
      // deltas above, but the transform that actually places labels only
      // runs on scroll ticks. Re-invoke it now with the current progress so
      // labels snap to their new position immediately instead of sitting
      // stale until the next scroll.
      latestNarrationFrameRef.current(progress.get())
    }

    const ro = new ResizeObserver(() => {
      measure()
    })

    ro.observe(root)
    ro.observe(panel)
    placeholderRefsMap.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    titleRefsMap.current.forEach((el) => {
      if (el) ro.observe(el)
    })
    measure()

    return () => ro.disconnect()
  }, [
    onGlyphLayoutChange,
    beat2Layout,
    heatmapExtraColumnCount,
    theme,
    onContentHeightChange,
    progress,
  ])

  return {
    panelRootRef,
    rightColumnRootRef,
    beat2PanelRef,
    titleRefsMap,
    placeholderRefsMap,
    captionRefsMap,
    eyebrowRefs,
    gridWrapperRef,
  }
}
