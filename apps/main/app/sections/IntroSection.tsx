import React, { useState, useEffect, useRef } from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography } from "@mui/material"
import { motion, useMotionValue } from "@repo/motion"
import Image from "next/image"

// Create a Circle component using multiple overlapping harmonic oscillations
interface AnimatedCircleProps {
  imagePath: string // Path to the image instead of color
  left: string
  top: string
  index: number
  opacity?: number
  size?: number // Size for the image in pixels
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
  opacity = 1, // Changed from 0.7 to 1 for full opacity
  size = 300, // Default size for the images
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
        borderRadius: "50%", // Keep circular shape
        opacity,
        left,
        top,
        zIndex: index,
        x, // Apply motion values
        y,
        transformOrigin: "center",
        pointerEvents: "none",
        overflow: "hidden", // Ensure the image stays within the circular boundary
      }}
    >
      <Image
        src={`/images/circular-crops/${imagePath}`}
        alt=""
        quality={90}
        fill
        style={{
          objectFit: "cover",
          borderRadius: "50%",
          width: "100%",
          height: "100%",
          objectPosition: "center",
        }}
        sizes={`${size}px`} // Add sizes attribute to help next/image optimize
      />
    </motion.div>
  )
}

// List of all available images in the circular-crops directory
const circularImages = [
  "2.png",
  "3.png",
  "4.png",
  "Untitled-1.png",
  "DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
  "DWR_2020_10_13_FL_Lookout_Slough-0252.jpg",
  "DWR_2021_06_22_KG_9189_water_texture.jpg",
  "DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
  "DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
  "DWR_2024_09_27_XM_0691_Native_American_Day.jpg",
  "DWR_2025_03_11_NS_0036_Oroville_Lake_Levels.jpg",
  "DWR_CC_salmon_underH20-5_10_15_2012.jpg",
  "DWR_FL_Caltrans_Sign-7163.jpg"
]

// Function to generate a random value within a range
const getRandomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

// Function to generate random circle configuration
const generateRandomCircleProps = (imagePath: string, isBackground: boolean): AnimatedCircleProps => {
  // Position the circle randomly, but keep it visible on the screen
  const left = `${getRandomInRange(-10, 90)}%`
  const top = `${getRandomInRange(0, 80)}%`
  
  // Determine z-index based on whether it's a background or foreground circle
  const index = isBackground ? 0 : 20
  
  // Random size within specified range (smaller for better aesthetic)
  const size = getRandomInRange(250, 320)
  
  // Generate random animation parameters
  const freqX1 = getRandomInRange(0.03, 0.09)
  const freqX2 = getRandomInRange(0.02, 0.08)
  const freqY1 = getRandomInRange(0.03, 0.09)
  const freqY2 = getRandomInRange(0.02, 0.08)
  
  // Random phases for more variation
  const phaseX1 = getRandomInRange(0, 3.5)
  const phaseX2 = getRandomInRange(0, 3.5)
  const phaseY1 = getRandomInRange(0, 3.5)
  const phaseY2 = getRandomInRange(0, 3.5)
  
  // Random amplitudes for motion
  const amplitudeX1 = getRandomInRange(20, 50)
  const amplitudeX2 = getRandomInRange(15, 40)
  const amplitudeY1 = getRandomInRange(20, 45)
  const amplitudeY2 = getRandomInRange(15, 40)
  
  return {
    imagePath,
    left,
    top,
    index,
    opacity: 1,
    size,
    freqX1,
    freqX2,
    freqY1,
    freqY2,
    phaseX1,
    phaseX2,
    phaseY1,
    phaseY2,
    amplitudeX1,
    amplitudeX2,
    amplitudeY1,
    amplitudeY2
  }
}

const IntroSection: React.FC = () => {
  // State to store the generated circles
  const [backgroundCircles, setBackgroundCircles] = useState<AnimatedCircleProps[]>([])
  const [foregroundCircles, setForegroundCircles] = useState<AnimatedCircleProps[]>([])
  
  // Generate circles on initial render
  useEffect(() => {
    // Shuffle the images array to randomize which images are used
    const shuffledImages = [...circularImages].sort(() => Math.random() - 0.5)
    
    // Create 4 background circles
    const bgCircles = shuffledImages.slice(0, 4).map(img => 
      generateRandomCircleProps(img, true)
    )
    
    // Create 4 foreground circles (using different images)
    const fgCircles = shuffledImages.slice(4, 8).map(img => 
      generateRandomCircleProps(img, false)
    )
    
    setBackgroundCircles(bgCircles)
    setForegroundCircles(fgCircles)
  }, [])

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
      {backgroundCircles.map((circle, index) => (
        <ImageCircle key={`bg-circle-${index}`} {...circle} />
      ))}

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
      {foregroundCircles.map((circle, index) => (
        <ImageCircle key={`fg-circle-${index}`} {...circle} />
      ))}
    </BasePanel>
  )
}

export default IntroSection
