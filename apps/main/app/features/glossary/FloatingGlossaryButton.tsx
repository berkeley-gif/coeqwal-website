"use client"

/**
 * FloatingGlossaryButton - Floating button to open glossary
 *
 * Displays a floating button that opens the glossary panel.
 * Animates between states based on drawer visibility.
 */

import { Box, useTheme, useMediaQuery, MenuBookIcon } from "@repo/ui/mui"
import { RoundedRightArrow } from "@repo/ui"
import { useEffect, useState } from "react"

interface Position {
  bottom: number
  right: number
}

interface FloatingGlossaryButtonProps {
  onClick: () => void
  isOpen: boolean
  position: Position
  onDragStart: (e: React.MouseEvent) => void
  onDragMove: (e: MouseEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

/**
 * Floating circular button for opening the glossary
 * Draggable to reposition the glossary horizontally in the viewport
 */
export function FloatingGlossaryButton({
  onClick,
  isOpen,
  position,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
}: FloatingGlossaryButtonProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [isHovered, setIsHovered] = useState(false)

  // Set up global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", onDragMove)
      document.addEventListener("mouseup", onDragEnd)
      return () => {
        document.removeEventListener("mousemove", onDragMove)
        document.removeEventListener("mouseup", onDragEnd)
      }
    }
  }, [isDragging, onDragMove, onDragEnd])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Check if it's a quick click vs drag intent
    const startTime = Date.now()
    const startX = e.clientX
    const startY = e.clientY

    const checkDragIntent = (moveEvent: MouseEvent) => {
      const distance = Math.sqrt(
        Math.pow(moveEvent.clientX - startX, 2) +
          Math.pow(moveEvent.clientY - startY, 2),
      )

      // If moved more than 5px, it's a drag
      if (distance > 5) {
        document.removeEventListener("mousemove", checkDragIntent)
        document.removeEventListener("mouseup", handleQuickClick)
        onDragStart(e)
      }
    }

    const handleQuickClick = () => {
      document.removeEventListener("mousemove", checkDragIntent)
      document.removeEventListener("mouseup", handleQuickClick)

      // If released quickly without much movement, it's a click
      if (Date.now() - startTime < 200) {
        onClick()
      }
    }

    document.addEventListener("mousemove", checkDragIntent)
    document.addEventListener("mouseup", handleQuickClick)
  }

  // WCAG 2.1.1: Handle keyboard activation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onClick()
    }
  }

  // Hide arrows on mobile - no horizontal dragging on small screens
  const showArrows = !isMobile && (isHovered || isDragging)

  // WCAG 4.1.2: Provide accessible name based on state
  // Include keyboard shortcut hint for discoverability
  const ariaLabel = isOpen ? "Close glossary (Alt+G)" : "Open glossary (Alt+G)"

  return (
    <Box
      id="glossary-button"
      component="button"
      type="button"
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.circle,
        backgroundColor: isOpen
          ? theme.palette.blue.bright
          : theme.palette.common.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isMobile ? "pointer" : isDragging ? "grabbing" : "grab",
        boxShadow: isOpen ? theme.shadow.focusOnLight : theme.shadow.md,
        transition: isDragging ? "none" : theme.transition.default,
        zIndex: theme.zIndex.floating, // Above panel to remain clickable
        userSelect: "none",
        "&:hover": {
          transform: isOpen || isDragging ? "none" : "scale(1.1)",
          boxShadow: isOpen ? theme.shadow.focusOnLight : theme.shadow.lg,
        },
        "&:active": {
          transform: isDragging ? "none" : "scale(0.95)",
        },
        // WCAG 2.4.7: Focus visible styles
        "&:focus-visible": {
          outline: `3px solid ${theme.palette.common.white}`,
          outlineOffset: "3px",
        },
        // Remove default button styles
        border: "none",
        padding: 0,
      }}
    >
      {/* Left arrow */}
      {showArrows && (
        <Box
          sx={{
            position: "absolute",
            left: -20,
            top: "50%",
            marginTop: "-8px", // Half of arrow height (16px) to center
            width: 16,
            height: 16,
            transform: "scaleX(-1)", // Flip horizontally to point left
            opacity: showArrows ? 1 : 0,
            transition: theme.transition.fade,
            pointerEvents: "none",
          }}
        >
          <RoundedRightArrow
            color={
              isOpen ? theme.palette.blue.bright : theme.palette.common.black
            }
          />
        </Box>
      )}

      <MenuBookIcon
        sx={{
          fontSize: "2rem",
          color: theme.palette.common.white,
          pointerEvents: "none", // Prevent icon from interfering with drag
        }}
      />

      {/* Right arrow */}
      {showArrows && (
        <Box
          sx={{
            position: "absolute",
            right: -20,
            top: "50%",
            marginTop: "-8px", // Half of arrow height (16px) to center
            width: 16,
            height: 16,
            opacity: showArrows ? 1 : 0,
            transition: theme.transition.fade,
            pointerEvents: "none",
          }}
        >
          <RoundedRightArrow
            color={
              isOpen ? theme.palette.blue.bright : theme.palette.common.black
            }
          />
        </Box>
      )}
    </Box>
  )
}
