"use client"

/**
 * ScenarioDots - Scenario visualization inside category circles
 *
 * Thin wrapper that maps scenario IDs to display data using the app's
 * scenario metadata, then renders them via PackedDots from @repo/viz.
 *
 * Each dot shows a tooltip with the scenario name and description
 * on hover (desktop) or click (touch). Unknown scenarios display
 * their ID with "(coming soon)".
 */

import React, { useMemo, useState, useCallback } from "react"
import { PackedDots } from "@repo/viz"
import type { DotDatum } from "@repo/viz"
import { Box, Typography, Tooltip } from "@repo/ui/mui"
import { themeValues } from "@repo/ui/themes/theme"
import { useScenarioList } from "../features/scenarios/hooks"

interface ScenarioDotsProps {
  /** Array of scenario IDs (e.g., ["s0035", "s0036"]) */
  scenarioIds: string[]
  /** Diameter of the container circle in px */
  size: number
  /** Fill color for dots (default: theme common.white) */
  fillColor?: string
  /** Called when the hovered scenario changes (null = no hover) */
  onHoverChange?: (id: string | null) => void
}

/**
 * Creates a virtual element for MUI Tooltip positioning.
 * This lets the tooltip arrow point directly at the hovered SVG circle.
 */
function createVirtualAnchor(rect: DOMRect) {
  return {
    getBoundingClientRect: () => rect,
    nodeType: 1 as const,
  }
}

export default function ScenarioDots({
  scenarioIds,
  size,
  fillColor = themeValues.palette.common.white,
  onHoverChange,
}: ScenarioDotsProps) {
  const { scenarioMap } = useScenarioList()

  const dots: DotDatum[] = useMemo(
    () =>
      scenarioIds.map((id) => {
        const scenario = scenarioMap.get(id)
        if (scenario) {
          return {
            id,
            label: scenario.label,
            description: scenario.description,
          }
        }
        return {
          id,
          label: id.toUpperCase(),
          description: "(coming soon)",
        }
      }),
    [scenarioIds, scenarioMap],
  )

  const [activeDot, setActiveDot] = useState<DotDatum | null>(null)
  const [virtualAnchor, setVirtualAnchor] = useState<ReturnType<
    typeof createVirtualAnchor
  > | null>(null)

  const handleDotHover = useCallback(
    (dot: DotDatum | null, event: React.MouseEvent) => {
      if (dot) {
        const el = event.target as SVGCircleElement
        const rect = el.getBoundingClientRect()
        setVirtualAnchor(createVirtualAnchor(rect))
      }
      setActiveDot(dot)
      onHoverChange?.(dot?.id ?? null)
    },
    [onHoverChange],
  )

  const handleDotClick = useCallback(
    (dot: DotDatum, event: React.MouseEvent) => {
      const el = event.target as SVGCircleElement
      const rect = el.getBoundingClientRect()
      setVirtualAnchor(createVirtualAnchor(rect))
      setActiveDot((prev) => {
        const next = prev?.id === dot.id ? null : dot
        // Schedule parent update outside the updater to avoid setState-during-render
        queueMicrotask(() => onHoverChange?.(next?.id ?? null))
        return next
      })
    },
    [onHoverChange],
  )

  if (dots.length === 0) return null

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <PackedDots
        dots={dots}
        size={size}
        fillColor={fillColor}
        onDotHover={handleDotHover}
        onDotClick={handleDotClick}
      />
      {activeDot && virtualAnchor && (
        <Tooltip
          open
          title={
            <Box sx={{ p: 0.5 }}>
              <Typography
                variant="compactSubtitle"
                component="div"
                sx={{
                  color: "inherit",
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.65rem",
                  mb: 0.25,
                }}
              >
                {activeDot.id}
              </Typography>
              <Typography
                variant="compactTitle"
                component="div"
                sx={{ mb: 0.5, color: "inherit" }}
              >
                {activeDot.label}
              </Typography>
              {activeDot.description && (
                <Typography
                  variant="compactSubtitle"
                  component="div"
                  sx={{ color: "inherit" }}
                >
                  {activeDot.description}
                </Typography>
              )}
            </Box>
          }
          placement="top"
          arrow
          slotProps={{
            popper: {
              anchorEl: virtualAnchor,
              sx: { zIndex: 9999 },
            },
          }}
        >
          {/* Invisible child required by MUI Tooltip */}
          <span style={{ position: "absolute", width: 0, height: 0 }} />
        </Tooltip>
      )}
    </Box>
  )
}
