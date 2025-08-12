"use client"

import { motion } from "@repo/motion"
import { Box } from "@repo/ui/mui"
import { SxProps, Theme } from "@mui/material/styles"

interface FloatingCircleProps {
  top: string // e.g. "25%" or "65px"
  left?: string | Record<string, string> // responsive left positioning
  right?: string | Record<string, string> // responsive right positioning
  size?: number | string | Record<string, number | string> // responsive size
  innerColor: string // hex color for inner circle
  outerColor: string // hex color for outer circle
}

export default function FloatingCircle({
  left,
  right,
  top,
  size = 80,
  innerColor,
  outerColor,
}: FloatingCircleProps) {
  // Generate random parameters for each circle to create unique movement
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
        rotate: [-1, 1, -1],
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
      {/* Outer circle */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          backgroundColor: outerColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {/* Inner circle */}
        <Box
          sx={{
            width: "60%", // Inner circle is 60% of outer circle
            height: "60%",
            borderRadius: "50%",
            backgroundColor: innerColor,
            pointerEvents: "none",
          }}
        />
      </Box>
    </Box>
  )
}
