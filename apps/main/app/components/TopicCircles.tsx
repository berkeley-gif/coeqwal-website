"use client"

/**
 * TopicCircles - Interactive topic selection circles
 *
 * Renders a responsive grid of dashed circles with labels.
 * Clicking a circle selects it (fills in) and triggers a callback.
 * Clicking the same circle again deselects it.
 *
 * Supports optional scroll-linked staggered reveal via a progress MotionValue.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, useTransform, MotionValue } from "@repo/motion"

export interface Topic {
  id: string
  label: string
  description: string
}

interface TopicCirclesProps {
  topics: Topic[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Optional scroll progress (0-1) for staggered reveal. If not provided, all circles are visible. */
  progress?: MotionValue<number>
  /** Progress value at which the first circle starts appearing (default: 0.7) */
  revealStart?: number
  /** Progress value by which all circles are visible (default: 0.95) */
  revealEnd?: number
}

/**
 * Individual circle that fades in based on scroll progress
 */
function StaggeredCircle({
  topic,
  index,
  isSelected,
  onSelect,
  progress,
  fadeStart,
  fadeEnd,
}: {
  topic: Topic
  index: number
  isSelected: boolean
  onSelect: (id: string | null) => void
  progress?: MotionValue<number>
  fadeStart: number
  fadeEnd: number
}) {
  const theme = useTheme()
  const opacity = progress
    ? useTransform(progress, [fadeStart, fadeEnd], [0, 1])
    : undefined

  return (
    <motion.div
      style={{
        opacity: opacity ?? 1,
        pointerEvents: opacity ? undefined : "auto",
      }}
    >
      <Box
        onClick={() => onSelect(isSelected ? null : topic.id)}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
          "&:hover .topic-circle": {
            borderColor: theme.palette.text.primary,
            backgroundColor: isSelected
              ? theme.palette.text.primary
              : "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {/* Circle */}
        <Box
          className="topic-circle"
          sx={{
            width: { xs: 64, lg: 80 },
            height: { xs: 64, lg: 80 },
            borderRadius: "50%",
            border: `${theme.strokeWidth.rule}px ${isSelected ? "solid" : "dashed"} ${theme.palette.text.primary}`,
            backgroundColor: isSelected
              ? theme.palette.text.primary
              : "transparent",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Label */}
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: isSelected ? 600 : 400,
            lineHeight: 1.3,
            textAlign: "center",
            color: "inherit",
            maxWidth: "120px",
            transition: "font-weight 0.2s ease",
          }}
        >
          {topic.label}
        </Typography>
      </Box>
    </motion.div>
  )
}

export default function TopicCircles({
  topics,
  selectedId,
  onSelect,
  progress,
  revealStart = 0.7,
  revealEnd = 0.95,
}: TopicCirclesProps) {
  // Calculate staggered fade ranges for each circle
  const totalRange = revealEnd - revealStart
  const staggerStep = totalRange / topics.length

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
        },
        gap: { xs: 3, lg: 4 },
        mt: 4,
      }}
    >
      {topics.map((topic, index) => {
        const fadeStart = revealStart + index * staggerStep
        const fadeEnd = fadeStart + staggerStep

        return (
          <StaggeredCircle
            key={topic.id}
            topic={topic}
            index={index}
            isSelected={selectedId === topic.id}
            onSelect={onSelect}
            progress={progress}
            fadeStart={fadeStart}
            fadeEnd={fadeEnd}
          />
        )
      })}
    </Box>
  )
}
