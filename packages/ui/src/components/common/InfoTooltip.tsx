"use client"

import React from "react"
import { Box } from "../.."
import { BaseTooltip } from "./BaseTooltip"
import type { BaseTooltipProps } from "./BaseTooltip"

export interface InfoTooltipProps extends Omit<BaseTooltipProps, "title"> {
  /** The main description text */
  description: React.ReactNode
  /** Optional action buttons or additional content */
  actions?: React.ReactNode
  /** Optional placement override - defaults to "top-end" for info tooltips */
  placement?: BaseTooltipProps["placement"]
}

/**
 * Info tooltip component for displaying detailed information with optional actions.
 * Commonly used with info icons to provide contextual help and interactive elements.
 */
export function InfoTooltip({
  description,
  actions,
  children,
  placement = "top-end",
  tooltipProps = {},
}: InfoTooltipProps) {
  // Merge default props with user overrides
  const mergedTooltipProps = {
    // Default timing for interactive tooltips
    enterDelay: 200,
    leaveDelay: 500, // Longer delay allows button interactions
    enterNextDelay: 100,
    // Keep all interaction methods enabled
    disableFocusListener: false,
    disableHoverListener: false,
    disableTouchListener: false,
    // Fine-tune positioning for info tooltips
    slotProps: {
      popper: {
        modifiers: [
          {
            name: "offset",
            options: {
              offset: [5, -10], // [horizontal, vertical]
            },
          },
        ],
      },
    },
    ...tooltipProps,
  }

  const title = (
    <Box>
      <Box sx={{ mb: actions ? 1 : 0 }}>{description}</Box>
      {actions}
    </Box>
  )

  return (
    <BaseTooltip
      title={title}
      placement={placement}
      tooltipProps={mergedTooltipProps}
    >
      {children}
    </BaseTooltip>
  )
}

export default InfoTooltip
