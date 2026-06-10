"use client"

/* StoryboardControls: the Back, count, Next, Restart row
 *
 * The navigation buttons under the narration. Calls the handlers
 * TierAnimationSection passes down. Hidden under reduced motion.
 */

import {
  Typography,
  useTheme,
  alpha,
  ChevronLeftIcon,
  ChevronRightIcon,
  IconButton,
  ReplayIcon,
} from "@repo/ui/mui"
import { motion } from "@repo/motion"

interface StoryboardControlsProps {
  /* 0-based beat index */
  beatIndex: number
  /** Total number of beats in the storyboard. */
  totalBeats: number
  onBack?: () => void
  onNext?: () => void
  onRestart?: () => void
}

/* Bottom control row: Back | N-of-T | Next, plus Restart past beat 0
 *
 * Buttons are never disabled mid-tween (a click stops the running tween
 * and jumps, see `goTo` in `TierAnimationSection`). The only disabled
 * case is Next on the final beat. */
export default function StoryboardControls({
  beatIndex,
  totalBeats,
  onBack,
  onNext,
  onRestart,
}: StoryboardControlsProps) {
  const theme = useTheme()

  const atStart = beatIndex <= 0
  const atEnd = beatIndex >= totalBeats - 1

  const pillBg = alpha(theme.palette.common.white, 0.2)
  const pillHoverBg = alpha(theme.palette.common.white, 0.35)
  const pillDisabledBg = alpha(theme.palette.common.white, 0.08)
  const controlSx = {
    width: 44,
    height: 44,
    backgroundColor: pillBg,
    backdropFilter: "blur(8px)",
    color: "text.secondary",
    "&:hover": { backgroundColor: pillHoverBg },
    "&.Mui-disabled": {
      backgroundColor: pillDisabledBg,
      color: alpha(theme.palette.text.secondary, 0.35),
    },
  } as const

  return (
    <motion.div
      style={{
        position: "absolute",
        top: 600,
        left: "16.6667vw",
        transform: "translateX(-50%)",
        display: "flex",
        gap: theme.spacing(0.75),
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "auto",
        opacity: 1,
      }}
    >
      <IconButton
        onClick={onBack}
        size="small"
        aria-label={atStart ? "Back to intro" : "Previous beat"}
        sx={controlSx}
      >
        <ChevronLeftIcon sx={{ fontSize: 24 }} />
      </IconButton>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          minWidth: 32,
          textAlign: "center",
          fontVariantNumeric: "tabular-nums",
          opacity: 0.7,
          userSelect: "none",
        }}
      >
        {beatIndex + 1} / {totalBeats}
      </Typography>
      <IconButton
        onClick={onNext}
        size="small"
        aria-label="Next beat"
        disabled={atEnd}
        sx={controlSx}
      >
        <ChevronRightIcon sx={{ fontSize: 24 }} />
      </IconButton>
      {!atStart && (
        <IconButton
          onClick={onRestart}
          size="small"
          aria-label="Restart storyboard (Home)"
          sx={{
            ...controlSx,
            width: 36,
            height: 36,
            ml: 1,
            backgroundColor: alpha(theme.palette.common.white, 0.15),
          }}
        >
          <ReplayIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </motion.div>
  )
}
