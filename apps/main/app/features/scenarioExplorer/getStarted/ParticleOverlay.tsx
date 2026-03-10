"use client"

import { useMemo } from "react"
import { motion, useTransform } from "@repo/motion"
import type { MotionValue } from "@repo/motion"

const MAX_PARTICLES = 120
const PARTICLE_SIZE = 8
const LINE_HEIGHT = 4
const LINE_WIDTH = 28
const BAR_GAP = 12

export interface ParticleStartPos {
  x: number
  y: number
  color: string
  tier: number
}

interface ParticleOverlayProps {
  startPositions: ParticleStartPos[]
  panelWidth: number
  panelHeight: number
  tierDistribution: [number, number, number, number]
  scrollProgress: MotionValue<number>
}

function computeEndPositions(
  startPositions: ParticleStartPos[],
  panelWidth: number,
  panelHeight: number,
  tierDistribution: [number, number, number, number],
) {
  const barAreaX = panelWidth * 0.72
  const barAreaWidth = panelWidth * 0.22
  const totalBarsHeight = 4 * LINE_HEIGHT + 3 * BAR_GAP
  const barAreaTop = (panelHeight - totalBarsHeight) / 2

  const tierBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const tierTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  for (const p of startPositions) {
    tierTotals[p.tier] = (tierTotals[p.tier] || 0) + 1
  }

  return startPositions.map((p) => {
    const tierIdx = p.tier - 1
    const rowY = barAreaTop + tierIdx * (LINE_HEIGHT + BAR_GAP) + LINE_HEIGHT / 2
    const barWidth = (tierDistribution[tierIdx] || 0.25) * barAreaWidth
    const posInTier = tierBuckets[p.tier] ?? 0
    tierBuckets[p.tier] = posInTier + 1
    const totalInTier = tierTotals[p.tier] ?? 1

    const fraction = totalInTier > 1 ? posInTier / (totalInTier - 1) : 0.5

    return {
      x: barAreaX + fraction * barWidth,
      y: rowY,
    }
  })
}

function Particle({
  startX,
  startY,
  endX,
  endY,
  color,
  scrollProgress,
  index,
}: {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  scrollProgress: MotionValue<number>
  index: number
}) {
  const stagger = (index % 20) * 0.005
  const enterStart = 0.3 + stagger
  const enterEnd = 0.65 + stagger

  const x = useTransform(scrollProgress, [enterStart, enterEnd], [startX, endX])
  const y = useTransform(scrollProgress, [enterStart, enterEnd], [startY, endY])
  const width = useTransform(
    scrollProgress,
    [enterStart, enterEnd],
    [PARTICLE_SIZE, LINE_WIDTH],
  )
  const height = useTransform(
    scrollProgress,
    [enterStart, enterEnd],
    [PARTICLE_SIZE, LINE_HEIGHT],
  )
  const borderRadius = useTransform(
    scrollProgress,
    [enterStart, enterEnd],
    [PARTICLE_SIZE / 2, 2],
  )
  const opacity = useTransform(
    scrollProgress,
    [0.25, 0.32, 0.65, 0.72],
    [0, 1, 1, 0.9],
  )

  return (
    <motion.div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        borderRadius,
        backgroundColor: color,
        x,
        y,
        opacity,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform",
      }}
    />
  )
}

export default function ParticleOverlay({
  startPositions,
  panelWidth,
  panelHeight,
  tierDistribution,
  scrollProgress,
}: ParticleOverlayProps) {
  const sampled = useMemo(() => {
    if (startPositions.length <= MAX_PARTICLES) return startPositions
    const step = startPositions.length / MAX_PARTICLES
    return Array.from({ length: MAX_PARTICLES }, (_, i) =>
      startPositions[Math.floor(i * step)]!,
    )
  }, [startPositions])

  const endPositions = useMemo(
    () => computeEndPositions(sampled, panelWidth, panelHeight, tierDistribution),
    [sampled, panelWidth, panelHeight, tierDistribution],
  )

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
        overflow: "hidden",
      }}
    >
      {sampled.map((p, i) => {
        const endPos = endPositions[i]
        if (!p || !endPos) return null
        return (
          <Particle
            key={`${p.x}-${p.y}-${i}`}
            startX={p.x}
            startY={p.y}
            endX={endPos.x}
            endY={endPos.y}
            color={p.color}
            scrollProgress={scrollProgress}
            index={i}
          />
        )
      })}
    </div>
  )
}
