import React, { useState, useEffect, useRef } from "react"
import { BasePanel } from "@repo/ui"
import { Box, Typography, Stack } from "@mui/material"
import { motion, useMotionValue } from "@repo/motion"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"

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
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        opacity,
        left,
        top,
        zIndex: index,
        x,
        y,
        transformOrigin: "center",
        pointerEvents: "none",
        overflow: "hidden",
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
    </motion.div>
  )
}

// List of all available images in the circular-crops directory
// This list exactly matches what's in the directory (verified via ls command)
const availableImages = [
  "1.png",
  "2.png",
  "3.png",
  "4.png",
  "5.png",
  "6.png",
  "7.png",
  "8.png",
  "9.png",
  "10.png",
  "11.png",
  "12.png",
  "13.png",
  "14.png",
  "15.png",
  "DBK_Yuba_River_aerials_0346_05_14_2009.jpg",
  "DWR_2020_10_13_FL_Lookout_Slough-0252.jpg",
  "DWR_2023_05_12_ZZ_0008_Aqueduct_Split.jpg",
  "DWR_2024_04_11_AN_0010_Orchard_Rip_Groundwater_DRONE.jpg",
  "DWR_2025_03_11_NS_0036_Oroville_Lake_Levels.jpg",
  "DWR_CC_salmon_underH20-5_10_15_2012.jpg",
]

// Function to generate a random value within a range
const getRandomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

// Function to generate random circle configuration
const generateRandomCircleProps = (
  imagePath: string,
  isBackground: boolean,
): AnimatedCircleProps => {
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
    amplitudeY2,
  }
}

const IntroSection: React.FC = () => {
  const { t } = useTranslation()
  // State to store the generated circles
  const [backgroundCircles, setBackgroundCircles] = useState<
    AnimatedCircleProps[]
  >([])
  const [foregroundCircles, setForegroundCircles] = useState<
    AnimatedCircleProps[]
  >([])

  // Generate circles on initial render - using only available images
  useEffect(() => {
    // Shuffle the available images array to randomize which images are used
    const shuffledImages = [...availableImages].sort(() => Math.random() - 0.5)

    // Create 4 background circles
    const bgCircles = shuffledImages
      .slice(0, 4)
      .map((img) => generateRandomCircleProps(img, true))

    // Create 4 foreground circles (using different images)
    const fgCircles = shuffledImages
      .slice(4, 8)
      .map((img) => generateRandomCircleProps(img, false))

    setBackgroundCircles(bgCircles)
    setForegroundCircles(fgCircles)
  }, [])

  return (
    <Box
      id="intro"
      sx={{
        position: "relative",
        background: "linear-gradient(to bottom, #f69a93, #81D4FA)",
        backgroundImage:
          "url('/images/collage_water.png'), linear-gradient(to bottom, #f69a93, #81D4FA)",
        backgroundSize: "cover, 100% 100%",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        width: "100%",
        overflow: "visible",
      }}
    >
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
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "#007C92",
              mb: 1,
              fontSize: "clamp(4rem, 8vw, 8rem)",
              textShadow: "0px 0px 10px rgba(255,255,255,0.7)",
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
              textShadow: "0px 0px 10px rgba(255,255,255,0.7)",
            }}
          >
            EXPLORE
          </Typography>

          <Typography
            variant="h1"
            sx={{
              color: "#007C92",
              fontSize: "clamp(4rem, 8vw, 8rem)",
              textShadow: "0px 0px 10px rgba(255,255,255,0.7)",
            }}
          >
            EMPOWER
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: "#007C92",
              textShadow: "0px 0px 10px rgba(255,255,255,0.7)",
            }}
          >
            Explore California&apos;s water system and discover possibilities
            for the future of water in our state.
          </Typography>
        </Box>

        {/* Foreground Circles (above text) */}
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
          {foregroundCircles.map((circle, index) => (
            <ImageCircle key={`fg-circle-${index}`} {...circle} />
          ))}
        </Box>
      </BasePanel>

      {/* Second section with interstitial content - flows naturally after the first section */}
      <BasePanel
        fullHeight={false}
        paddingVariant="wide"
        includeHeaderSpacing={false}
        sx={{
          color: "white",
          alignItems: "left",
          justifyContent: "center",
          pointerEvents: "auto",
          position: "relative",
          backgroundColor: "transparent", // No background image here anymore since it's on the parent
          minHeight: "100vh",
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
              backgroundColor: "transparent",
              padding: 3,
              borderRadius: 2,
              "& .blend-text": {
                mixBlendMode: "difference",
                color: "#FFFFFF",
                textShadow: "0 0 10px rgba(0,0,0,0.1)",
              },
            }}
          >
            <Stack spacing={4}>
              <Typography
                variant="h2"
                className="blend-text"
                sx={{
                  fontWeight: 500,
                }}
              >
                What is California&apos;s water future?
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part1")}
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part2")}
              </Typography>
              <Typography variant="body2" className="blend-text">
                {t("interstitial.part3")}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </BasePanel>
    </Box>
  )
}

export default IntroSection
