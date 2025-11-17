"use client"

import { RefObject, useEffect, useState } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { motion, MotionValue } from "@repo/motion"

const MotionBox = motion.create(Box)

interface ScrollTooltipProps {
  targetRef: RefObject<HTMLElement | null>
  containerRef: RefObject<HTMLElement | null>
  content: string
  position?: "top" | "bottom" | "left" | "right"
  opacity: MotionValue<number> // Framer Motion value for scroll-driven opacity
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
}: ScrollTooltipProps) {
  const theme = useTheme()
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!targetRef.current || !containerRef.current) {
      return;
    }

    const updatePosition = () => {
      const targetEl = targetRef.current
      const containerEl = containerRef.current
      if (!targetEl || !containerEl) return

      // Get positions relative to the container
      const targetRect = targetEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      
      // Calculate position relative to container
      const relativeTop = targetRect.top - containerRect.top
      const relativeLeft = targetRect.left - containerRect.left
      
      // Tooltip dimensions
      const tooltipWidth = 280 // max-width from styles
      const gap = 20

      let top = 0
      let left = 0

      // Position relative to target element within the container
      switch (position) {
        case "right":
          top = relativeTop + targetRect.height / 2
          left = relativeLeft + targetRect.width + gap
          break
        case "left":
          top = relativeTop + targetRect.height / 2
          left = relativeLeft - tooltipWidth - gap
          break
        case "top":
          top = relativeTop - 80 - gap // Approximate tooltip height
          left = relativeLeft + (targetRect.width / 2)
          break
        case "bottom":
          top = relativeTop + targetRect.height + gap
          left = relativeLeft + (targetRect.width / 2)
          break
      }

      setTooltipPosition({ top, left })
    }

    updatePosition()

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
    }
  }, [targetRef, containerRef, position])

  // Arrow size and positioning based on direction
  const arrowSize = 12
  const getArrowStyle = () => {
    const baseStyle = {
      position: "absolute" as const,
      width: 0,
      height: 0,
      border: `${arrowSize}px solid transparent`,
    }

    switch (position) {
      case "right":
        return {
          ...baseStyle,
          left: -arrowSize * 2,
          top: "50%",
          transform: "translateY(-50%)",
          borderRightColor: theme.palette.blue.bright,
        }
      case "left":
        return {
          ...baseStyle,
          right: -arrowSize * 2,
          top: "50%",
          transform: "translateY(-50%)",
          borderLeftColor: theme.palette.blue.bright, // Arrow points right (towards card)
        }
      case "top":
        return {
          ...baseStyle,
          bottom: -arrowSize * 2,
          left: "50%",
          transform: "translateX(-50%)",
          borderTopColor: theme.palette.blue.bright,
        }
      case "bottom":
        return {
          ...baseStyle,
          top: -arrowSize * 2,
          left: "50%",
          transform: "translateX(-50%)",
          borderBottomColor: theme.palette.blue.bright,
        }
    }
  }

  return (
    <MotionBox
      style={{ opacity }} // Framer Motion scroll-driven opacity
      sx={{
        position: "absolute",
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform:
          position === "right" || position === "left"
            ? "translateY(-50%)"
            : "translateX(-50%)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          position: "relative",
          backgroundColor: theme.palette.blue.bright,
          color: theme.palette.common.white,
          padding: theme.spacing(1.5, 2),
          borderRadius: theme.borderRadius.rounded,
          boxShadow: theme.shadows[8],
          maxWidth: "280px",
          minWidth: "200px",
        }}
      >
        {/* Arrow */}
        <Box sx={getArrowStyle()} />

        {/* Content */}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {content}
        </Typography>
      </Box>
    </MotionBox>
  )
}

