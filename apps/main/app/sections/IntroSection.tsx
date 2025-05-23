import React, { useState, useEffect, useRef } from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@mui/material"
import { motion, useMotionValue } from "@repo/motion"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { useDrawerStore } from "@repo/state"

// Create a Circle component using multiple overlapping harmonic oscillations
interface AnimatedCircleProps {
  imagePath: string
  left: string
  top: string
  index: number
  opacity?: number
  size?: number
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
  opacity = 1,
  size = 300,
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
        width: `${size + 40}px`, // halo
        height: `${size + 40}px`, // halo
        borderRadius: "50%",
        opacity,
        left,
        top,
        zIndex: index,
        x,
        y,
        transformOrigin: "center",
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.16)", // Semi-transparent white halo
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          overflow: "hidden",
          position: "relative",
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
          sizes={`${size}px`}
        />
      </div>
    </motion.div>
  )
}

// List of all available images in the circular-crops directory
// This list exactly matches what's in the directory (verified via ls command)
const availableImages = [
  "6.png",
  "2.png",
  "4.png",
  "8.png",
  "9.png",
  "11.png",
  "12.png",
  "14.png",
]

// Function to generate a random value within a range
// const getRandomInRange = (min: number, max: number): number => {
//   return Math.random() * (max - min) + min
// }

// Clear configuration for circle positions - easy to edit
const circlePositions = {
  // Background circles (appear behind text)
  background: [
    { left: "25%", top: "10%" },
    { left: "40%", top: "5%" },
    { left: "60%", top: "15%" },
    { left: "80%", top: "10%" },
    { left: "50%", top: "45%" },
  ],

  // Foreground circles (appear in front of text)
  foreground: [
    { left: "35%", top: "65%" },
    { left: "60%", top: "70%" },
    { left: "70%", top: "50%" },
  ],
}

// Keep these for backward compatibility
const backgroundPositions = circlePositions.background
const foregroundPositions = circlePositions.foreground

// Function to generate fixed circle configuration
const generateFixedCircleProps = (
  imagePath: string,
  isBackground: boolean,
  positionIndex: number,
): AnimatedCircleProps => {
  // Use predefined positions based on whether it's a background or foreground circle
  const positions = isBackground ? backgroundPositions : foregroundPositions
  // Ensure position index is within bounds
  const safeIndex = positionIndex % positions.length
  // Default position as fallback in case positions array is somehow empty
  const defaultPosition = { left: "50%", top: "50%" }
  const position = positions[safeIndex] || defaultPosition

  console.log(
    `Creating ${isBackground ? "background" : "foreground"} circle at position:`,
    position,
  )

  // Determine z-index based on whether it's a background or foreground circle
  const index = isBackground ? 0 : 20

  // Fixed size with small variation
  const size = 280 + positionIndex * 10

  // Generate animation parameters with consistent variation
  const baseFreq = 0.05
  const freqX1 = baseFreq + positionIndex * 0.01
  const freqX2 = baseFreq - positionIndex * 0.005
  const freqY1 = baseFreq + positionIndex * 0.008
  const freqY2 = baseFreq + positionIndex * 0.012

  // Fixed phases with variation based on position index
  const basePhase = positionIndex * 0.8
  const phaseX1 = basePhase
  const phaseX2 = basePhase + 1.2
  const phaseY1 = basePhase + 0.5
  const phaseY2 = basePhase + 1.8

  // Fixed amplitudes with small variations
  const baseAmplitude = 30
  const amplitudeX1 = baseAmplitude + positionIndex * 3
  const amplitudeX2 = baseAmplitude - positionIndex * 2
  const amplitudeY1 = baseAmplitude + positionIndex * 2
  const amplitudeY2 = baseAmplitude - positionIndex * 1

  return {
    imagePath,
    left: position.left,
    top: position.top,
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
    amplitudeY2,
  }
}

// Function to generate random circle configuration
// const generateRandomCircleProps = (
//   imagePath: string,
//   isBackground: boolean,
// ): AnimatedCircleProps => {
//   // Position the circle randomly, but keep it visible on the screen
//   const left = `${getRandomInRange(-10, 90)}%`
//   const top = `${getRandomInRange(0, 80)}%`

//   // Determine z-index based on whether it's a background or foreground circle
//   const index = isBackground ? 0 : 20

//   // Random size within specified range (smaller for better aesthetic)
//   const size = getRandomInRange(250, 320)

//   // Generate random animation parameters
//   const freqX1 = getRandomInRange(0.03, 0.09)
//   const freqX2 = getRandomInRange(0.02, 0.08)
//   const freqY1 = getRandomInRange(0.03, 0.09)
//   const freqY2 = getRandomInRange(0.02, 0.08)

//   // Random phases for more variation
//   const phaseX1 = getRandomInRange(0, 3.5)
//   const phaseX2 = getRandomInRange(0, 3.5)
//   const phaseY1 = getRandomInRange(0, 3.5)
//   const phaseY2 = getRandomInRange(0, 3.5)

//   // Random amplitudes for motion
//   const amplitudeX1 = getRandomInRange(20, 50)
//   const amplitudeX2 = getRandomInRange(15, 40)
//   const amplitudeY1 = getRandomInRange(20, 45)
//   const amplitudeY2 = getRandomInRange(15, 40)

//   return {
//     imagePath,
//     left,
//     top,
//     index,
//     opacity: 1,
//     size,
//     freqX1,
//     freqX2,
//     freqY1,
//     freqY2,
//     phaseX1,
//     phaseX2,
//     phaseY1,
//     phaseY2,
//     amplitudeX1,
//     amplitudeX2,
//     amplitudeY1,
//     amplitudeY2,
//   }
// }

// Circle component for background white circles
interface WhiteCircleProps {
  left: string
  top: string
  size: number
  opacity: number
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

const WhiteCircle: React.FC<WhiteCircleProps> = ({
  left,
  top,
  size,
  opacity,
  freqX1 = 0.05,
  freqX2 = 0.03,
  freqY1 = 0.04,
  freqY2 = 0.06,
  phaseX1 = 0,
  phaseX2 = 0,
  phaseY1 = 0,
  phaseY2 = 0,
  amplitudeX1 = 20,
  amplitudeX2 = 15,
  amplitudeY1 = 25,
  amplitudeY2 = 18,
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
      // Update time value - increase speed from 0.015 to 0.025 for more visible motion
      timeRef.current += 0.025

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
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        opacity,
        left,
        top,
        zIndex: 0, // Very low z-index to ensure it's behind everything
        pointerEvents: "none",
        x,
        y,
        transformOrigin: "center",
      }}
    />
  )
}

const IntroSection: React.FC = () => {
  const { t } = useTranslation()
  // State to store the generated circles
  const [backgroundCircles, setBackgroundCircles] = useState<
    AnimatedCircleProps[]
  >([])
  // State for white background mood circles
  const [whiteCircles, setWhiteCircles] = useState<WhiteCircleProps[]>([])

  // Generate white background circles on initial render
  useEffect(() => {
    // Create 16 total white circles with a gradient opacity effect
    const circles: WhiteCircleProps[] = []

    // For main intro section (top section) - create 15 circles in a grid pattern
    const gridColumns = 5
    const gridRows = 3

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridColumns; col++) {
        // Skip some cells for more natural distribution
        if (Math.random() > 0.9) continue

        // Calculate base position with a grid cell
        const baseLeft = (col / gridColumns) * 100
        const baseTop = (row / gridRows) * 90 // Keep in top 90%

        // Add some controlled randomness within each cell
        const leftOffset = Math.random() * 0.8 * (100 / gridColumns)
        const topOffset = Math.random() * 0.8 * (90 / gridRows)

        const left = `${baseLeft + leftOffset}%`
        const top = `${baseTop + topOffset}%`

        // Size with some variation but more controlled
        const size = 180 + Math.random() * 320

        // Opacity - gradient effect that decreases with row
        let opacity
        if (row === 0) {
          // Top row - more visible
          opacity = 0.06 + Math.random() * 0.08
        } else if (row === 1) {
          // Middle row - medium visibility
          opacity = 0.04 + Math.random() * 0.05
        } else {
          // Bottom row - subtle
          opacity = 0.01 + Math.random() * 0.04
        }

        // Add animation parameters with slight variations
        const freqBase = 0.03 + Math.random() * 0.03
        const phaseBase = Math.random() * Math.PI * 2
        const amplitudeBase = 25 + Math.random() * 20 // Increased from 15 to 25 base amplitude

        circles.push({
          left,
          top,
          size,
          opacity,
          freqX1: freqBase + Math.random() * 0.01,
          freqX2: freqBase - Math.random() * 0.01,
          freqY1: freqBase + Math.random() * 0.02,
          freqY2: freqBase - Math.random() * 0.01,
          phaseX1: phaseBase,
          phaseX2: phaseBase + Math.PI / 2,
          phaseY1: phaseBase + Math.PI / 4,
          phaseY2: phaseBase + Math.PI / 3,
          amplitudeX1: amplitudeBase + Math.random() * 10, // Increased amplitude
          amplitudeX2: amplitudeBase - Math.random() * 5,
          amplitudeY1: amplitudeBase + Math.random() * 12, // Increased amplitude
          amplitudeY2: amplitudeBase - Math.random() * 3,
        })
      }
    }

    // For interstitial section (bottom section) - create just 1 circle, well-positioned
    circles.push({
      left: `${30 + Math.random() * 40}%`, // Center-ish horizontally
      top: `${110 + Math.random() * 10}%`, // Just below the fold
      size: 250 + Math.random() * 150, // Medium-large size
      opacity: 0.02 + Math.random() * 0.02, // Very subtle
      // Add gentler animation for the lower circle
      freqX1: 0.02,
      freqX2: 0.015,
      freqY1: 0.025,
      freqY2: 0.018,
      amplitudeX1: 15,
      amplitudeX2: 10,
      amplitudeY1: 12,
      amplitudeY2: 8,
    })

    setWhiteCircles(circles)
  }, [])

  // Generate circles on initial render - using only available images
  useEffect(() => {
    // Select consistent images from the available ones
    // Using 8 total circles for all positions (background + foreground)
    const selectedImages = [...availableImages].slice(0, 8)

    // Create circles with all positions (background + foreground) for the background
    const allPositions = [
      ...circlePositions.background,
      ...circlePositions.foreground,
    ]
    const bgCircles = selectedImages.map((img, index) => {
      // Use the position index to determine which position to use
      const positionIndex = index % allPositions.length
      const position = allPositions[positionIndex] || {
        left: "50%",
        top: "50%",
      }
      // Call generateFixedCircleProps with the correct values
      return {
        ...generateFixedCircleProps(img, true, index),
        // Override the position with the exact one from allPositions
        left: position.left,
        top: position.top,
      }
    })

    setBackgroundCircles(bgCircles)
  }, [])

  return (
    <Box
      id="intro"
      sx={{
        position: "relative",
        // background: "linear-gradient(to bottom, #D1DDD9, #c0e3ff, #459ede)",
        background: "linear-gradient(to bottom, #218dba, #218dba, #459ede)",
        backgroundSize: "100% 100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Background images */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        {/* White background mood circles */}
        {whiteCircles.map((circle, index) => (
          <WhiteCircle key={`white-circle-${index}`} {...circle} />
        ))}

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "60%",
            height: "130%", // Set to a reasonable percentage of viewport height
            transform: "translateX(-16.67%)",
          }}
        >
          <Image
            src="/images/home_collage/left_side.png"
            alt=""
            fill
            quality={100}
            priority
            sizes="75vw"
            style={{
              objectFit: "contain",
              objectPosition: "left bottom",
              pointerEvents: "none",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "60%",
            height: "130%", // Set to a reasonable percentage of viewport height
            transform: "translateX(5%)",
          }}
        >
          <Image
            src="/images/home_collage/right_side.png"
            alt=""
            fill
            quality={100}
            priority
            sizes="75vw"
            style={{
              objectFit: "contain",
              objectPosition: "right bottom",
              pointerEvents: "none",
            }}
          />
        </Box>

        {/* <Box
          sx={{
            position: "absolute",
            top: "100vh",
            left: 0,
            width: "100%",
            height: "80%",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <Image
            src="/images/home_collage/birds_top.png"
            alt=""
            fill
            quality={100}
            priority
            sizes="100vw"
            style={{
              objectFit: "contain",
              objectPosition: "top center",
              pointerEvents: "none",
              // transform: "scale(1.3)",
            }}
          />
        </Box> */}
      </Box>

      {/* First section with bubbles - limited to 100vh */}
      <BasePanel
        fullHeight
        includeHeaderSpacing
        sx={{
          padding: { xs: 3, md: 6 },
          height: "100vh",
          minHeight: "100vh",
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          overflow: "visible",
          backgroundColor: "transparent",
        }}
      >
        {/* Background Circles (below text) - contained within the first 100vh */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          {backgroundCircles.map((circle, index) => (
            <ImageCircle key={`bg-circle-${index}`} {...circle} />
          ))}
        </Box>

        {/* Text content on top of background circles */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            ml: { xs: 3, md: 6 },
            position: "relative",
            zIndex: 10, // Higher z-index for text
            mt: { xs: 6, md: 12 }, // Hack: dd top margin to push the text content down
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "white",
              mb: 3, // 32px spacing
              fontSize: "100px",
              fontWeight: 600,
              lineHeight: 0.8,
              // textShadow:
              //   "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0px 0px 3px rgba(255,255,255,0.3)",
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            className="inter-font"
          >
            Learn.
          </Typography>

          <Typography
            variant="h1"
            sx={{
              color: "white",
              mb: 3,
              fontSize: "100px",
              fontWeight: 600,
              lineHeight: 0.8,
              // textShadow:
              //   "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0px 0px 3px rgba(255,255,255,0.3)",
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            className="inter-font"
          >
            Explore.
          </Typography>

          <Typography
            variant="h1"
            sx={{
              color: "white",
              mb: 4, // 32px spacing
              fontSize: "100px",
              fontWeight: 600,
              lineHeight: 0.8,
              // textShadow:
              //   "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0px 0px 3px rgba(255,255,255,0.3)",
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            className="inter-font"
          >
            Empower.
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: "white",
              mt: 2, // 16px top margin
              fontSize: "56px",
              fontWeight: 500,
              lineHeight: 0.8,
              // textShadow:
              //   "-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0px 0px 3px rgba(255,255,255,0.3)",
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
            className="inter-font"
          >
            Rethink California Water
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "white",
              mt: 3,
              maxWidth: "500px",
            }}
          >
            Explore California&apos;s water system and discover
            <br />
            possibilities for the future of water in our state.
          </Typography>

          {/* Play arrow icon pointing down */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "500px",
              mt: 0,
            }}
          >
            <PlayArrowIcon
              sx={{
                color: "white",
                fontSize: 50,
                transform: "rotate(90deg)",
                // filter:
                //   "drop-shadow(-0.5px -0.5px 0 white) drop-shadow(0.5px -0.5px 0 white) drop-shadow(-0.5px 0.5px 0 white) drop-shadow(0.5px 0.5px 0 white)",
                // cursor: "pointer",
                pointerEvents: "auto",
              }}
              onClick={() => {
                // Scroll to the interstitial section using its ID
                const interstitialSection =
                  document.getElementById("interstitial")
                if (interstitialSection) {
                  interstitialSection.scrollIntoView({ behavior: "smooth" })
                }
              }}
            />
          </Box>
        </Box>

        {/* Foreground Circles section is kept for code structure but not rendering any circles */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 15,
            pointerEvents: "none",
          }}
        >
          {/* No foreground circles rendered */}
        </Box>
      </BasePanel>

      {/* Second section with interstitial content - flows naturally after the first section */}
      <BasePanel
        id="interstitial"
        fullHeight={false}
        paddingVariant="wide"
        includeHeaderSpacing={false}
        sx={{
          color: (theme) => theme.palette.primary.dark,
          alignItems: "left",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "relative",
          backgroundColor: "transparent", // No background image here anymore since it's on the parent
          minHeight: "100vh",
          paddingTop: "400px", // Add substantial top padding to create more space
        }}
      >
        {/* Content container for proper blending context */}
        <Box
          sx={{
            position: "relative",
            isolation: "isolate", // Create a stacking context
            width: "100%",
            height: "100%",
          }}
        >
          {/* Text content with mix-blend-mode */}
          <Box
            maxWidth="876px"
            sx={{
              position: "relative",
              zIndex: 10,
              mb: 20,
            }}
          >
            <Stack spacing={4}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 500,
                  color: "white",
                }}
              >
                What is California&apos;s water future?
              </Typography>
              <Typography variant="body2" color="white">
                {t("interstitial.part1")
                  .split("conveyance")
                  .map((part, i, array) => {
                    // If this is the last part, no need to add the highlighted word
                    if (i === array.length - 1) return part

                    return (
                      <React.Fragment key={i}>
                        {part}
                        <Box
                          component="span"
                          sx={{
                            backgroundColor: "#257dbd",
                            color: "white",
                            px: 1,
                            py: 0.3,
                            mx: 0.1,
                            borderRadius: 1,
                            cursor: "pointer",
                            display: "inline-block",
                            position: "relative", // Add explicit position
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with conveyance term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Conveyance",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          conveyance
                        </Box>
                      </React.Fragment>
                    )
                  })}
              </Typography>
              <Typography variant="body2" color="white">
                {(() => {
                  const text = t("interstitial.part2")

                  // First check for COEQWAL and split if found
                  const coeqwalIndex = text.indexOf("COEQWAL")
                  if (coeqwalIndex !== -1) {
                    // Text before COEQWAL
                    const beforeText = text.substring(0, coeqwalIndex)

                    // Get text after COEQWAL to look for "scenarios"
                    const afterCoeqwalText = text.substring(coeqwalIndex + 7) // 7 is length of "COEQWAL"

                    // Look for "scenarios" in the remaining text
                    const scenariosIndex = afterCoeqwalText.indexOf("scenarios")

                    if (scenariosIndex !== -1) {
                      // Text between COEQWAL and scenarios
                      const betweenText = afterCoeqwalText.substring(
                        0,
                        scenariosIndex,
                      )

                      // Text after scenarios
                      const afterScenariosText = afterCoeqwalText.substring(
                        scenariosIndex + 9,
                      ) // 9 is length of "scenarios"

                      return (
                        <>
                          {beforeText}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "#257dbd",
                              color: "white",
                              px: 1,
                              py: 0.3,
                              mx: 0.1,
                              borderRadius: 1,
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative", // Add explicit position
                              "&:hover": {
                                backgroundColor: "#13629b",
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with COEQWAL term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "COEQWAL",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            COEQWAL
                          </Box>
                          {betweenText}
                          <Box
                            component="span"
                            sx={{
                              backgroundColor: "#257dbd", // Same as conveyance background
                              color: "white",
                              px: 1,
                              py: 0.3,
                              mx: 0.1,
                              borderRadius: 1,
                              cursor: "pointer",
                              display: "inline-block",
                              position: "relative", // Add explicit position
                              "&:hover": {
                                backgroundColor: "#13629b", // Same hover color as conveyance
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with Scenarios term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Scenarios",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            scenarios
                          </Box>
                          {afterScenariosText}
                        </>
                      )
                    }

                    // If scenarios not found, just highlight COEQWAL
                    return (
                      <>
                        {beforeText}
                        <Box
                          component="span"
                          sx={{
                            backgroundColor: "#257dbd",
                            color: "white",
                            px: 1,
                            py: 0.3,
                            mx: 0.1,
                            borderRadius: 1,
                            cursor: "pointer",
                            display: "inline-block",
                            position: "relative", // Add explicit position
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with COEQWAL term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "COEQWAL",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          COEQWAL
                        </Box>
                        {afterCoeqwalText}
                      </>
                    )
                  }

                  // If COEQWAL not found, check for scenarios only
                  const scenariosIndex = text.indexOf("scenarios")
                  if (scenariosIndex !== -1) {
                    // Split into three parts: before, the word itself, and after
                    const beforeText = text.substring(0, scenariosIndex)
                    const afterText = text.substring(scenariosIndex + 9) // 9 is length of "scenarios"

                    return (
                      <>
                        {beforeText}
                        <Box
                          component="span"
                          sx={{
                            backgroundColor: "#257dbd", // Same as conveyance background
                            color: "white",
                            px: 1,
                            py: 0.3,
                            mx: 0.1,
                            borderRadius: 1,
                            cursor: "pointer",
                            display: "inline-block",
                            position: "relative", // Add explicit position
                            "&:hover": {
                              backgroundColor: "#13629b", // Same hover color as conveyance
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with Scenarios term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Scenarios",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          scenarios
                        </Box>
                        {afterText}
                      </>
                    )
                  }

                  // If neither term was found, return the original text
                  return text
                })()}
              </Typography>
              {/* <Typography variant="body2" color="white">
                {t("interstitial.part3")}
              </Typography> */}
            </Stack>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
