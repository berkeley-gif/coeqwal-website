"use client"

/**
 * StrategyHeader - Strategy title and description (with TUCP tooltip)
 *
 * Shared component for rendering strategy information.
 * Used by both Learn mode (StrategyInfoPanel) and Explore mode (StrategyGrid).
 *
 * Handles the inline TUCP definition tooltip that appears when
 * "TUCP" or "TUCPs" is mentioned in the strategy description.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { InfoIconButton } from "@repo/ui"
import type { ScenarioForDisplay } from "./types"

export interface StrategyHeaderProps {
  /** Scenario data */
  strategy: ScenarioForDisplay
  /** Whether to show the description */
  showDescription?: boolean
  /** Typography variant for the title */
  titleVariant?: "subtitle1" | "subtitle2" | "body1" | "body2"
  /** Max width for the description */
  descriptionMaxWidth?: string | number | object
  /** Called when title is clicked */
  onTitleClick?: () => void
}

/**
 * Renders strategy description with inline TUCP tooltip
 */
function DescriptionWithTUCPTooltip({
  description,
  maxWidth,
}: {
  description: string
  maxWidth?: string | number | object
}) {
  const theme = useTheme()

  return (
    <Typography
      variant="dashboard"
      sx={{
        color: theme.palette.grey[600],
        maxWidth: maxWidth ?? theme.layout.maxWidth.md,
        lineHeight: 1.6,
      }}
    >
      {description.split(/(\bTUCPs?\b)/g).map((part, index) => {
        if (part.match(/\bTUCPs?\b/)) {
          return (
            <span key={index}>
              {part}
              <InfoIconButton
                variant="inline"
                tooltipContent={
                  <>
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      Temporary Urgent Change Petitions (TUCPs)
                    </Box>{" "}
                    permit changes during droughts to meet human health and
                    safety needs and protect endangered species.
                  </>
                }
              />
            </span>
          )
        }
        return part
      })}
    </Typography>
  )
}

export function StrategyHeader({
  strategy,
  showDescription = true,
  titleVariant = "body2",
  descriptionMaxWidth,
  onTitleClick,
}: StrategyHeaderProps) {
  const theme = useTheme()

  // Format label for historical-ag scenario (s0011)
  const displayLabel =
    strategy.scenarioId === "s0011"
      ? "Current operations with historical agricultural land use"
      : strategy.label

  return (
    <Box>
      <Typography
        variant="scenarioTitle"
        onClick={onTitleClick}
        sx={{
          maxWidth: theme.layout.maxWidth.sm,
          mb: showDescription ? theme.space.component.xs : 0,
          color: theme.palette.grey[900],
          cursor: onTitleClick ? "pointer" : "default",
        }}
      >
        {displayLabel}
        {titleVariant === "subtitle1" && " strategy"}
      </Typography>

      {showDescription && (
        <DescriptionWithTUCPTooltip
          description={strategy.description}
          maxWidth={descriptionMaxWidth}
        />
      )}
    </Box>
  )
}

export default StrategyHeader
