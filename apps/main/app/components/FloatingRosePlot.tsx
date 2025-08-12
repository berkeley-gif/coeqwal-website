"use client"

import { motion } from "@repo/motion"
import { Box } from "@repo/ui/mui"
import { SxProps, Theme } from "@mui/material/styles"

interface FloatingRosePlotProps {
  top: string // e.g. "25%" or "65px"
  left?: string | Record<string, string> // responsive left positioning
  right?: string | Record<string, string> // responsive right positioning
  size?: number | string | Record<string, number | string> // responsive size
  quarterIndex: number // 0-3 to determine which quarter pattern to use
}

export default function FloatingRosePlot({
  left,
  right,
  top,
  size = 80,
  quarterIndex,
}: FloatingRosePlotProps) {
  // Four specific colors for the rose plots
  const colors = ["5D9BE2", "A9D0BF", "FFAC6E", "9793B3"] // Blue, Mint, Orange, Purple
  
  // Generate different radii for each quarter (as percentages of the base size)
  const radii = [0.8, 0.6, 0.9, 0.7] // Different radii for variety
  
  // Generate random parameters for each rose plot to create unique movement
  const bobDelay = Math.random() * 3 // 0-3 seconds
  const driftDelay = Math.random() * 5 // 0-5 seconds
  const bobAmount = 8 + Math.random() * 8 // 8-16px vertical movement
  const driftAmount = 15 + Math.random() * 15 // 15-30px horizontal drift
  const bobDuration = 3 + Math.random() * 2 // 3-5 seconds
  const driftDuration = 8 + Math.random() * 6 // 8-14 seconds

  // Create responsive sx props
  const sxProps: SxProps<Theme> = {
    position: "absolute",
    top,
    ...(left && { left }),
    ...(right && { right }),
    // Handle responsive size
    width:
      typeof size === "object"
        ? Object.fromEntries(
            Object.entries(size).map(([key, value]) => [
              key,
              typeof value === "number" ? `${value}px` : value,
            ]),
          )
        : typeof size === "number"
          ? `${size}px`
          : size,
    height:
      typeof size === "object"
        ? Object.fromEntries(
            Object.entries(size).map(([key, value]) => [
              key,
              typeof value === "number" ? `${value}px` : value,
            ]),
          )
        : typeof size === "number"
          ? `${size}px`
          : size,
  }

  // Create SVG path for quarter circle with specific radius
  const createQuarterPath = (startAngle: number, radius: number) => {
    const centerX = 0
    const centerY = 0
    const endAngle = startAngle + 90 // 90 degrees for each quarter
    
    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180
    const endRad = (endAngle * Math.PI) / 180
    
    // Calculate start and end points
    const x1 = centerX + radius * Math.cos(startRad)
    const y1 = centerY + radius * Math.sin(startRad)
    const x2 = centerX + radius * Math.cos(endRad)
    const y2 = centerY + radius * Math.sin(endRad)
    
    // Create arc path
    const largeArcFlag = 0 // Always 0 for 90-degree arcs
    const sweepFlag = 1 // Clockwise direction
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2} Z`
  }

  return (
    <Box
      component={motion.div}
      sx={sxProps}
      animate={{
        // Vertical bobbing motion
        y: [0, -bobAmount, 0],
        // Horizontal drifting motion
        x: [-driftAmount / 2, driftAmount / 2, -driftAmount / 2],
        // Subtle rotation for more organic movement
        rotate: [-2, 2, -2],
      }}
      transition={{
        y: {
          duration: bobDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay,
        },
        x: {
          duration: driftDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: driftDelay,
        },
        rotate: {
          duration: bobDuration * 1.3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: bobDelay * 0.7,
        },
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="-25 -25 50 50"
        style={{ pointerEvents: "none" }}
      >
        {/* Four quarters with different radii and colors */}
        {[0, 1, 2, 3].map((quarter) => {
          const angle = quarter * 90 // 0°, 90°, 180°, 270°
          const radius = radii[quarter] * 20 // Scale to viewBox
          const colorIndex = (quarterIndex + quarter) % colors.length
          const color = colors[colorIndex]
          
          return (
            <path
              key={quarter}
              d={createQuarterPath(angle, radius)}
              fill={`#${color}`}
              stroke="none"
              opacity={0.8}
            />
          )
        })}
      </svg>
    </Box>
  )
}
