"use client"

/**
 * CategoryCircles - Interactive category selection circles
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

export interface Category {
  id: string
  label: string
  description: string
}

interface CategoryCirclesProps {
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  /** Optional scroll progress (0-1) for staggered reveal. If not provided, all circles are visible. */
  progress?: MotionValue<number>
  /** Progress value at which the first circle starts appearing (default: 0.7) */
  revealStart?: number
  /** Progress value by which all circles are visible (default: 0.95) */
  revealEnd?: number
  /** Override color for circle strokes, labels, and description text. Defaults to text.primary. */
  strokeColor?: string
}

/**
 * Individual circle that fades in based on scroll progress
 */
function StaggeredCircle({
  category,
  isSelected,
  onSelect,
  progress,
  fadeStart,
  fadeEnd,
  strokeColor,
}: {
  category: Category
  isSelected: boolean
  onSelect: (id: string | null) => void
  progress?: MotionValue<number>
  fadeStart: number
  fadeEnd: number
  strokeColor: string
}) {
  const theme = useTheme()
  // Always call useTransform (hooks can't be conditional), use fallback range when no progress
  const fallbackProgress = progress || ({ get: () => 1 } as MotionValue<number>)
  const opacity = useTransform(
    fallbackProgress,
    [fadeStart, fadeEnd],
    progress ? [0, 1] : [1, 1],
  )

  return (
    <motion.div
      style={{
        opacity,
      }}
    >
      <Box
        onClick={() => onSelect(isSelected ? null : category.id)}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          cursor: "pointer",
          transition: "all 0.3s ease",
          "&:hover .category-circle": {
            borderColor: strokeColor,
            backgroundColor: isSelected
              ? strokeColor
              : "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {/* Label banner - above circle (always text.primary) */}
        <Box
          sx={{
            backgroundColor: theme.palette.text.primary,
            color: theme.palette.common.white,
            px: 1.5,
            py: "3px",
            borderRadius: "4px",
            lineHeight: 1.1,
          }}
        >
          <Typography
            variant="compactTitle"
            component="div"
            sx={{
              textAlign: "center",
              color: "inherit",
              lineHeight: "inherit",
            }}
          >
            {category.label}
          </Typography>
        </Box>

        {/* Circle */}
        <Box
          className="category-circle"
          sx={{
            width: { xs: 64, lg: 80 },
            height: { xs: 64, lg: 80 },
            borderRadius: "50%",
            border: `${theme.strokeWidth.rule}px ${isSelected ? "solid" : "dashed"} ${strokeColor}`,
            backgroundColor: isSelected
              ? strokeColor
              : "transparent",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />

        {/* Description text - appears below circle when selected */}
        {isSelected && (
          <Typography
            variant="compactSubtitle"
            component="div"
            sx={{
              textAlign: "center",
              color: strokeColor,
              mt: 1,
              maxWidth: "180px",
              transition: "color 0.3s ease",
            }}
          >
            {category.description}
          </Typography>
        )}
      </Box>
    </motion.div>
  )
}

export default function CategoryCircles({
  categories,
  selectedId,
  onSelect,
  progress,
  revealStart = 0.7,
  revealEnd = 0.95,
  strokeColor,
}: CategoryCirclesProps) {
  const theme = useTheme()
  const resolvedColor = strokeColor ?? theme.palette.text.primary

  // Calculate staggered fade ranges for each circle
  const totalRange = revealEnd - revealStart
  const staggerStep = totalRange / categories.length

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          lg: "repeat(6, 1fr)",
        },
        gap: { xs: 3, lg: 3 },
        mt: 0,
      }}
    >
      {categories.map((category, index) => {
        const fadeStart = revealStart + index * staggerStep
        const fadeEnd = fadeStart + staggerStep

        return (
          <StaggeredCircle
            key={category.id}
            category={category}
            isSelected={selectedId === category.id}
            onSelect={onSelect}
            progress={progress}
            fadeStart={fadeStart}
            fadeEnd={fadeEnd}
            strokeColor={resolvedColor}
          />
        )
      })}
    </Box>
  )
}
