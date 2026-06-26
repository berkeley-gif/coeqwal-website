"use client"

/**
 * ClickTooltip - Thin wrapper that forwards to InfoPopover, the shared
 * click/anchored surface.
 *
 * It exists only so current code keep working. The plan is to migrate
 * those to InfoPopover and then delete this file.
 */

import React from "react"
import type { PopperProps } from "../../.."
import { InfoPopover } from "./InfoPopover"

export interface ClickTooltipProps {
  /** Whether the tooltip is open */
  open: boolean
  /** Callback when the tooltip should close */
  onClose: () => void
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The child element that triggers the tooltip */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  /** Tooltip placement */
  placement?: PopperProps["placement"]
  /** Custom width override */
  width?: number | string
  /** Custom max width override */
  maxWidth?: number | string
  /** Hide the X close button */
  hideCloseButton?: boolean
  /** Close tooltip when the user scrolls (default: false) */
  closeOnScroll?: boolean
}

export function ClickTooltip({
  open,
  onClose,
  content,
  children,
  placement = "top",
  width,
  maxWidth,
  hideCloseButton = false,
  closeOnScroll = false,
}: ClickTooltipProps) {
  return (
    <InfoPopover
      open={open}
      onClose={onClose}
      content={content}
      placement={placement}
      width={width}
      maxWidth={maxWidth}
      hideCloseButton={hideCloseButton}
      closeOnScroll={closeOnScroll}
    >
      {children}
    </InfoPopover>
  )
}

export default ClickTooltip
