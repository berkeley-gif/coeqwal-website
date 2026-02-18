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

  const firstOpacity = useScrollValue(progress, [0.05, 0.15], [0, 1])
  const firstY = useScrollValue(progress, [0.05, 0.15], [40, 0])

  const secondOpacity = useScrollValue(progress, [0.2, 0.3], [0, 1])
  const secondY = useScrollValue(progress, [0.2, 0.3], [40, 0])

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
          Sticky Section
        </Typography>
        <Typography variant="body1">
          This paragraph fades in and slides up as you scroll through the sticky
          section. The content stays pinned while scroll progress drives the
          animation.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: secondOpacity, y: secondY }}>
        <Typography variant="body1">
          A second paragraph appears shortly after, demonstrating staggered
          scroll-linked animations. Both elements share the same scroll runway
          but enter at different progress points.
        </Typography>
      </motion.div>

      <motion.div style={{ opacity: exitOpacity }}>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Everything fades out together near the end of the section.
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
    >
      <Content />
    </StickyScrollSection>
  )
}
