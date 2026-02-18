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
          Side Effect Section
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: firstOpacity }}>
        <Typography variant="body1">
          As you scroll through this section, map markers appear and disappear
          at specific progress thresholds.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: secondOpacity }}>
        <Typography variant="body1">
          This demonstrates the useScrollSideEffect hook for triggering
          imperative actions from scroll progress. The markers appear at 30%
          progress and disappear when you scroll back.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: exitOpacity }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Scroll past this section to continue.
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
