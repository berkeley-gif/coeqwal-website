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
  const scale = useMotionValue(1)
  const haloOpacity = useMotionValue(0.08)

  // Center point for drift animation (55%, 40%)
  const centerX = 55 // percentage
  const centerY = 40 // percentage

  // Parse the original position percentages
  const originalX = parseFloat(left.replace("%", ""))
  const originalY = parseFloat(top.replace("%", ""))

  // Use requestAnimationFrame to create continuous, organic motion
  useEffect(() => {
    let animationId: number

    const animate = () => {
      // Update time value - slowed down for gentler motion
      timeRef.current += 0.02

      // Murmuration effect - coordinated flowing motion
      const globalTime = timeRef.current * 0.1

      // Base circular motion around the oval pattern (increased amplitude)
      const circularMotionX = Math.sin(globalTime + index * 0.8) * 40
      const circularMotionY = Math.cos(globalTime + index * 0.8) * 30

      // Add flowing waves that propagate through the formation (increased amplitude)
      const waveSpeed = 0.05
      const wave1X = Math.sin(globalTime * waveSpeed + index * 1.2) * 35
      const wave1Y = Math.cos(globalTime * waveSpeed + index * 1.2) * 25

      const wave2X = Math.sin(globalTime * waveSpeed * 1.3 + index * 0.7) * 25
      const wave2Y = Math.cos(globalTime * waveSpeed * 1.3 + index * 0.7) * 35

      // Add some individual variation (increased amplitude)
      const individualX = Math.sin(timeRef.current * freqX1 + phaseX1) * 15
      const individualY = Math.cos(timeRef.current * freqY1 + phaseY1) * 15

      // Drift-to-center animation
      // Each circle takes a turn drifting to center based on its index
      const driftCycleDuration = 12 // seconds for complete cycle (longer for more dramatic effect)
      const driftPhasePerCircle = driftCycleDuration / 8 // 8 circles total
      const currentPhase = (timeRef.current * 0.08) % driftCycleDuration // Slower overall cycle
      const myPhaseStart = index * driftPhasePerCircle
      const myPhaseEnd = myPhaseStart + driftPhasePerCircle * 0.7 // 70% of phase for drift

      let driftProgress = 0
      if (currentPhase >= myPhaseStart && currentPhase <= myPhaseEnd) {
        // This circle's turn to drift
        const phaseProgress =
          (currentPhase - myPhaseStart) / (myPhaseEnd - myPhaseStart)
        // Use sine wave for smooth in-out motion
        driftProgress = Math.sin(phaseProgress * Math.PI)
      }

      // Calculate drift offset toward center (convert percentages to relative movement)
      const driftX = (centerX - originalX) * driftProgress * 0.8 // 80% of the way to center
      const driftY = (centerY - originalY) * driftProgress * 0.8

      // Combine murmuration with drift (reduce murmuration during drift)
      const murmurateFactor = 1 - driftProgress * 0.6 // Reduce murmuration when drifting
      const newX =
        (circularMotionX + wave1X + wave2X + individualX) * murmurateFactor +
        driftX
      const newY =
        (circularMotionY + wave1Y + wave2Y + individualY) * murmurateFactor +
        driftY

      // Subtle pulsing effect
      const newScale = 1 + Math.sin(timeRef.current * 0.1) * 0.02
      const newHaloOpacity = 0.08 + Math.sin(timeRef.current * 0.15) * 0.04

      // Apply new values
      x.set(newX)
      y.set(newY)
      scale.set(newScale)
      haloOpacity.set(newHaloOpacity)

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
    scale,
    haloOpacity,
    index,
    originalX,
    originalY,
  ])

  return (
    <motion.div
      style={{
        position: "absolute",
        width: `${size + 40}px`,
        height: `${size + 40}px`,
        borderRadius: "50%",
        opacity,
        left,
        top,
        zIndex: index,
        x,
        y,
        scale,
        transformOrigin: "center",
        pointerEvents: "none",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.16)",
        border: "2px solid rgba(255, 255, 255, 0.1)",
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

// Clear configuration for circle positions - easy to edit
const circlePositions = {
  // Background circles arranged in a more random, spread-out pattern
  // Distributed across a wider area for natural cloud-like appearance
  background: [
    // More random distribution across the viewport
    // Spread across roughly 50% of viewport width and height

    // Upper area circles
    { left: "16%", top: "14%" },

    // Upper right area
    { left: "72%", top: "8%" },

    // Center-right area
    { left: "60%", top: "30%" },

    // Lower right area
    { left: "75%", top: "54%" },

    // Lower center area
    { left: "55%", top: "64%" },

    // Lower left area
    { left: "35%", top: "58%" },

    // Center-left area
    { left: "38%", top: "28%" },

    // Upper left area
    { left: "52%", top: "21%" },
  ],

  // Keep foreground empty for now
  foreground: [],
}

// Function to add sine-based variation to circle positions around master circle
const addPositionVariation = (
  basePosition: { left: string; top: string },
  index: number,
) => {
  // Use index as seed for consistent variation
  const seed = index * 7.3 // Different multiplier for more variation

  // Create sine-based offsets for cloud-like positioning
  const radiusVariation = Math.sin(seed) * 0.5 + 0.5 // 0-1 range
  const angleVariation = Math.sin(seed * 1.7) * Math.PI * 0.4 // ±36 degrees variation

  // Convert percentage position to approximate pixel offset for calculation
  const baseRadius = 120 + radiusVariation * 80 // 120-200px radius variation
  const angle = (index / 8) * Math.PI * 2 + angleVariation // Base angle + variation

  // Calculate offset from base position
  const offsetX = Math.cos(angle) * baseRadius * 0.3 // Scale down the offset
  const offsetY = Math.sin(angle) * baseRadius * 0.3

  // Convert base percentages to numbers
  const baseLeft = parseFloat(basePosition.left.replace("%", ""))
  const baseTop = parseFloat(basePosition.top.replace("%", ""))

  // Apply offset (convert px to approximate percentage)
  const newLeft = baseLeft + offsetX / 12 // Rough px to % conversion
  const newTop = baseTop + offsetY / 8

  return {
    left: `${newLeft}%`,
    top: `${newTop}%`,
  }
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

  // Use theme z-index values instead of hardcoded numbers
  const index = isBackground ? 1 : 15 // Will be updated to use theme values in the component

  // Fixed size with small variation
  const size = 260 // Fixed size for all circles

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

  // Fixed amplitudes with increased variations
  const baseAmplitude = 25 // Reduced from 40 to keep circles in rows
  const amplitudeX1 = baseAmplitude + positionIndex * 2 // Reduced variation
  const amplitudeX2 = baseAmplitude - positionIndex * 1 // Reduced variation
  const amplitudeY1 = baseAmplitude + positionIndex * 1.5 // Reduced variation
  const amplitudeY2 = baseAmplitude - positionIndex * 0.5 // Reduced variation

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
  const circleOpacity = useMotionValue(opacity)
  const circleScale = useMotionValue(1)

  // Use requestAnimationFrame to create continuous, organic motion
  useEffect(() => {
    let animationId: number

    const animate = () => {
      // Update time value - slowed down for gentler motion
      timeRef.current += 0.015 // Reduced from 0.04 for slower animation

      // Calculate complex, overlapping sine wave motion
      // X position: combine two sine waves with different frequencies and phases
      const newX =
        Math.sin(timeRef.current * freqX1 + phaseX1) * amplitudeX1 * 1.5 +
        Math.sin(timeRef.current * freqX2 + phaseX2) * amplitudeX2 * 1.5

      // Y position: combine two cosine waves with different frequencies and phases
      const newY =
        Math.cos(timeRef.current * freqY1 + phaseY1) * amplitudeY1 * 1.5 +
        Math.cos(timeRef.current * freqY2 + phaseY2) * amplitudeY2 * 1.5

      // Add subtle pulsing effect
      const newOpacity =
        opacity + Math.sin(timeRef.current * 0.08) * (opacity * 0.3)
      const newScale = 1 + Math.sin(timeRef.current * 0.1) * 0.04

      // Apply new values
      x.set(newX)
      y.set(newY)
      circleOpacity.set(newOpacity)
      circleScale.set(newScale)

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
    opacity,
    x,
    y,
    circleOpacity,
    circleScale,
  ])

  return (
    <motion.div
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        opacity: circleOpacity,
        left,
        top,
        zIndex: 0, // White bubbles at introBubbles level (z-index 0)
        pointerEvents: "none",
        x,
        y,
        scale: circleScale,
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

        // Opacity - gradient effect that decreases with row - halved values for subtlety
        let opacity
        if (row === 0) {
          // Top row - more visible
          opacity = 0.05 + Math.random() * 0.05 // Halved from 0.1-0.2 to 0.05-0.1
        } else if (row === 1) {
          // Middle row - medium visibility
          opacity = 0.035 + Math.random() * 0.035 // Halved from 0.07-0.14 to 0.035-0.07
        } else {
          // Bottom row - subtle
          opacity = 0.02 + Math.random() * 0.025 // Halved from 0.04-0.09 to 0.02-0.045
        }

        // Add animation parameters with slight variations
        const freqBase = 0.03 + Math.random() * 0.03
        const phaseBase = Math.random() * Math.PI * 2
        const amplitudeBase = 40 + Math.random() * 25 // Increased from 25-45 to 40-65

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
          amplitudeX1: amplitudeBase + Math.random() * 15, // Increased amplitude
          amplitudeX2: amplitudeBase - Math.random() * 8,
          amplitudeY1: amplitudeBase + Math.random() * 18, // Increased amplitude
          amplitudeY2: amplitudeBase - Math.random() * 5,
        })
      }
    }

    // For interstitial section (bottom section) - create just 1 circle, well-positioned
    circles.push({
      left: `${30 + Math.random() * 40}%`, // Center-ish horizontally
      top: `${110 + Math.random() * 10}%`, // Just below the fold
      size: 250 + Math.random() * 150, // Medium-large size
      opacity: 0.01 + Math.random() * 0.01, // Halved from 0.02-0.04 to 0.01-0.02
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

    // Create circles with varied positions around the master circle
    const bgCircles = selectedImages.map((img, index) => {
      // Get base position from master circle
      const basePosition = circlePositions.background[
        index % circlePositions.background.length
      ] || { left: "55%", top: "40%" }

      // Add sine-based variation to position
      const variedPosition = addPositionVariation(basePosition, index)

      // Call generateFixedCircleProps with the base position
      const circleProps = generateFixedCircleProps(img, true, index)

      // Override with the varied position
      return {
        ...circleProps,
        left: variedPosition.left,
        top: variedPosition.top,
      }
    })

    setBackgroundCircles(bgCircles)
  }, [])

  return (
    <Box
      id="intro"
      sx={{
        position: "relative",
        // Original gradient background (commented out for reference):
        // background: "linear-gradient(to bottom, #218dba, #218dba, #459ede)",
        background: "#A3DDE8",
        backgroundSize: "100% 100%",
        width: "100%",
        overflow: "hidden",
        zIndex: 0, // Base layer
        margin: 0, // Remove any default margins
        isolation: "isolate", // Create isolated stacking context
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
          zIndex: (theme) => theme.zIndex.introBackgroundImages,
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
      </Box>

      {/* First section with bubbles */}
      <BasePanel
        id="intro-main"
        fullHeight={false}
        includeHeaderSpacing
        sx={{
          paddingTop: { xs: 3, md: 6 },
          paddingBottom: { xs: 3, md: 6 },
          paddingLeft: { xs: 6, md: 20 }, // Increased left padding to push text right
          paddingRight: { xs: 3, md: 6 }, // Normal right padding
          minHeight: "100vh",
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
            zIndex: (theme) => theme.zIndex.introBackgroundImages,
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
            height: "100%",
            position: "relative",
            zIndex: (theme) => theme.zIndex.introText, // Text layer
            mt: { xs: 6, md: 12 }, // Hack: dd top margin to push the text content down
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "#2e3a6c",
              mb: 2, // Keep margin-bottom for spacing
            }}
          >
            Learn.
          </Typography>

          <Typography
            variant="h1"
            sx={{
              color: "#2e3a6c",
              mb: 2,
            }}
          >
            Explore.
          </Typography>

          <Typography
            variant="h1"
            sx={{
              color: "#2e3a6c",
              mb: 2, // Keep margin-bottom for spacing
            }}
          >
            Empower.
          </Typography>

          <Typography
            variant="h3"
            sx={{
              color: "#2e3a6c",
              mt: 2.5,
              mb: 2, // 1rem equivalent (16px)
            }}
          >
            Rethink California Water
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#2e3a6c",
              mt: 3,
              maxWidth: "500px",
            }}
            className="tk-neue-haas-grotesk-text"
          >
            Explore California&apos;s water system and discover possibilities
            for the future of water in our state.
          </Typography>

          {/* Play arrow icon pointing down */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "500px",
            }}
          >
            <PlayArrowIcon
              sx={{
                color: "#2e3a6c",
                fontSize: 50,
                transform: "rotate(90deg)",
                pointerEvents: "auto",
              }}
              onClick={() => {
                // Scroll to the interstitial section with improved positioning
                const interstitialSection =
                  document.getElementById("interstitial")
                if (interstitialSection) {
                  // Get the exact position of the interstitial section
                  const rect = interstitialSection.getBoundingClientRect()
                  const currentScrollTop =
                    window.pageYOffset || document.documentElement.scrollTop

                  // Calculate target position, accounting for any header offset
                  const targetPosition = rect.top + currentScrollTop - 20 // Small offset for better positioning

                  // Use requestAnimationFrame to ensure smooth scrolling doesn't interfere with manual scrolling
                  requestAnimationFrame(() => {
                    window.scrollTo({
                      top: targetPosition,
                      behavior: "smooth",
                    })
                  })
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
            zIndex: (theme) => theme.zIndex.introForegroundImages,
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
          paddingTop: "160px",
        }}
      >
        {/* Content container for proper blending context */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "100%",
          }}
        >
          {/* Text content with mix-blend-mode */}
          <Box
            maxWidth="876px"
            sx={{
              position: "relative",
              zIndex: (theme) => theme.zIndex.introText,
              mb: 10,
            }}
          >
            <Stack spacing={4}>
              <Typography
                variant="h2"
                sx={{
                  color: "white",
                  mb: 3, // 1.5rem equivalent (24px)
                }}
              >
                What is the future
                <br />
                of California water?
              </Typography>
              <Typography
                variant="body1"
                color="white"
                className="tk-neue-haas-grotesk-text"
              >
                {(() => {
                  const text = t("interstitial.part1")

                  // Check for all four terms: "surface water", "conveyance", "allocation", and "Central Valley"
                  const surfaceWaterIndex = text.indexOf("surface water")
                  const conveyanceIndex = text.indexOf("conveyance")
                  const allocationIndex = text.indexOf("allocation")
                  const centralValleyIndex = text.indexOf("Central Valley")

                  if (
                    surfaceWaterIndex !== -1 &&
                    conveyanceIndex !== -1 &&
                    allocationIndex !== -1 &&
                    centralValleyIndex !== -1
                  ) {
                    // All four terms found - handle them in order of appearance
                    const beforeSurfaceWater = text.substring(
                      0,
                      surfaceWaterIndex,
                    )
                    const afterSurfaceWater = text.substring(
                      surfaceWaterIndex + 13,
                    ) // 13 is length of "surface water"

                    const conveyanceIndexInRemainder =
                      afterSurfaceWater.indexOf("conveyance")
                    const beforeConveyance = afterSurfaceWater.substring(
                      0,
                      conveyanceIndexInRemainder,
                    )
                    const afterConveyance = afterSurfaceWater.substring(
                      conveyanceIndexInRemainder + 10,
                    ) // 10 is length of "conveyance"

                    const allocationIndexInRemainder =
                      afterConveyance.indexOf("allocation")
                    const beforeAllocation = afterConveyance.substring(
                      0,
                      allocationIndexInRemainder,
                    )
                    const afterAllocation = afterConveyance.substring(
                      allocationIndexInRemainder + 10,
                    ) // 10 is length of "allocation"

                    const centralValleyIndexInRemainder =
                      afterAllocation.indexOf("Central Valley")
                    const beforeCentralValley = afterAllocation.substring(
                      0,
                      centralValleyIndexInRemainder,
                    )
                    const afterCentralValley = afterAllocation.substring(
                      centralValleyIndexInRemainder + 14,
                    ) // 14 is length of "Central Valley"

                    return (
                      <>
                        {beforeSurfaceWater}
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
                            position: "relative",
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with surface water term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Surface water",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          surface water
                        </Box>
                        {beforeConveyance}
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
                            position: "relative",
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
                        {beforeAllocation}
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
                            position: "relative",
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with allocation term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Allocation",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          allocation
                        </Box>
                        {beforeCentralValley}
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
                            position: "relative",
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with Central Valley term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Central Valley",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          Central Valley
                        </Box>
                        {afterCentralValley}
                      </>
                    )
                  }

                  // Fallback to existing logic if not all four terms are found
                  // First check for "surface water" and split if found
                  if (surfaceWaterIndex !== -1) {
                    // Text before "surface water"
                    const beforeSurfaceWater = text.substring(
                      0,
                      surfaceWaterIndex,
                    )

                    // Get text after "surface water" to look for "conveyance"
                    const afterSurfaceWaterText = text.substring(
                      surfaceWaterIndex + 13,
                    ) // 13 is length of "surface water"

                    // Look for "conveyance" in the remaining text
                    const conveyanceIndexInText =
                      afterSurfaceWaterText.indexOf("conveyance")

                    if (conveyanceIndexInText !== -1) {
                      // Text between "surface water" and "conveyance"
                      const betweenText = afterSurfaceWaterText.substring(
                        0,
                        conveyanceIndexInText,
                      )

                      // Text after "conveyance"
                      const afterConveyanceText =
                        afterSurfaceWaterText.substring(
                          conveyanceIndexInText + 10,
                        ) // 10 is length of "conveyance"

                      return (
                        <>
                          {beforeSurfaceWater}
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
                              position: "relative",
                              "&:hover": {
                                backgroundColor: "#13629b",
                              },
                            }}
                            onClick={() => {
                              // Open glossary drawer with surface water term
                              const drawerStore = useDrawerStore.getState()
                              drawerStore.setDrawerContent({
                                selectedSection: "glossary",
                                selectedTerm: "Surface water",
                              })
                              drawerStore.openDrawer("glossary")
                            }}
                          >
                            surface water
                          </Box>
                          {betweenText}
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
                              position: "relative",
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
                          {afterConveyanceText}
                        </>
                      )
                    }

                    // If conveyance not found, just highlight surface water
                    return (
                      <>
                        {beforeSurfaceWater}
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
                            position: "relative",
                            "&:hover": {
                              backgroundColor: "#13629b",
                            },
                          }}
                          onClick={() => {
                            // Open glossary drawer with surface water term
                            const drawerStore = useDrawerStore.getState()
                            drawerStore.setDrawerContent({
                              selectedSection: "glossary",
                              selectedTerm: "Surface water",
                            })
                            drawerStore.openDrawer("glossary")
                          }}
                        >
                          surface water
                        </Box>
                        {afterSurfaceWaterText}
                      </>
                    )
                  }

                  // If surface water not found, check for conveyance only (fallback)
                  return text.split("conveyance").map((part, i, array) => {
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
                            position: "relative",
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
                  })
                })()}
              </Typography>
              <Typography
                variant="body1"
                color="white"
                className="tk-neue-haas-grotesk-text"
              >
                {(() => {
                  const text = t("interstitial.part2")

                  // Create an array of all terms to link with their positions
                  const terms = [
                    { name: "storage", glossaryTerm: "Storage" },
                    { name: "conveyance", glossaryTerm: "Conveyance" },
                    { name: "deliveries", glossaryTerm: "Deliveries" },
                    {
                      name: "operational decisions",
                      glossaryTerm: "Operational decisions",
                    },
                    {
                      name: "CalSim",
                      glossaryTerm: "Computer models / CalSim",
                    },
                    { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                    { name: "scenarios", glossaryTerm: "Scenarios" },
                  ]

                  // Find all term positions in the text
                  const foundTerms = terms
                    .map((term) => ({
                      ...term,
                      index: text.indexOf(term.name),
                      length: term.name.length,
                    }))
                    .filter((term) => term.index !== -1)
                    .sort((a, b) => a.index - b.index)

                  if (foundTerms.length === 0) {
                    return text
                  }

                  // Build the result by processing terms in order
                  const result: React.ReactNode[] = []
                  let currentIndex = 0

                  foundTerms.forEach((term, i) => {
                    // Add text before this term
                    result.push(text.substring(currentIndex, term.index))

                    // Add the linked term
                    result.push(
                      <Box
                        key={i}
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
                          position: "relative",
                          "&:hover": {
                            backgroundColor: "#13629b",
                          },
                        }}
                        onClick={() => {
                          const drawerStore = useDrawerStore.getState()
                          drawerStore.setDrawerContent({
                            selectedSection: "glossary",
                            selectedTerm: term.glossaryTerm,
                          })
                          drawerStore.openDrawer("glossary")
                        }}
                      >
                        {term.name}
                      </Box>,
                    )

                    currentIndex = term.index + term.length
                  })

                  // Add remaining text after the last term
                  result.push(text.substring(currentIndex))

                  return <>{result}</>
                })()}
              </Typography>
              <Typography
                variant="body1"
                color="white"
                className="tk-neue-haas-grotesk-text"
              >
                {(() => {
                  const text = t("interstitial.part3")

                  // Create an array of all terms to link and format
                  const terms = [
                    { name: "COEQWAL", glossaryTerm: "COEQWAL" },
                    { name: "scenarios", glossaryTerm: "Scenarios" },
                    {
                      name: "changing climate",
                      glossaryTerm: "Changing climate",
                    },
                  ]

                  // Find all term positions in the text
                  const foundTerms = terms
                    .map((term) => ({
                      ...term,
                      index: text.indexOf(term.name),
                      length: term.name.length,
                    }))
                    .filter((term) => term.index !== -1)
                    .sort((a, b) => a.index - b.index)

                  if (foundTerms.length === 0) {
                    return text
                  }

                  // Build the result by processing terms in order
                  const result: React.ReactNode[] = []
                  let currentIndex = 0

                  foundTerms.forEach((term, i) => {
                    // Add text before this term
                    result.push(text.substring(currentIndex, term.index))

                    // Add the linked term
                    result.push(
                      <Box
                        key={i}
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
                          position: "relative",
                          "&:hover": {
                            backgroundColor: "#13629b",
                          },
                        }}
                        onClick={() => {
                          const drawerStore = useDrawerStore.getState()
                          drawerStore.setDrawerContent({
                            selectedSection: "glossary",
                            selectedTerm: term.glossaryTerm,
                          })
                          drawerStore.openDrawer("glossary")
                        }}
                      >
                        {term.name}
                      </Box>,
                    )

                    currentIndex = term.index + term.length
                  })

                  // Add remaining text after the last term
                  result.push(text.substring(currentIndex))

                  return <>{result}</>
                })()}
              </Typography>
              <Typography
                variant="h3"
                sx={{
                  color: "white",
                  mt: 2,
                  pl: 40,
                }}
              >
                &quot;What if...?&quot;
              </Typography>
            </Stack>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
