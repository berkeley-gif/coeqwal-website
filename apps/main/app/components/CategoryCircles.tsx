"use client"

/**
 * CategoryCircles - Interactive category selection circles
 *
 * Renders a responsive grid of dashed circles with labels.
 * Labels are always clickable to toggle selection and show descriptions.
 *
 * When `showScenarios` is true, circles display packed scenario dots
 * (via ScenarioDots) and the circle click-to-select behavior is disabled.
 *
 * Supports optional scroll-linked staggered reveal via a progress MotionValue.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, useTransform, MotionValue } from "@repo/motion"
import ScenarioDots from "./ScenarioDots"
import ScenarioList from "./ScenarioList"

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
  /** Maps category ID to scenario IDs for dot visualization */
  scenarioMap?: Record<string, string[]>
  /** When true, show scenario dots inside circles and disable circle click-to-select */
  showScenarios?: boolean
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
  scenarioIds,
  showScenarios,
}: {
  category: Category
  isSelected: boolean
  onSelect: (id: string | null) => void
  progress?: MotionValue<number>
  fadeStart: number
  fadeEnd: number
  strokeColor: string
  scenarioIds?: string[]
  showScenarios?: boolean
}) {
  const theme = useTheme()
  // Always call useTransform (hooks can't be conditional), use fallback range when no progress
  const fallbackProgress = progress || ({ get: () => 1 } as MotionValue<number>)
  const opacity = useTransform(
    fallbackProgress,
    [fadeStart, fadeEnd],
    progress ? [0, 1] : [1, 1],
  )

  const circleSize = { xs: 64, lg: 80 }
  const hasScenarios = showScenarios && scenarioIds && scenarioIds.length > 0

  return (
    <motion.div
      style={{
        opacity,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          transition: "all 0.3s ease",
        }}
      >
        {/* Label banner - clickable for selection when not showing scenarios */}
        <Box
          onClick={
            !showScenarios
              ? () => onSelect(isSelected ? null : category.id)
              : undefined
          }
          sx={{
            backgroundColor: theme.palette.text.primary,
            color: theme.palette.common.white,
            px: 1.5,
            py: "3px",
            borderRadius: "4px",
            lineHeight: 1.1,
            cursor: !showScenarios ? "pointer" : "default",
            ...(!showScenarios && {
              "&:hover": {
                opacity: 0.85,
              },
            }),
          }}
        >
          <Typography
            variant="compactTitle"
            component="div"
            sx={{
              textAlign: "center",
              color: "inherit",
              lineHeight: "inherit",
              whiteSpace: "pre-line",
            }}
          >
            {category.label}
          </Typography>
        </Box>

        {/* Circle - clickable when not showing scenarios */}
        <Box
          className="category-circle"
          onClick={
            !showScenarios
              ? () => onSelect(isSelected ? null : category.id)
              : undefined
          }
          sx={{
            width: circleSize,
            height: circleSize,
            borderRadius: "50%",
            border: `${theme.strokeWidth.rule}px ${isSelected && !showScenarios ? "solid" : "dashed"} ${strokeColor}`,
            backgroundColor:
              isSelected && !showScenarios ? strokeColor : "transparent",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
            cursor: !showScenarios ? "pointer" : "default",
            ...(!showScenarios && {
              "&:hover": {
                borderColor: strokeColor,
                backgroundColor: isSelected
                  ? strokeColor
                  : "rgba(255, 255, 255, 0.1)",
              },
            }),
          }}
        >
          {/* Scenario dots - shown when showScenarios is true */}
          {hasScenarios && (
            <ScenarioDots
              scenarioIds={scenarioIds}
              size={80}
              fillColor="#ffffff"
            />
          )}
        </Box>

        {/* Description text - appears below circle when selected, hidden in scenario mode */}
        {isSelected && !showScenarios && (
          <Box
            sx={{
              textAlign: "center",
              color: strokeColor,
              mt: 1,
              maxWidth: "180px",
              transition: "color 0.3s ease",
            }}
          >
            <Typography
              variant="compactSubtitle"
              component="div"
            >
              {category.description}
            </Typography>
            <Typography
              variant="compactSubtitle"
              component="div"
              sx={{ mt: 0.5, fontWeight: 500 }}
            >
              Learn more about this theme
            </Typography>
          </Box>
        )}

        {/* Scenario list - fades in when showScenarios becomes true */}
        {scenarioIds && scenarioIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showScenarios ? 1 : 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: showScenarios ? 0.3 : 0 }}
            style={{
              marginTop: 12,
              width: "100%",
              pointerEvents: showScenarios ? "auto" : "none",
            }}
          >
            <ScenarioList scenarioIds={scenarioIds} color={strokeColor} />
          </motion.div>
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
  scenarioMap,
  showScenarios,
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
        gap: { xs: 3, lg: 4 },
        alignItems: "start",
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
            scenarioIds={scenarioMap?.[category.id]}
            showScenarios={showScenarios}
          />
        )
      })}
    </Box>
  )
}
