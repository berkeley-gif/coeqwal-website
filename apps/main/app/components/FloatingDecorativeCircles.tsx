"use client"

import { Box } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { generateFloatingAnimation } from "../utils/floatingAnimation"

interface Circle {
  size: number // in vw units
  top: string
  left: string
  color: "white" | "blue"
  opacity?: number
}

interface FloatingDecorativeCirclesProps {
  circles: Circle[]
  zIndex?: number
}

/**
 * Renders floating ambient circles with animation
 */
export function FloatingDecorativeCircles({
  circles,
  zIndex = 1,
}: FloatingDecorativeCirclesProps) {
  const getBackgroundColor = (color: "white" | "blue", opacity = 0.1) => {
    if (color === "white") return `rgba(255, 255, 255, ${opacity})`
    return `rgba(42, 82, 135, ${opacity * 2})` // Blue circles use 2x opacity
  }

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
      }}
    >
      {circles.map((circle, index) => (
        <Box
          key={`decorative-circle-${index}`}
          component={motion.div}
          {...generateFloatingAnimation(circle.size)}
          sx={{
            position: "absolute",
            width: `${circle.size}vw`,
            height: `${circle.size}vw`,
            top: circle.top,
            left: circle.left,
            borderRadius: "50%",
            backgroundColor: getBackgroundColor(circle.color, circle.opacity),
          }}
        />
      ))}
    </Box>
  )
}
