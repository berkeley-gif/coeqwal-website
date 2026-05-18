"use client"

import { Box, Typography } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import {
  ScrollElement,
  ScrollSection,
  StickyElement,
  useScrollProgress,
  useScrollValue,
} from "@repo/scrollytelling"

const burdenItems = [
  { name: "Households", tag: "Higher bills", accent: 0.72 },
  { name: "Farms", tag: "Delivery cuts", accent: 0.58 },
  { name: "Rivers", tag: "Lower flows", accent: 0.46 },
] as const

const balanceItems = [
  { name: "Transparency", value: "Show who is affected" },
  { name: "Flexibility", value: "Adapt plans quickly" },
  { name: "Protection", value: "Shield the most exposed" },
] as const

function AnimatedMetricCard({
  item,
  start,
  end,
  progress,
}: {
  item: (typeof burdenItems)[number]
  start: number
  end: number
  progress: ReturnType<typeof useScrollProgress>
}) {
  const opacity = useScrollValue(progress, [start, end], [0, 1])
  const y = useScrollValue(progress, [start, end], [24, 0])
  const fill = useScrollValue(progress, [start, end], [0.08, item.accent])

  return (
    <motion.article className="metric-card" style={{ opacity, y }}>
      <Box className="metric-head">
        <span className="metric-name">{item.name}</span>
        <span className="metric-tag">{item.tag}</span>
      </Box>
      <Box className="metric-track">
        <motion.div className="metric-fill" style={{ scaleX: fill }} />
      </Box>
    </motion.article>
  )
}

function NarrativeCard({
  item,
  start,
  end,
  progress,
}: {
  item: (typeof balanceItems)[number]
  start: number
  end: number
  progress: ReturnType<typeof useScrollProgress>
}) {
  const opacity = useScrollValue(progress, [start, end], [0, 1])
  const y = useScrollValue(progress, [start, end], [20, 0])

  return (
    <motion.div className="balance-row" style={{ opacity, y }}>
      <Box>
        <div className="balance-label">{item.name}</div>
      </Box>
      <div className="balance-value">{item.value}</div>
    </motion.div>
  )
}

export function BurdenSection() {
  return (
    <ScrollSection id="burden" ariaLabel="Uneven burden section" height="240vh">
      <StickyElement top="15vh">
        <BurdenContent />
      </StickyElement>
    </ScrollSection>
  )
}

export function BalanceSection() {
  return (
    <ScrollSection
      id="balance"
      ariaLabel="Equitable planning section"
      height="220vh"
    >
      <StickyElement top="15vh">
        <BalanceContent />
      </StickyElement>
    </ScrollSection>
  )
}

function BurdenContent() {
  const progress = useScrollProgress()

  return (
    <Box className="story-stage">
      <Box className="story-stage-grid">
        <ScrollElement enter={[0.05, 0.2]} hold={[0.2, 0.55]} exit={[0.9, 1]}>
          <Box className="section-copy">
            <Typography variant="h2" className="section-title">
              Scarcity rarely lands evenly.
            </Typography>
          </Box>
        </ScrollElement>

        <ScrollElement enter={[0.15, 0.3]} hold={[0.3, 0.65]} exit={[0.8, 1]}>
          <Box className="equity-panel">
            <Box className="metric-grid">
              {burdenItems.map((item, index) => (
                <AnimatedMetricCard
                  key={item.name}
                  item={item}
                  start={0.12 + index * 0.18}
                  end={0.26 + index * 0.18}
                  progress={progress}
                />
              ))}
            </Box>
          </Box>
        </ScrollElement>
      </Box>
    </Box>
  )
}

function BalanceContent() {
  const progress = useScrollProgress()

  return (
    <Box className="story-stage">
      <Box className="story-stage-grid">
        <ScrollElement enter={[0.05, 0.2]} hold={[0.2, 0.55]} exit={[0.9, 1]}>
          <Box className="section-copy">
            <Typography variant="h2" className="section-title">
              Better planning makes tradeoffs explicit.
            </Typography>
          </Box>
        </ScrollElement>

        <ScrollElement enter={[0.15, 0.3]} hold={[0.3, 0.65]} exit={[0.8, 1]}>
          <Box className="balance-panel">
            <Box className="balance-list">
              {balanceItems.map((item, index) => (
                <NarrativeCard
                  key={item.name}
                  item={item}
                  start={0.14 + index * 0.18}
                  end={0.3 + index * 0.18}
                  progress={progress}
                />
              ))}
            </Box>
            {/* intentionally minimal notes */}
          </Box>
        </ScrollElement>
      </Box>
    </Box>
  )
}
