import React, { useRef, useEffect } from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography } from "@mui/material"
import { motion, useMotionValue } from "@repo/motion"
import Image from "next/image"

// Create a Circle component using multiple overlapping harmonic oscillations
interface AnimatedCircleProps {
  imagePath: string  // Path to the image instead of color
  left: string
  top: string
  index: number
  opacity?: number
  size?: number  // Size for the image in pixels
  // Animation parameters - unique for each circle
  freqX1?: number
  freqX2?: number
  freqY1?: number
  freqY2?: number
  phaseX1?: number
  phaseX2?: number
  phaseY1?: number
  phaseY2?: number
  amplitudeX1?: number
  amplitudeX2?: number
  amplitudeY1?: number
  amplitudeY2?: number
}

const ImageCircle: React.FC<AnimatedCircleProps> = ({
  imagePath,
  left,
  top,
  index,
  opacity = 0.7,  // Increased default opacity for images
  size = 300,  // Default size for the images
  // Each circle gets its own unique animation characteristics
  freqX1 = 0.07,
  freqX2 = 0.04,
  freqY1 = 0.05,
  freqY2 = 0.09,
  phaseX1 = 0,
  phaseX2 = 0,
  phaseY1 = 0,
  phaseY2 = 0,
  amplitudeX1 = 40,
  amplitudeX2 = 20,
  amplitudeY1 = 30,
  amplitudeY2 = 25,
}) => {
  // Use refs to store time-related values
  const timeRef = useRef(Math.random() * 100) // Start at random point in animation

  // Create motion values for animation
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Use requestAnimationFrame to create continuous, organic motion
  useEffect(() => {
    let animationId: number

    const animate = () => {
      // Update time value - INCREASED SIGNIFICANTLY for faster motion
      timeRef.current += 0.03 // 6x faster than before

      // Calculate complex, overlapping sine wave motion
      // X position: combine two sine waves with different frequencies and phases
      const newX =
        Math.sin(timeRef.current * freqX1 + phaseX1) * amplitudeX1 +
        Math.sin(timeRef.current * freqX2 + phaseX2) * amplitudeX2

      // Y position: combine two cosine waves with different frequencies and phases
      const newY =
        Math.cos(timeRef.current * freqY1 + phaseY1) * amplitudeY1 +
        Math.cos(timeRef.current * freqY2 + phaseY2) * amplitudeY2

      // Apply new values
      x.set(newX)
      y.set(newY)

      // Continue animation
      animationId = requestAnimationFrame(animate)
    }

    // Start animation
    animationId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [
    amplitudeX1,
    amplitudeX2,
    amplitudeY1,
    amplitudeY2,
    freqX1,
    freqX2,
    freqY1,
    freqY2,
    phaseX1,
    phaseX2,
    phaseY1,
    phaseY2,
    x,
    y,
  ])

  return (
    <motion.div
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",  // Keep circular shape
        opacity,
        left,
        top,
        zIndex: index,
        x, // Apply motion values
        y,
        transformOrigin: "center",
        pointerEvents: "none",
        overflow: "hidden",  // Ensure the image stays within the circular boundary
      }}
    >
      <Image 
        src={`/images/circles/${imagePath}`}
        alt=""
        quality={90}
        fill
        style={{
          objectFit: "cover",
          borderRadius: "50%",
        }}
      />
    </motion.div>
  )
}

const IntroSection: React.FC = () => {
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
        overflow: "visible", // Allow circles to overflow/render fully
      }}
    >
      {/* Background Circles (below text) */}
      <ImageCircle
        imagePath="Untitled-1.png"
        left="-5%"
        top="15%"
        index={0}
        opacity={0.5}
        size={350}
        freqX1={0.08}
        freqX2={0.03}
        freqY1={0.05}
        freqY2={0.02}
        phaseX1={0}
        phaseX2={1.5}
        phaseY1={2.2}
        phaseY2={3.1}
        amplitudeX1={50}
        amplitudeX2={30}
        amplitudeY1={40}
        amplitudeY2={20}
      />
      <ImageCircle
        imagePath="2.png"
        left="65%"
        top="10%"
        index={0}
        opacity={0.6}
        size={300}
        freqX1={0.06}
        freqX2={0.02}
        freqY1={0.04}
        freqY2={0.07}
        phaseX1={1.2}
        phaseX2={3.4}
        phaseY1={0.5}
        phaseY2={2.7}
        amplitudeX1={30}
        amplitudeX2={20}
        amplitudeY1={35}
        amplitudeY2={15}
      />
      <ImageCircle
        imagePath="3.png"
        left="20%"
        top="60%"
        index={0}
        opacity={0.5}
        size={320}
        freqX1={0.05}
        freqX2={0.09}
        freqY1={0.03}
        freqY2={0.06}
        phaseX1={2.1}
        phaseX2={0.8}
        phaseY1={3.0}
        phaseY2={1.4}
        amplitudeX1={40}
        amplitudeX2={25}
        amplitudeY1={30}
        amplitudeY2={35}
      />
      <ImageCircle
        imagePath="4.png"
        left="85%"
        top="25%"
        index={0}
        opacity={0.6}
        size={280}
        freqX1={0.04}
        freqX2={0.075}
        freqY1={0.06}
        freqY2={0.03}
        phaseX1={3.5}
        phaseX2={2.3}
        phaseY1={1.7}
        phaseY2={0.6}
        amplitudeX1={45}
        amplitudeX2={15}
        amplitudeY1={25}
        amplitudeY2={40}
      />

      {/* Text content on top of background circles */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          ml: { xs: 3, md: 6 },
          position: "relative",
          zIndex: 10, // Higher z-index for text
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(4rem, 8vw, 8rem)",
          }}
        >
          LEARN
        </Typography>

        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            mb: 1,
            fontSize: "clamp(4rem, 8vw, 8rem)",
          }}
        >
          EXPLORE
        </Typography>

        <Typography
          variant="h1"
          sx={{
            color: "#007C92",
            fontSize: "clamp(4rem, 8vw, 8rem)",
          }}
        >
          EMPOWER
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#007C92",
          }}
        >
          Explore California&apos;s water system and discover possibilities for
          the future of water in our state.
        </Typography>
      </Box>

      {/* Foreground Circles (above text) */}
      <ImageCircle
        imagePath="3.png"
        left="75%"
        top="65%"
        index={20}
        opacity={0.4}
        size={280}
        freqX1={0.045}
        freqX2={0.085}
        freqY1={0.07}
        freqY2={0.04}
        phaseX1={1.9}
        phaseX2={3.2}
        phaseY1={0.7}
        phaseY2={2.5}
        amplitudeX1={35}
        amplitudeX2={25}
        amplitudeY1={45}
        amplitudeY2={20}
      />
      <ImageCircle
        imagePath="2.png"
        left="40%"
        top="30%"
        index={20}
        opacity={0.3}
        size={320}
        freqX1={0.065}
        freqX2={0.035}
        freqY1={0.08}
        freqY2={0.05}
        phaseX1={2.8}
        phaseX2={0.9}
        phaseY1={3.6}
        phaseY2={1.3}
        amplitudeX1={20}
        amplitudeX2={40}
        amplitudeY1={30}
        amplitudeY2={25}
      />
      <ImageCircle
        imagePath="Untitled-1.png"
        left="15%"
        top="80%"
        index={20}
        opacity={0.4}
        size={300}
        freqX1={0.055}
        freqX2={0.025}
        freqY1={0.09}
        freqY2={0.045}
        phaseX1={0.4}
        phaseX2={2.6}
        phaseY1={1.8}
        phaseY2={3.3}
        amplitudeX1={45}
        amplitudeX2={20}
        amplitudeY1={25}
        amplitudeY2={30}
      />
      <ImageCircle
        imagePath="4.png"
        left="50%"
        top="5%"
        index={20}
        opacity={0.5}
        size={260}
        freqX1={0.035}
        freqX2={0.065}
        freqY1={0.055}
        freqY2={0.08}
        phaseX1={3.7}
        phaseX2={1.1}
        phaseY1={2.4}
        phaseY2={0.3}
        amplitudeX1={25}
        amplitudeX2={35}
        amplitudeY1={20}
        amplitudeY2={40}
      />
    </BasePanel>
  )
}

export default IntroSection
