"use client"

/* ──────────────────────────────────────────────────────────────
 * BeatTextOverlay: the storyboard panel that floats over the map
 *
 * This file owns the panel shell and the
 * right-column graphics. The heavy lifting lives in three siblings:
 *
 *   - Narration.tsx, the whole left column (page title,
 *       pre-play gate, subtitle, per-beat prose, control row). Edit
 *       narration COPY and intro TIMING there.
 *   - StoryboardControls.tsx, the Back | N-of-T | Next | Restart row.
 *   - useOutcomeLabelGeometry, all the per-frame label math for the
 *       right column (outcome titles, captions, radar/heatmap label
 *       positions, column eyebrows). Edit GEOMETRY there.
 *
 * What is here: the absolutely-positioned panel, the right-third
 * backdrop, the scenario-name header, the view-mode header, and the
 * two-column outcome grid whose DOM the geometry hook measures.
 * ────────────────────────────────────────────────────────────── */

import { useRef, type RefObject } from "react"
import {
  Box,
  Typography,
  useTheme,
  alpha,
  ArrowForwardIcon,
} from "@repo/ui/mui"
import { motion, AnimatePresence, useTransform } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import type { EncodingMode } from "./OutcomeMorphOverlay"
import {
  PARAGRAPH_FADE_SEC,
  BACKDROP_FADE_IN_PROGRESS,
  BACKDROP_FADE_IN_WIDTH,
} from "./animationTiming"
import type { Beat2Layout, GlyphRect } from "./overlayTypes"
import { useOutcomeLabelGeometry } from "./useOutcomeLabelGeometry"
import Narration from "./Narration"

export type { GlyphRect } from "./overlayTypes"

/* Right-panel view-mode header shown for beats 4-7 (distribution, list,
 * radar, heat map). Earlier beats have no view-mode header. */
const VIEW_MODE_HEADER_BY_BEAT: Record<number, string> = {
  4: "Distribution view",
  5: "List view",
  6: "Radar chart",
  7: "Heat map",
}

/** Pixels the right column is lifted above the panel's top padding, so
 *  it and the SVG (lifted by `STORYBOARD_VISUAL_LIFT_PX`) read as one
 *  block and fit vertically. */
const OVERLAY_TOP_LIFT_PX = 30

interface BeatTextOverlayProps {
  progress: MotionValue<number>
  /** Bridge into `NarrationArbiter`, handed straight to the geometry
   *  hook, which writes its per-frame dispatcher into `.current`. See
   *  `engine/arbiters/NarrationArbiter.ts`. */
  narrationTickRef: RefObject<((v: number) => void) | null>
  headingOpacity: MotionValue<number>
  /** Opacity of the whole left-panel narration block. The parent fades it
   *  1 to 0 on Back-from-first-beat. Defaults to 1. */
  backOutOpacity?: MotionValue<number>
  /** Storyboard navigation. `beatIndex` is a 0-based cursor and `totalBeats`
   *  is the length. When `hasPlayed` is false the pre-play Play gate shows,
   *  when true the bottom control row shows. */
  beatIndex?: number
  totalBeats?: number
  hasPlayed?: boolean
  onPlay?: () => void
  onNext?: () => void
  onBack?: () => void
  onRestart?: () => void
  /** When true (e.g. reduced motion), hide the controls and let the
   *  narration body scroll so the end-state content stays reachable. */
  hideControls?: boolean
  beat2Layout?: Beat2Layout | null
  selectedOutcomeCode?: string | null
  interactive?: boolean
  textHidden?: boolean
  scenarioId?: string
  scenarioName?: string
  scenarioDescription?: string
  encodingMode?: EncodingMode
  onEncodingChange?: (mode: EncodingMode) => void
  onAddLocation?: () => void
  /** Per-outcome Beat 2 morph window: `start` drives the title fade-in,
   *  `end` the caption. Forwarded to the geometry hook. */
  outcomeMorphWindows?: Record<string, { start: number; end: number }>
  /** Forwarded to the geometry hook, which reports glyph landing rects
   *  to the SVG morph overlay. */
  onGlyphLayoutChange?: (layout: Record<string, GlyphRect>) => void
  /** Extra heatmap columns beyond the primary one (so labels
   *  anchor to the leftmost column). Defaults to 0. */
  heatmapExtraColumnCount?: number
}

export default function BeatTextOverlay({
  progress,
  narrationTickRef,
  headingOpacity,
  backOutOpacity,
  beatIndex = 0,
  totalBeats = 1,
  hasPlayed = false,
  onPlay,
  onNext,
  onBack,
  onRestart,
  beat2Layout,
  selectedOutcomeCode,
  interactive,
  textHidden = false,
  scenarioName,
  onAddLocation,
  outcomeMorphWindows,
  onGlyphLayoutChange,
  hideControls = false,
  heatmapExtraColumnCount = 0,
}: BeatTextOverlayProps) {
  const theme = useTheme()

  // "<name> scenario" label, shared by the right-column header and the
  // Beat 2 narration. Falls back before the scenarios query resolves.
  const displayScenarioLabel = scenarioName
    ? `${scenarioName} scenario`
    : "Current operations scenario"

  // Scenario-name header fades in on the same progress ramp as the white
  // right-panel backdrop so the text and the panel appear together.
  const scenarioHeaderOpacity = useTransform(
    progress,
    [
      BACKDROP_FADE_IN_PROGRESS,
      BACKDROP_FADE_IN_PROGRESS + BACKDROP_FADE_IN_WIDTH,
    ],
    [0, 1],
  )

  // All per-frame label math + the DOM refs the right column attaches.
  const {
    panelRootRef,
    rightColumnRootRef,
    beat2PanelRef,
    titleRefsMap,
    placeholderRefsMap,
    captionRefsMap,
    eyebrowRefs,
  } = useOutcomeLabelGeometry({
    progress,
    narrationTickRef,
    beat2Layout,
    outcomeMorphWindows,
    onGlyphLayoutChange,
    heatmapExtraColumnCount,
  })

  // Kept live because its JSX (the "Add a location to track" CTA) is
  // preserved behind a `{false && ...}` guard below for future reuse.
  const addLocationCtaRef = useRef<HTMLDivElement>(null)

  const padding = theme.space.panel.padding

  return (
    <Box
      ref={panelRootRef}
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* Left column: page title, narration body, and control row. */}
      <Narration
        headingOpacity={headingOpacity}
        backOutOpacity={backOutOpacity}
        beatIndex={beatIndex}
        totalBeats={totalBeats}
        hasPlayed={hasPlayed}
        hideControls={hideControls}
        textHidden={textHidden}
        scenarioLabel={displayScenarioLabel}
        onPlay={onPlay}
        onNext={onNext}
        onBack={onBack}
        onRestart={onRestart}
      />

      {/* White backdrop on the right third. Its height is synced to the
       * content column by the geometry hook. Sits at `zIndex: 3` (below
       * the SVG overlay) so the squares render on top of it, not washed
       * out beneath the semi-opaque white. */}
      <Box
        ref={beat2PanelRef}
        sx={{
          position: "absolute",
          top: `calc(${padding} - ${OVERLAY_TOP_LIFT_PX}px)`,
          right: 0,
          width: "33.33%",
          height: 0,
          zIndex: 3,
          backgroundColor: alpha(theme.palette.common.white, 0.75),
          borderRadius: 2,
          opacity: 0,
          // Solid to pointer events while interactive so that, when the
          // storyboard region lets events fall through to the map, dragging
          // on the panel doesn't pan the map behind it.
          pointerEvents: interactive ? "auto" : "none",
        }}
      />

      {/* Right-third content column. Left edge at `panelWidth * 2/3`,
       * matching the SVG overlay's `pos.x` origin. Auto-sizes to its
       * content (the grid rows have explicit heights). */}
      <Box
        ref={rightColumnRootRef}
        sx={{
          position: "absolute",
          top: `calc(${padding} - ${OVERLAY_TOP_LIFT_PX}px)`,
          right: 0,
          width: "33.33%",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          pt: 2.5,
          pb: 2,
          "& .MuiTypography-root": {
            color: theme.palette.text.primary,
          },
        }}
      >
        {/* Scenario-name header. Fades in with the right-panel backdrop
            and holds for the rest of the storyboard. */}
        <motion.div
          style={{
            opacity: scenarioHeaderOpacity,
            flexShrink: 0,
            pointerEvents: "none",
          }}
        >
          <Box sx={{ px: 3, pb: 0.75, minHeight: 20 }}>
            <Typography
              variant="overline"
              component="h3"
              color="text.secondary"
              sx={{ letterSpacing: "0.08em", lineHeight: 1.3 }}
            >
              {displayScenarioLabel}
            </Typography>
          </Box>
        </motion.div>

        {/* Two-column outcome grid. Each row stacks Title, glyph
         *  placeholder, Caption. The geometry hook measures and animates
         *  these via the refs attached below. */}
        {beat2Layout && (
          <Box sx={{ position: "relative" }}>
            {/* View-mode header (beats 4-7), absolutely positioned over
             *  the eyebrow slot so it doesn't shift the glyph layout. */}
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                pt: 1.5,
                px: 3,
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              <AnimatePresence mode="wait">
                {VIEW_MODE_HEADER_BY_BEAT[beatIndex] && (
                  <motion.div
                    key={beatIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: PARAGRAPH_FADE_SEC }}
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 0,
                      right: 0,
                      paddingLeft: 24,
                      paddingRight: 24,
                      textAlign: "left",
                    }}
                  >
                    <Typography variant="overline" component="p">
                      {VIEW_MODE_HEADER_BY_BEAT[beatIndex]}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: "12px",
                px: 3,
                pt: 1.5,
              }}
            >
              {[0, 1].map((col) => (
                <Box
                  key={col}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    rowGap: 1.5,
                  }}
                >
                  {beat2Layout.eyebrows[col] && (
                    <Box
                      ref={(el: HTMLDivElement | null) => {
                        eyebrowRefs.current[col] = el
                      }}
                      sx={{ opacity: 0 }}
                    >
                      <Typography variant="smallSectionLabel" component="p">
                        {beat2Layout.eyebrows[col]!.label}
                      </Typography>
                    </Box>
                  )}
                  {beat2Layout.items
                    .filter((item) => item.column === col)
                    .map((item) => {
                      const isSelected = selectedOutcomeCode === item.code
                      const hasGlyph = item.isActive && item.targetHeight > 0
                      return (
                        <Box
                          key={item.code}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Box
                            ref={(el: HTMLDivElement | null) => {
                              titleRefsMap.current.set(item.code, el)
                            }}
                            sx={{
                              opacity: 0,
                              pointerEvents: "none",
                              borderRadius: 1,
                              px: 0.5,
                              mx: -0.5,
                              display: "flex",
                              alignItems: "center",
                              boxSizing: "border-box",
                              overflow: "hidden",
                              transition: "color 0.15s",
                            }}
                          >
                            <Typography
                              variant="axisLabel"
                              noWrap
                              sx={{
                                fontWeight: isSelected ? 700 : 500,
                                transition: "color 0.15s",
                                color: theme.palette.grey[900],
                                lineHeight: 1.2,
                              }}
                            >
                              {item.label}
                            </Typography>
                          </Box>
                          {hasGlyph && (
                            <>
                              {/* Transparent placeholder reserving the SVG
                               *  morph landing rect (measured by the
                               *  geometry hook). */}
                              <Box
                                ref={(el: HTMLDivElement | null) => {
                                  placeholderRefsMap.current.set(item.code, el)
                                }}
                                data-outcome-code={item.code}
                                sx={{
                                  width: "100%",
                                  height: `${item.targetHeight}px`,
                                  mt: "12px",
                                  pointerEvents: "none",
                                }}
                              />
                              <Box
                                ref={(el: HTMLDivElement | null) => {
                                  captionRefsMap.current.set(item.code, el)
                                }}
                                sx={{ opacity: 0, mt: "4px" }}
                              >
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: 11,
                                    lineHeight: 1.3,
                                    color: theme.palette.grey[700],
                                  }}
                                >
                                  {item.locationDescription}
                                </Typography>
                              </Box>
                            </>
                          )}
                        </Box>
                      )
                    })}
                  {/* eslint-disable-next-line no-constant-binary-expression */}
                  {col === 0 && false && (
                    /* "Add a location to track" CTA. Disabled per design
                     *  direction, kept in-source for future reuse. */
                    <Box
                      ref={addLocationCtaRef}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.6s ease",
                        pointerEvents: interactive ? "auto" : "none",
                        mt: "auto",
                        pt: 3,
                      }}
                    >
                      <Box
                        component="button"
                        type="button"
                        onClick={onAddLocation}
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: theme.palette.grey[600],
                          border: `1px solid ${theme.palette.grey[300]}`,
                          borderRadius: "4px",
                          background: "transparent",
                          textTransform: "none",
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          letterSpacing: "0.02em",
                          fontFamily: "inherit",
                          px: 1.25,
                          py: 0.125,
                          cursor: "pointer",
                          transition: "background 0.15s, border-color 0.15s",
                          "&:hover": {
                            backgroundColor: theme.palette.grey[100],
                            borderColor: theme.palette.grey[400],
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${theme.palette.blue.bright}`,
                            outlineOffset: "2px",
                          },
                        }}
                      >
                        Add a location to track
                        <ArrowForwardIcon sx={{ fontSize: "0.85rem" }} />
                      </Box>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
