"use client"

/**
 * InfoPopover - Click a trigger to open rich content next to it.
 *
 * It wires AnchoredPortal (positioning, arrow, mobile-modal fallback) to
 * useDisclosure (open state, close-on-scroll) and adds a close button. Omit
 * open to let clicks toggle it, or pass open/onClose to drive it yourself.
 */

import React, { useRef } from "react"
import type { PopperProps } from "../../.."
import { themeValues } from "../../../themes/theme"
import { AnchoredPortal } from "./AnchoredPortal"
import { TooltipCloseButton } from "./TooltipCloseButton"
import { useDisclosure } from "./useDisclosure"

const DEFAULT_WIDTH = "280px"
const MAX_WIDTH = themeValues.layout.maxWidth.md

export interface InfoPopoverProps {
  /** Content shown inside the popover */
  content: React.ReactNode
  /** Trigger element. Its onClick is preserved */
  children: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  /** Controlled open value. Omit for uncontrolled (click-to-toggle) */
  open?: boolean
  /** Initial open value when uncontrolled (default: false) */
  defaultOpen?: boolean
  /** Called when the popover should close (click-away, Escape, scroll, button) */
  onClose?: () => void
  /** Called when the popover opens (uncontrolled mode) */
  onOpen?: () => void
  /** Preferred placement (default: "top") */
  placement?: PopperProps["placement"]
  /** Placements to try when the preferred one overflows */
  fallbackPlacements?: NonNullable<PopperProps["placement"]>[]
  /** Desktop surface width */
  width?: number | string
  /** Desktop surface max width */
  maxWidth?: number | string
  /** Override z-index (use theme.zIndex.tooltipAboveModal inside a modal) */
  zIndex?: number
  /** Hide the close button */
  hideCloseButton?: boolean
  /** Close when the user scrolls (default: false) */
  closeOnScroll?: boolean
  /** Show the pointing arrow (default: true) */
  showArrow?: boolean
}

export function InfoPopover({
  content,
  children,
  open,
  defaultOpen = false,
  onClose,
  onOpen,
  placement = "top",
  fallbackPlacements,
  width = DEFAULT_WIDTH,
  maxWidth = MAX_WIDTH,
  zIndex,
  hideCloseButton = false,
  closeOnScroll = false,
  showArrow = true,
}: InfoPopoverProps) {
  const isControlled = open !== undefined
  const anchorRef = useRef<HTMLSpanElement>(null)

  const {
    isOpen,
    onClose: close,
    onToggle,
  } = useDisclosure({
    open,
    defaultOpen,
    onOpenChange: (next) => (next ? onOpen?.() : onClose?.()),
    closeOnScroll,
    // AnchoredPortal handles Escape on desktop, so we do not double-bind it.
  })

  const handleTriggerClick = (e: React.MouseEvent) => {
    // In controlled mode the parent owns opening; just forward the click.
    if (!isControlled) onToggle()
    children.props.onClick?.(e)
  }

  return (
    <>
      <span ref={anchorRef} style={{ display: "inline-flex" }}>
        {React.cloneElement(children, { onClick: handleTriggerClick })}
      </span>
      <AnchoredPortal
        open={isOpen}
        anchorEl={anchorRef.current}
        onClose={close}
        placement={placement}
        fallbackPlacements={fallbackPlacements}
        width={width}
        maxWidth={maxWidth}
        zIndex={zIndex}
        showArrow={showArrow}
      >
        {!hideCloseButton && (
          <TooltipCloseButton onClick={close} offset={{ top: 8, right: 8 }} />
        )}
        {content}
      </AnchoredPortal>
    </>
  )
}

export default InfoPopover
