"use client"

import React from "react"
import { BaseTooltip } from "./BaseTooltip"
import type { BaseTooltipProps } from "./BaseTooltip"

export interface HelpTooltipProps extends Omit<BaseTooltipProps, "title"> {
  /** The help message to display */
  message: string
  /** Optional placement override - defaults to "right" for help tooltips */
  placement?: BaseTooltipProps["placement"]
}

/**
 * Help tooltip component for simple text-based help messages.
 * Commonly used for disabled form elements or contextual help.
 * 
 * Features:
 * - Simple string-based message
 * - Optimized for help/disabled state scenarios
 * - Standard interaction timing
 * - Right placement by default (good for form elements)
 */
export function HelpTooltip({
  message,
  children,
  placement = "right",
  tooltipProps = {},
}: HelpTooltipProps) {
  return (
    <BaseTooltip
      title={message}
      placement={placement}
      tooltipProps={tooltipProps}
    >
      {children}
    </BaseTooltip>
  )
}

export default HelpTooltip
