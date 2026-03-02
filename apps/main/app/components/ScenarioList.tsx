"use client"

/**
 * ScenarioList - Formatted list of scenarios
 *
 * Displays scenario ID, name, and a truncated description (2 lines with
 * "show more") for each scenario in a category.
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
  /** ID of the currently highlighted scenario (from dot hover) */
  highlightedId?: string | null
}

export default function ScenarioList({
  scenarioIds,
  color = "inherit",
  highlightedId,
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
        const isHighlighted = highlightedId === id

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
              // Highlight styling
              borderLeft: isHighlighted
                ? `3px solid ${color}`
                : "3px solid transparent",
              pl: isHighlighted ? 1 : 0,
              borderRadius: "2px",
              transition:
                "border-left 0.15s ease, padding-left 0.15s ease, opacity 0.15s ease",
              // Dim non-highlighted rows when something is highlighted
              opacity: highlightedId && !isHighlighted ? 0.4 : 1,
            }}
          >
            {/* Scenario ID */}
            <Typography
              variant="compactTitle"
              component="span"
              sx={{
                color,
                opacity: isHighlighted ? 0.8 : 0.5,
                fontVariantNumeric: "tabular-nums",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.75rem",
                transition: "opacity 0.15s ease",
              }}
            >
              {id}
            </Typography>

            {/* Scenario name */}
            <Typography
              variant="compactTitle"
              component="span"
              sx={{
                color,
                fontWeight: isHighlighted ? 600 : 500,
                transition: "font-weight 0.15s ease",
              }}
            >
              {name}
            </Typography>

            {/* Description - full width, no indent */}
            {desc && (
              <TruncatedText
                variant="compactTitle"
                lines={2}
                sx={{
                  color,
                  opacity: 0.75,
                  fontWeight: 400,
                  lineHeight: 1.3,
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
