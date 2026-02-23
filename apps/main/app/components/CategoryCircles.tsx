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
 * Supports optional scroll-linked one-by-one fade-in via a progress MotionValue.
 */

import React, { useState } from "react"
import { Box, Typography, useTheme, useMediaQuery } from "@repo/ui/mui"
import { motion, useTransform, MotionValue } from "@repo/motion"
import { type Theme } from "@repo/data/coeqwal"
import { DashedCircle } from "./DashedCircle"
import ScenarioDots from "./ScenarioDots"
import ScenarioList from "./ScenarioList"
import HydroclimateIcons from "./HydroclimateIcons"
import HydroclimateList from "./HydroclimateList"


interface CategoryCirclesProps {
  categories: Theme[]
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
  category: Theme
  isSelected: boolean
  onSelect: (id: string | null) => void
  progress?: MotionValue<number>
  fadeStart: number
  fadeEnd: number
  strokeColor: string
  scenarioIds?: string[]
  showScenarios?: boolean
}) {
  // Always call useTransform (hooks can't be conditional), use fallback range when no progress
  const fallbackProgress = progress || ({ get: () => 1 } as MotionValue<number>)
  const opacity = useTransform(
    fallbackProgress,
    [fadeStart, fadeEnd],
    progress ? [0, 1] : [1, 1],
  )

  const circleSize = { xs: 64, lg: 80 }
  const hasScenarios = showScenarios && scenarioIds && scenarioIds.length > 0
  const isClimate = category.id === "climate"
  const [hoveredScenarioId, setHoveredScenarioId] = useState<string | null>(
    null,
  )

  // (hover: hover) and (pointer: fine) = true for mouse; false for touch/stylus
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)")
  const interactive = !showScenarios

  const hoverHandlers =
    canHover && interactive
      ? {
          onMouseEnter: () => onSelect(category.id),
          onMouseLeave: () => onSelect(null),
        }
      : {}
  const clickHandler =
    !canHover && interactive
      ? { onClick: () => onSelect(isSelected ? null : category.id) }
      : {}

  return (
    <motion.div
      style={{
        opacity,
      }}
    >
      {/* Outer Box keeps hover handlers so description text stays in the hover zone */}
      <Box
        {...hoverHandlers}
        {...clickHandler}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          transition: "all 0.3s ease",
          cursor: interactive ? "pointer" : "default",
        }}
      >
        <DashedCircle
          label={category.label}
          isSelected={isSelected && !showScenarios}
          strokeColor={strokeColor}
          size={circleSize}
        >
          {/* Scenario dots or hydroclimate icons - shown when showScenarios is true */}
          {hasScenarios && (
            <ScenarioDots
              scenarioIds={scenarioIds}
              size={80}
              fillColor="#ffffff"
              onHoverChange={setHoveredScenarioId}
            />
          )}
          {showScenarios && isClimate && <HydroclimateIcons size={80} />}
        </DashedCircle>

        {/* Description text - appears below circle when selected, hidden in scenario mode */}
        {isSelected && !showScenarios && (
          <Box
            sx={{
              textAlign: "left",
              color: strokeColor,
              mt: 1,
              maxWidth: "180px",
              transition: "color 0.3s ease",
            }}
          >
            <Typography variant="compactSubtitle" component="div">
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

        {/* Scenario list or hydroclimate list - fades in when showScenarios becomes true */}
        {(hasScenarios || isClimate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showScenarios ? 1 : 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
              delay: showScenarios ? 0.3 : 0,
            }}
            style={{
              marginTop: 12,
              width: "100%",
              pointerEvents: showScenarios ? "auto" : "none",
            }}
          >
            {isClimate ? (
              <HydroclimateList color={strokeColor} />
            ) : (
              <ScenarioList
                scenarioIds={scenarioIds!}
                color={strokeColor}
                highlightedId={hoveredScenarioId}
              />
            )}
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
        gap: { xs: 3, lg: 5 },
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
