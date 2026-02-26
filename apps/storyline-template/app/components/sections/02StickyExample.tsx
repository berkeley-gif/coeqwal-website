"use client"

/**
 * 02StickyExample - Most common pattern: sticky container with scroll-linked animations
 *
 * Uses StickyScrollSection to pin content while the user scrolls through
 * a tall runway. Children access scroll progress via useScrollProgress()
 * context — no manual useScroll wiring needed.
 *
 * The `overlap` prop pulls the next section closer, reducing visual gaps
 * between sections without shortening the scroll runway.
 */

import {
  StickyScrollSection,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"
import { motion } from "@repo/motion"
import { Box, Typography } from "@repo/ui/mui"

function Content() {
  const progress = useScrollProgress()

  const firstOpacity = useScrollValue(progress, [0.05, 0.2], [0, 1])
  const firstY = useScrollValue(progress, [0.05, 0.2], [40, 0])

  const secondOpacity = useScrollValue(progress, [0.25, 0.4], [0, 1])
  const secondY = useScrollValue(progress, [0.25, 0.4], [40, 0])

  const exitOpacity = useScrollValue(progress, [0.8, 0.95], [1, 0])

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
      <motion.div style={{ opacity: firstOpacity, y: firstY }}>
        <Typography variant="h3" gutterBottom>
          StickyScrollSection
        </Typography>
        <Typography variant="body1">
          The outer element is a tall scroll runway. The inner element is{" "}
          <code>position: sticky</code>. Children call{" "}
          <code>useScrollProgress()</code> to read a 0→1 value — watch the debug
          overlay (top right) as you scroll.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: secondOpacity, y: secondY }}>
        <Typography variant="body1">
          <code>useScrollValue(progress, [0.25, 0.4], [0, 1])</code>
          <br />
          This line maps progress 0.25–0.40 to opacity 0–1. Each element gets
          its own input range, so staggered reveals need no timers or delays —
          just different numbers.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: exitOpacity }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Exit range [0.8, 0.95] → all content fades out together.
        </Typography>
      </motion.div>
    </Box>
  )
}

export default function StickyExample() {
  return (
    <StickyScrollSection
      id="sticky-demo"
      height="250vh"
      offset={["start end", "end start"]}
      overlap="20vh"
      debug
    >
      <Content />
    </StickyScrollSection>
  )
}
