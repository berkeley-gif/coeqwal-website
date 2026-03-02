"use client"

/**
 * 03SideEffectExample - Advanced pattern: scroll-linked + imperative side effects
 *
 * Combines StickyScrollSection with useScrollSideEffect to trigger
 * imperative actions (like map layer changes) at specific scroll
 * thresholds, while also driving visual animations from progress.
 */

import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
  useScrollSideEffect,
} from "@repo/scrollytelling"
import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"
import useStoryStore from "../../store"
import type { MarkerPoint } from "../../store"

const EXAMPLE_MARKERS: MarkerPoint[] = [
  { longitude: -121.5, latitude: 38.5, label: "Sacramento" },
  { longitude: -118.25, latitude: 34.05, label: "Los Angeles" },
]

function Content() {
  const progress = useScrollProgress()
  const setMarkers = useStoryStore((s) => s.setMarkers)

  const titleOpacity = useScrollValue(progress, [0.05, 0.15], [0, 1])
  const firstOpacity = useScrollValue(progress, [0.15, 0.25], [0, 1])
  const secondOpacity = useScrollValue(progress, [0.4, 0.5], [0, 1])
  const exitOpacity = useScrollValue(progress, [0.85, 0.95], [1, 0])

  useScrollSideEffect(progress, [
    {
      at: 0.3,
      enter: () => setMarkers(EXAMPLE_MARKERS, "text"),
      exit: () => setMarkers([], ""),
    },
  ])

  return (
    <Box
      className="text-section"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <motion.div style={{ opacity: titleOpacity }}>
        <Typography variant="h3" gutterBottom>
          useScrollSideEffect
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: firstOpacity }}>
        <Typography variant="body1">
          Not everything is a CSS animation. Map layer changes, store updates,
          and D3 transitions need to be triggered imperatively — at a specific
          scroll threshold, not interpolated continuously.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: secondOpacity }}>
        <Typography variant="body1">
          <code>useScrollSideEffect</code> fires <code>enter</code> when
          progress crosses 0.3 forward, and <code>exit</code> when it crosses
          back. Watch the map: two markers appear at that threshold, and
          disappear when you scroll back up.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: exitOpacity }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          One hook. Bidirectional. No manual scroll direction tracking.
        </Typography>
      </motion.div>
    </Box>
  )
}

export default function SideEffectExample() {
  return (
    <StickyScrollSection
      id="side-effect-demo"
      height="200vh"
      offset={["start end", "end start"]}
    >
      <Content />
    </StickyScrollSection>
  )
}
