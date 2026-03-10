"use client"

import { useMemo } from "react"
import { motion, useTransform } from "@repo/motion"
import type { MotionValue } from "@repo/motion"

const MAX_PARTICLES = 120
const PARTICLE_SIZE = 8

export interface ParticleStartPos {
  x: number
  y: number
  color: string
  tier: number
}

interface ParticleOverlayProps {
  startPositions: ParticleStartPos[]
  glyphRect: { x: number; y: number; width: number; height: number }
  tierDistribution: [number, number, number, number]
  scrollProgress: MotionValue<number>
}

function computeEndPositions(
  startPositions: ParticleStartPos[],
  glyphRect: { x: number; y: number; width: number; height: number },
  tierDistribution: [number, number, number, number],
) {
  const { x: gx, y: gy, width: gw, height: gh } = glyphRect
  const barHeight = gh / 4
  const maxBarWidth = gw * 0.7
  const barX = gx + gw * 0.15

  const tierBuckets: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
  const tierTotals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

  for (const p of startPositions) {
    tierTotals[p.tier] = (tierTotals[p.tier] || 0) + 1
  }

  return startPositions.map((p) => {
    const tierIdx = p.tier - 1
    const barY = gy + tierIdx * barHeight
    const barWidth = (tierDistribution[tierIdx] || 0.25) * maxBarWidth
    const posInTier = tierBuckets[p.tier] ?? 0
    tierBuckets[p.tier] = posInTier + 1
    const totalInTier = tierTotals[p.tier] ?? 1

    const fraction = totalInTier > 1 ? posInTier / (totalInTier - 1) : 0.5

    return {
      x: barX + fraction * barWidth,
      y: barY + barHeight * 0.5,
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
  const scale = useTransform(
    scrollProgress,
    [enterStart, enterStart + 0.05, enterEnd - 0.05, enterEnd],
    [1, 1.3, 1.3, 1],
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
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        borderRadius: "50%",
        backgroundColor: color,
        x,
        y,
        scale,
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
  glyphRect,
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
    () => computeEndPositions(sampled, glyphRect, tierDistribution),
    [sampled, glyphRect, tierDistribution],
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
