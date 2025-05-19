import React, { useEffect, useState } from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, useTheme } from "@mui/material"
import { keyframes } from "@emotion/react"

// Define float animations
const float1 = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(100px, -50px) rotate(10deg); }
  66% { transform: translate(-50px, 100px) rotate(-5deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
`

const float2 = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-120px, 80px) rotate(-15deg); }
  66% { transform: translate(70px, 30px) rotate(8deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
`

const float3 = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(80px, 100px) rotate(5deg); }
  66% { transform: translate(-90px, -40px) rotate(-10deg); }
  100% { transform: translate(0, 0) rotate(0deg); }
`

// Create a Circle component for better organization
interface AnimatedCircleProps {
  size?: number
  color?: string
  left: string
  top: string
  animation: ReturnType<typeof keyframes>
  duration: number
}

const AnimatedCircle: React.FC<AnimatedCircleProps> = ({
  size = 300,
  color = "#007C9220",
  left,
  top,
  animation,
  duration,
}) => (
  <Box
    sx={{
      position: "absolute",
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      backgroundColor: color,
      left,
      top,
      animation: `${animation} ${duration}s ease-in-out infinite`,
      zIndex: 0,
      mixBlendMode: "multiply",
    }}
  />
)

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
      {/* Animated circles */}
      <AnimatedCircle
        size={300}
        color="#007C9215"
        left="10%"
        top="20%"
        animation={float1}
        duration={25}
      />
      <AnimatedCircle
        size={300}
        color="#007C9210"
        left="60%"
        top="30%"
        animation={float2}
        duration={32}
      />
      <AnimatedCircle
        size={300}
        color="#007C9218"
        left="30%"
        top="60%"
        animation={float3}
        duration={28}
      />
      <AnimatedCircle
        size={300}
        color="#007C9212"
        left="70%"
        top="70%"
        animation={float1}
        duration={22}
      />
      <AnimatedCircle
        size={300}
        color="#007C920A"
        left="-10%"
        top="-10%"
        animation={float2}
        duration={38}
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
