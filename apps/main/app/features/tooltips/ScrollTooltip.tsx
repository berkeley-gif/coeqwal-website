"use client"

/**
 * ScrollTooltip - Scroll-triggered instructional tooltip
 *
 * Displays a tooltip that appears based on scroll position.
 * Used for scroll tutorials and contextual hints.
 *
 * ## When to use
 *
 * Use ScrollTooltip for scroll-driven tutorial sequences where:
 * - Tooltip visibility is controlled by scroll position (Framer Motion)
 * - Manual positioning relative to a target element is required
 * - User can dismiss the tooltip with close button
 *
 * ## Closed state reset
 *
 * The parent component should reset `isClosed` to `false` when the scroll
 * position leaves the tooltip's visible range (when opacity goes to 0).
 * This allows the tooltip to reappear when the user scrolls back.
 *
 * This is not a general-purpose tooltip. For standard tooltips use:
 * - HybridTooltip: Hover on desktop, click on touch
 * - ClickTooltip: Always click-to-open with close button
 *
 * @see HybridTooltip - Device-adaptive hover/click behavior
 * @see ClickTooltip - Always click-to-open with close button
 */

import { RefObject, useEffect, useState, ReactNode } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import { motion, MotionValue, useTransform } from "@repo/motion"

const MotionBox = motion.create(Box)

interface ScrollTooltipProps {
  targetRef: RefObject<HTMLElement | null>
  containerRef: RefObject<HTMLElement | null>
  content: ReactNode
  position?: "top" | "bottom" | "left" | "right"
  opacity: MotionValue<number> // Framer Motion value for scroll-driven opacity
  /** Vertical offset in pixels (positive = down, negative = up) */
  offsetY?: number
  /** Whether the tooltip has been manually closed */
  isClosed?: boolean
  /** Callback when the close button is clicked */
  onClose?: () => void
}

/**
 * A tooltip that points to a specific element with an arrow
 * Used for scroll-triggered tutorial sequences
 */
export default function ScrollTooltip({
  targetRef,
  containerRef,
  content,
  position = "right",
  opacity,
  offsetY = 0,
  isClosed = false,
  onClose,
}: ScrollTooltipProps) {
  const theme = useTheme()
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  // Combine scroll-driven opacity with manual close state
  const effectiveOpacity = useTransform(opacity, (value) =>
    isClosed ? 0 : value,
  )

  // Derive pointer events from opacity - disable when not visible
  const effectivePointerEvents = useTransform(opacity, (value) =>
    isClosed || value < 0.1 ? "none" : "auto",
  )

  useEffect(() => {
    if (!targetRef.current || !containerRef.current) return

    const updatePosition = () => {
      const targetEl = targetRef.current
      const containerEl = containerRef.current
      if (!targetEl || !containerEl) return

      // Get positions
      const targetRect = targetEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()

      // Calculate position relative to container
      const relativeTop = targetRect.top - containerRect.top
      const relativeLeft = targetRect.left - containerRect.left

      // Tooltip dimensions
      const tooltipWidth = 300 // max-width from styles
      const gap = 40 // Gap to avoid overlapping

      let top = 0
      let left = 0

      // Position relative to target element
      switch (position) {
        case "right":
          top = relativeTop + targetRect.height / 2
          left = relativeLeft + targetRect.width + gap
          break
        case "left":
          top = relativeTop + targetRect.height / 2 - 32 // Slightly raised
          left = relativeLeft - tooltipWidth - gap
          break
        case "top":
          top = relativeTop - 80 - gap // Approximate tooltip height
          left = relativeLeft + targetRect.width / 2
          break
        case "bottom":
          top = relativeTop + targetRect.height + gap
          left = relativeLeft + targetRect.width / 2
          break
      }

      setTooltipPosition({ top: top + offsetY, left })
    }

    updatePosition()

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
    }
  }, [targetRef, containerRef, position, offsetY])

  // Using MUI Tooltip
  const arrowSize = 8
  const getArrowStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      width: 0,
      height: 0,
      border: `${arrowSize}px solid transparent`,
    }

    // Using MUI Tooltip in theme (white)
    const arrowColor = theme.palette.common.white

    switch (position) {
      case "right":
        return {
          ...baseStyle,
          left: -arrowSize * 2,
          top: "50%",
          transform: "translateY(-50%)",
          borderRightColor: arrowColor,
        }
      case "left":
        return {
          ...baseStyle,
          right: -arrowSize * 2,
          top: "50%",
          transform: "translateY(-50%)",
          borderLeftColor: arrowColor,
        }
      case "top":
        return {
          ...baseStyle,
          bottom: -arrowSize * 2,
          left: "50%",
          transform: "translateX(-50%)",
          borderTopColor: arrowColor,
        }
      case "bottom":
        return {
          ...baseStyle,
          top: -arrowSize * 2,
          left: "50%",
          transform: "translateX(-50%)",
          borderBottomColor: arrowColor,
        }
    }
  }

  return (
    <MotionBox
      style={{
        opacity: effectiveOpacity,
        pointerEvents: effectivePointerEvents, // Disable when not visible
      }}
      sx={{
        position: "absolute",
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform:
          position === "right" || position === "left"
            ? "translateY(-50%)"
            : "translateX(-50%)",
        zIndex: theme.zIndex.tooltip,
      }}
    >
      <Box
        sx={{
          position: "relative",
          // Match MUI Tooltip theme styling
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: theme.border.light,
          borderRadius: theme.borderRadius.md,
          boxShadow: theme.shadow.md,
          p: theme.space.component.lg,
          maxWidth: theme.layout.maxWidth.sm,
        }}
      >
        {/* Close button */}
        {onClose && <TooltipCloseButton onClick={onClose} />}

        {/* Arrow */}
        <Box sx={getArrowStyle()} />

        {/* Content */}
        <Typography variant="dashboard">{content}</Typography>
      </Box>
    </MotionBox>
  )
}
