"use client"

/* Narration: the storyboard's left column
 *
 * The page title, pre-play gate, per-beat prose, and the control row.
 * Edit narration copy and intro timing here. Rendered by BeatTextOverlay.
 */

import { useRef, useEffect } from "react"
import {
  Box,
  Typography,
  useTheme,
  alpha,
  IconButton,
  PlayArrowIcon,
} from "@repo/ui/mui"
import { motion, AnimatePresence } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { PARAGRAPH_FADE_SEC } from "./animationTiming"
import StoryboardControls from "./StoryboardControls"

/* Narration copy, one entry per beat (0-based). Edit wording here. Each
 * beat's paragraphs cross-fade to the next beat's. `{scenario}` is
 * filled in at render. Beat 0 is empty because its intro + tier legend
 * are rendered separately below. */
const NARRATION_BY_BEAT: readonly (readonly string[])[] = [
  [], // [0] intro + tier legend, rendered separately
  [
    "For example, each colored location on the map represents an agricultural water district in the Central Valley receiving surface water deliveries.",
    "The colors correspond to different water delivery outcome levels that affect agricultural revenue, ranging from optimal levels (blue) to critical levels (red).",
  ],
  [
    "These are the outcomes for the {scenario}. Each location becomes a square colored by its outcome level, and together they form a distribution view showing agricultural revenue across the Central Valley districts in CalSim at a glance.",
  ],
  [
    "For each scenario, outcome levels are calculated for all key outcomes across locations.",
  ],
  [
    "Outcomes can be displayed in different ways. The distribution view displays outcomes at individual locations of interest.",
    "Locations of interest can be selected on the map or from the chart.",
  ],
  ["The list view summarizes key outcomes as bar charts."],
  [
    "The radar chart displays the average values of key outcomes on a circular plot and is useful for scenario comparison.",
  ],
  [
    "The heat map displays how key outcomes change under different hydroclimate futures.",
  ],
] as const

/* Beat 0 opening reveal (seconds). The two intro paragraphs and the
 * tier legend each start at a staggered delay. */
const INTRO_FADE_SEC = 4.0
const INTRO_P1_DELAY = 0.4
const INTRO_P2_DELAY = 1.8
const INTRO_LEGEND_DELAY = 3.2

/* Beat 0 to 1 hand-off (seconds), two ordered phases: the intro text
 * fades out, then the block collapses so the legend slides to the top.
 * The return reverses it. The beat 1 prose waits for both phases. */
const INTRO_EXIT_FADE_SEC = PARAGRAPH_FADE_SEC
const INTRO_COLLAPSE_SEC = 0.9

interface NarrationProps {
  headingOpacity: MotionValue<number>
  /** Opacity of the body block. The parent fades it 1 to 0 on
   *  Back-from-first-beat. Defaults to 1. */
  backOutOpacity?: MotionValue<number>
  /** 0-based storyboard cursor. */
  beatIndex: number
  /** Storyboard length. */
  totalBeats: number
  /** False shows the pre-play Play gate. True shows the controls and body. */
  hasPlayed: boolean
  /** When true (e.g. reduced motion), hide controls and let the body
   *  scroll so the end-state content stays reachable. */
  hideControls: boolean
  textHidden: boolean
  /** The "<name> scenario" label, used in the Beat 2 narration. */
  scenarioLabel: string
  onPlay?: () => void
  onNext?: () => void
  onBack?: () => void
  onRestart?: () => void
}

/* Left column of the storyboard panel: page title, pre-play gate,
 * subtitle, the per-beat narration body (intro + tier legend on beat 0,
 * then prose), and the bottom control row. Everything here is driven by
 * `beatIndex` (a per-beat cross-fade), not by the continuous progress
 * clock. */
export default function Narration({
  headingOpacity,
  backOutOpacity,
  beatIndex,
  totalBeats,
  hasPlayed,
  hideControls,
  textHidden,
  scenarioLabel,
  onPlay,
  onNext,
  onBack,
  onRestart,
}: NarrationProps) {
  const theme = useTheme()
  const padding = theme.space.panel.padding
  const textColor = theme.palette.undertone.warm
  const shadow = theme.textShadow.displayBody

  // True once the user has advanced past beat 0 this play, so the intro
  // can distinguish its first reveal (instant) from a return (animated
  // reverse). Reset on leaving playback so a replay starts fresh.
  const hasAdvancedRef = useRef(false)
  useEffect(() => {
    if (!hasPlayed) {
      hasAdvancedRef.current = false
    } else if (beatIndex >= 1) {
      hasAdvancedRef.current = true
    }
  }, [hasPlayed, beatIndex])

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: "33.33%",
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        pt: padding,
        px: padding,
        pb: padding,
      }}
    >
      {/* Heading + pre-play gate (matches the ContentPanel heading). */}
      <motion.div
        style={{
          opacity: headingOpacity,
          display: "flex",
          alignItems: "center",
          gap: "12px",
          pointerEvents: "none",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h4"
          component="h4"
          fontWeight={300}
          color="text.secondary"
        >
          Visualizing key outcomes
        </Typography>
        {!hideControls && !hasPlayed && (
          /* Pre-play gate: the inline Play button beside the title. The
           *  rest of the storyboard chrome (Back | N-of-T | Next) appears
           *  once the user clicks Play. */
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pointerEvents: "auto",
            }}
          >
            <IconButton
              onClick={onPlay}
              size="small"
              aria-label="Play"
              sx={{
                width: 44,
                height: 44,
                backgroundColor: alpha(theme.palette.common.white, 0.2),
                backdropFilter: "blur(8px)",
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.white, 0.35),
                },
              }}
            >
              <PlayArrowIcon sx={{ fontSize: 24 }} />
            </IconButton>
          </Box>
        )}
      </motion.div>

      <motion.div style={{ opacity: headingOpacity, flexShrink: 0 }}>
        {/* Subtitle shows during the intro (beat 0) and fades out once
            the storyboard advances, leaving just the page title. */}
        <AnimatePresence>
          {beatIndex === 0 && (
            <motion.div
              key="subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: PARAGRAPH_FADE_SEC }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: "66%", opacity: 0.85 }}
              >
                How are scenario results measured?
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Body: intro + tier legend (beat 0) and the per-beat prose, all
       *  keyed to `beatIndex`. Shown once the user starts (or always, in
       *  reduced motion). */}
      {(hasPlayed || hideControls) && !textHidden && (
        <motion.div
          style={{
            opacity: backOutOpacity ?? 1,
            width: "100%",
            ...(hideControls
              ? {
                  flex: 1,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                }
              : {}),
          }}
        >
          <Box
            sx={{
              mt: theme.space.section.sm,
              width: "100%",
              maxWidth: theme.space.paragraphMaxWidth.compact,
              ...(hideControls && {
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                pointerEvents: "auto",
                pr: 1,
              }),
              "& .MuiTypography-root": {
                color: textColor,
                textShadow: shadow,
              },
            }}
          >
            {/* Intro paragraphs (beat 0 only). In normal flow above the
                legend, so animating its height reflows the legend smoothly.
                `hidden` = text fades out then height collapses (legend up);
                `visible` reverses it after waiting for the beat 1 prose to
                clear. First reveal mounts straight to `visible`
                (`initial={false}`); `hasAdvancedRef` enables the animated
                entrance only on a return from beat 1. */}
            <AnimatePresence>
              {beatIndex === 0 && (
                <motion.div
                  key="intro"
                  initial={hasAdvancedRef.current ? "hidden" : false}
                  animate="visible"
                  exit="hidden"
                  variants={{
                    visible: {
                      height: "auto",
                      opacity: 1,
                      transition: {
                        height: {
                          duration: INTRO_COLLAPSE_SEC,
                          delay: PARAGRAPH_FADE_SEC,
                          ease: "easeInOut",
                        },
                        opacity: {
                          duration: INTRO_EXIT_FADE_SEC,
                          delay: PARAGRAPH_FADE_SEC + INTRO_COLLAPSE_SEC,
                          ease: "easeOut",
                        },
                      },
                    },
                    hidden: {
                      height: 0,
                      opacity: 0,
                      transition: {
                        opacity: {
                          duration: INTRO_EXIT_FADE_SEC,
                          ease: "easeOut",
                        },
                        height: {
                          duration: INTRO_COLLAPSE_SEC,
                          delay: INTRO_EXIT_FADE_SEC,
                          ease: "easeInOut",
                        },
                      },
                    },
                  }}
                  style={{ overflow: "hidden" }}
                >
                  {/* Paragraphs stagger-fade only on the first reveal. On a
                      return they mount opaque and the outer block handles
                      the fade. */}
                  <Box sx={{ pb: 2.5 }}>
                    <motion.div
                      initial={hasAdvancedRef.current ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: INTRO_FADE_SEC,
                        delay: INTRO_P1_DELAY,
                        ease: "easeOut",
                      }}
                    >
                      <Typography variant="body2" component="p">
                        Different scenarios change how water is allocated among
                        different users and the environment.
                      </Typography>
                    </motion.div>
                    <motion.div
                      initial={hasAdvancedRef.current ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: INTRO_FADE_SEC,
                        delay: INTRO_P2_DELAY,
                        ease: "easeOut",
                      }}
                    >
                      <Typography variant="body2" component="p" sx={{ mt: 2 }}>
                        To compare results on a common scale, we group key
                        outcomes into levels:
                      </Typography>
                    </motion.div>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tier legend. Fades in on start and persists. Each row is a
                subgrid row so swatch | badge | description stay aligned. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: INTRO_FADE_SEC,
                delay: INTRO_LEGEND_DELAY,
                ease: "easeOut",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto auto 1fr",
                  columnGap: 1.5,
                  rowGap: 1,
                  alignItems: "center",
                  "& .MuiTypography-root": {
                    fontSize: theme.typography.body2.fontSize,
                    lineHeight: 1.25,
                  },
                }}
              >
                {(
                  [
                    {
                      color: theme.palette.tiers.tier1,
                      label: "Optimal",
                      description:
                        "Water supplies support strong, desired system performance.",
                    },
                    {
                      color: theme.palette.tiers.tier2,
                      label: "Acceptable",
                      description:
                        "Water supply shortages occur, but impacts remain manageable.",
                    },
                    {
                      color: theme.palette.tiers.tier3,
                      label: "At risk",
                      description:
                        "Water supply shortages lead to significant impacts.",
                    },
                    {
                      color: theme.palette.tiers.tier4,
                      label: "Critical",
                      description:
                        "Severe water supply shortages threaten long-term viability.",
                    },
                  ] as const
                ).map(({ color, label, description }) => (
                  <Box
                    key={label}
                    sx={{
                      display: "grid",
                      gridColumn: "1 / -1",
                      gridTemplateColumns: "subgrid",
                      alignItems: "center",
                      columnGap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 0.5,
                        backgroundColor: color,
                        flexShrink: 0,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    />
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: theme.borderRadius.md,
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifySelf: "start",
                      }}
                    >
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          fontWeight: 500,
                          textShadow: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" component="span">
                      {description}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>

            {/* Per-beat prose below the legend. Entering beat 1, the
                fade-in waits for the intro's exit (fade + collapse) so it
                appears only once the legend settles; other beats fade in
                at once. Exit always fades out immediately, so Back clears
                the prose before the intro expands the legend back down. */}
            <AnimatePresence mode="wait">
              {(NARRATION_BY_BEAT[beatIndex]?.length ?? 0) > 0 && (
                <motion.div
                  key={beatIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{
                    opacity: 0,
                    transition: { duration: PARAGRAPH_FADE_SEC },
                  }}
                  transition={{
                    duration: PARAGRAPH_FADE_SEC,
                    delay:
                      beatIndex === 1
                        ? INTRO_EXIT_FADE_SEC + INTRO_COLLAPSE_SEC
                        : 0,
                  }}
                >
                  <Box sx={{ pt: 2.5 }}>
                    {NARRATION_BY_BEAT[beatIndex]!.map((para, i) => (
                      <Typography
                        key={i}
                        variant="body2"
                        component="p"
                        sx={i > 0 ? { mt: 1.5 } : undefined}
                      >
                        {para.replace("{scenario}", scenarioLabel)}
                      </Typography>
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      )}

      {!hideControls && hasPlayed && (
        <StoryboardControls
          beatIndex={beatIndex}
          totalBeats={totalBeats}
          onBack={onBack}
          onNext={onNext}
          onRestart={onRestart}
        />
      )}
    </Box>
  )
}
