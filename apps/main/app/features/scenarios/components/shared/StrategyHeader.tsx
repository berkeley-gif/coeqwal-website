/**
 * StrategyHeader - Strategy title and description with TUCP tooltip
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
import type { Strategy } from "./types"

export interface StrategyHeaderProps {
  /** Strategy data */
  strategy: Strategy
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
        color: theme.palette.grey[700],
        maxWidth: maxWidth ?? theme.layout.maxWidth.md,
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
                    <Box
                      component="span"
                      sx={{ fontWeight: theme.typography.fontWeightSemiBold }}
                    >
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

  // Format label for historical-ag strategy
  const displayLabel =
    strategy.value === "current-ops-historical-ag"
      ? "Current operations with historical agricultural land use"
      : strategy.label

  return (
    <Box>
      <Typography
        variant={titleVariant}
        onClick={onTitleClick}
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          maxWidth: theme.layout.maxWidth.sm,
          mb: showDescription ? 0.5 : 0,
          lineHeight: 1.3,
          color: theme.palette.grey[900],
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




