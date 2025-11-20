"use client"

import { Box, useTheme, MenuBookIcon } from "@repo/ui/mui"
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
 * Draggable to reposition the glossary anywhere on the viewport
 */
export function FloatingGlossaryButton({ 
  onClick, 
  isOpen, 
  position,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging
}: FloatingGlossaryButtonProps) {
  const theme = useTheme()
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
        Math.pow(moveEvent.clientY - startY, 2)
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

  const showArrows = isHovered || isDragging

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "fixed",
        bottom: position.bottom,
        right: position.right,
        width: 64,
        height: 64,
        borderRadius: "50%",
        backgroundColor: isOpen ? theme.palette.blue.bright : "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow: isOpen 
          ? "0 0 0 4px rgba(33, 150, 243, 0.2)" 
          : "0 4px 20px rgba(0, 0, 0, 0.3)",
        transition: isDragging ? "none" : "all 0.3s ease",
        zIndex: theme.zIndex.drawer, // Above panel to remain clickable
        userSelect: "none",
        "&:hover": {
          transform: isOpen || isDragging ? "none" : "scale(1.1)",
          boxShadow: isOpen 
            ? "0 0 0 4px rgba(33, 150, 243, 0.3)" 
            : "0 6px 24px rgba(0, 0, 0, 0.4)",
        },
        "&:active": {
          transform: isDragging ? "none" : "scale(0.95)",
        },
      }}
    >
      {/* Left arrow (pointing left) - outside button radius */}
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
            transition: "opacity 0.2s ease",
            pointerEvents: "none",
          }}
        >
          <RoundedRightArrow color="#fff" />
        </Box>
      )}

      <MenuBookIcon
        sx={{
          fontSize: "2rem",
          color: "#fff",
          pointerEvents: "none", // Prevent icon from interfering with drag
        }}
      />

      {/* Right arrow (pointing right) - outside button radius */}
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
            transition: "opacity 0.2s ease",
            pointerEvents: "none",
          }}
        >
          <RoundedRightArrow color="#fff" />
        </Box>
      )}
    </Box>
  )
}

