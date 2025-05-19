import React from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, useTheme } from "@mui/material"
import { motion } from "@repo/motion"

// Create a Circle component using Framer Motion
interface AnimatedCircleProps {
  color?: string
  left: string
  top: string
  index: number
  opacity?: number
}

const MotionCircle: React.FC<AnimatedCircleProps> = ({
  color = "#007C9220",
  left,
  top,
  index,
  opacity = 0.3,
}) => {
  // Create different animation paths for variety
  const floatVariants = [
    {
      initial: { x: 50, y: -30, rotate: 5 },
      animate: {
        x: [50, 250, -100, 180, -220, 50],
        y: [-30, -180, 120, -90, 150, -30],
        rotate: [5, 18, -12, 20, -8, 5],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 20,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: -70, y: 40, rotate: -8 },
      animate: {
        x: [-70, -200, 120, -280, 180, -70],
        y: [40, 220, -90, 50, -180, 40],
        rotate: [-8, -24, 15, -5, 12, -8],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 24,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: 120, y: 80, rotate: -5 },
      animate: {
        x: [120, -150, 220, -80, 190, 120],
        y: [80, 180, -150, 210, -60, 80],
        rotate: [-5, 15, -20, 8, -15, -5],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 28,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: -40, y: -120, rotate: 10 },
      animate: {
        x: [-40, 180, -220, 80, -150, -40],
        y: [-120, 50, -200, 160, -80, -120],
        rotate: [10, -5, 22, -15, 8, 10],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 22,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: 90, y: -50, rotate: -12 },
      animate: {
        x: [90, -120, 250, -180, 100, 90],
        y: [-50, 130, -80, 200, -140, -50],
        rotate: [-12, 8, -25, 15, -5, -12],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 26,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: -100, y: 100, rotate: 15 },
      animate: {
        x: [-100, 150, -180, 220, -120, -100],
        y: [100, -130, 180, -70, 150, 100],
        rotate: [15, -12, 20, -8, 10, 15],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 23,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: 60, y: 150, rotate: -18 },
      animate: {
        x: [60, -210, 190, -100, 170, 60],
        y: [150, 30, -170, 190, -120, 150],
        rotate: [-18, 10, -22, 15, -8, -18],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 27,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
    {
      initial: { x: 130, y: -90, rotate: 8 },
      animate: {
        x: [130, -80, 230, -150, 120, 130],
        y: [-90, 140, -180, 80, -220, -90],
        rotate: [8, -15, 20, -10, 25, 8],
        transition: {
          repeat: Infinity,
          repeatType: "loop" as const,
          duration: 25,
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          ease: "linear",
        },
      },
    },
  ]

  // Choose a variation based on the index (with safety check)
  const safeIndex = Math.min(index, floatVariants.length - 1)
  const variant = floatVariants[safeIndex]

  // Default variant if somehow we still don't have one
  const initial = variant?.initial || { x: 0, y: 0, rotate: 0 }
  const animate = variant?.animate || {
    x: [0, 200, -200, 150, -150, 0],
    y: [0, -150, 150, -100, 100, 0],
    rotate: [0, 10, -10, 5, -5, 0],
    transition: {
      repeat: Infinity,
      repeatType: "loop" as const,
      duration: 25,
      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      ease: "linear",
    },
  }

  return (
    <motion.div
      initial={initial}
      animate={animate}
      style={{
        position: "absolute",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        backgroundColor: color.substring(0, 7), // Remove any alpha from the color
        opacity, // Use explicit opacity instead of transparent colors
        left,
        top,
        zIndex: index, // Use index for z-index layering
      }}
    />
  )
}

const IntroSection: React.FC = () => {
  const theme = useTheme()

  return (
    <BasePanel
      id="intro"
      fullHeight
      includeHeaderSpacing
      sx={{
        backgroundColor: "#fff",
        padding: { xs: 3, md: 6 },
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden", // Keep circles contained
      }}
    >
      {/* Animated circles using Framer Motion */}
      <MotionCircle
        color="#007C92"
        left="-5%"
        top="15%"
        index={1}
        opacity={0.15}
      />
      <MotionCircle
        color="#007C92"
        left="65%"
        top="10%"
        index={3}
        opacity={0.25}
      />
      <MotionCircle
        color="#007C92"
        left="20%"
        top="60%"
        index={2}
        opacity={0.2}
      />
      <MotionCircle
        color="#007C92"
        left="75%"
        top="65%"
        index={4}
        opacity={0.15}
      />
      <MotionCircle
        color="#007C92"
        left="40%"
        top="30%"
        index={0}
        opacity={0.1}
      />
      <MotionCircle
        color="#007C92"
        left="85%"
        top="25%"
        index={5}
        opacity={0.18}
      />
      <MotionCircle
        color="#007C92"
        left="15%"
        top="80%"
        index={6}
        opacity={0.12}
      />
      <MotionCircle
        color="#007C92"
        left="50%"
        top="5%"
        index={7}
        opacity={0.22}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          ml: { xs: 3, md: 6 },
          position: "relative", // Make sure text is above circles
          zIndex: 1,
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          LEARN
        </Typography>

        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          EXPLORE
        </Typography>

        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            fontSize: "clamp(2rem, 6vw, 6rem)",
          }}
        >
          EMPOWER
        </Typography>
      </Box>
    </BasePanel>
  )
}

export default IntroSection
