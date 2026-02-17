"use client"

/**
 * ScenarioList - Formatted list of scenarios
 *
 * Displays scenario ID, name, and a truncated description (2 lines with
 * "show more") for each scenario in a category. See the example in the scenarios
 * panel (Main stem panel 4) where it appears below each category circle.
 *
 * Uses TruncatedText from @repo/ui for consistent show more/less behavior.
 * Descriptions are indented to align with scenario names, not the ID column.
 */

import React from "react"
import { Box, Typography } from "@repo/ui/mui"
import { TruncatedText } from "@repo/ui"
import {
  getScenarioLabel,
  getScenarioDescription,
  hasScenarioMetadata,
} from "../content/scenarios"

interface ScenarioListProps {
  /** Array of scenario IDs (e.g., ["s0035", "s0036"]) */
  scenarioIds: string[]
  /** Text and border color (adapts to light/dark backgrounds) */
  color?: string
}

/** Fixed width for the ID column so descriptions align across rows */
const ID_COLUMN_WIDTH = "3.2em"
const ID_GAP = "0.5em"

export default function ScenarioList({
  scenarioIds,
  color = "inherit",
}: ScenarioListProps) {
  if (scenarioIds.length === 0) return null

  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        m: 0,
        p: 0,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        width: "100%",
      }}
    >
      {scenarioIds.map((id) => {
        const known = hasScenarioMetadata(id)
        const name = known ? getScenarioLabel(id) : "(coming soon)"
        const desc = known ? getScenarioDescription(id) : ""

        return (
          <Box
            component="li"
            key={id}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              borderBottom: "1px solid",
              borderColor: `${color}18`,
              pb: 1.5,
              mb: 0.5,
              "&:last-child": { borderBottom: "none", pb: 0, mb: 0 },
            }}
          >
            {/* ID + Name row */}
            <Box sx={{ display: "flex", alignItems: "baseline", gap: ID_GAP }}>
              <Typography
                variant="compactTitle"
                component="span"
                sx={{
                  color,
                  opacity: 0.5,
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: "0.75rem",
                  width: ID_COLUMN_WIDTH,
                }}
              >
                {id}
              </Typography>
              <Typography
                variant="compactTitle"
                component="span"
                sx={{
                  color,
                  fontWeight: 500,
                }}
              >
                {name}
              </Typography>
            </Box>

            {/* Description - indented to align with name, not ID */}
            {desc && (
              <TruncatedText
                variant="compactTitle"
                lines={2}
                sx={{
                  color,
                  opacity: 0.75,
                  fontWeight: 400,
                  lineHeight: 1.3,
                  pl: `calc(${ID_COLUMN_WIDTH} + ${ID_GAP})`,
                }}
              >
                {desc}
              </TruncatedText>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
