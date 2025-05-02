import React, { useEffect } from "react"
import { motion, MotionValue, useAnimation } from "@repo/motion"
import { Box, ExpandMoreIcon } from "@repo/ui/mui"

const MotionBox = motion.create(Box)

interface ScrollIndicatorProps {
  animationComplete?: boolean
  delay?: number
  color?: string
  size?: number
  opacity?: MotionValue<number>
  pulseIntensity?: number
  showDuration?: number
  hideDuration?: number
}

const ScrollIndicator = ({
  animationComplete = false,
  delay = 0.5,
  color = "currentColor",
  size = 32,
  opacity = new MotionValue(1),
  pulseIntensity = 1.2,
  showDuration = 1.5,
  hideDuration = 0.8,
}: ScrollIndicatorProps) => {
  const controls = useAnimation()

  useEffect(() => {
    const animateIndicator = async () => {
      if (animationComplete) {
        // Wait for specified delay after text animation completes
        await new Promise((resolve) => setTimeout(resolve, delay * 1000))

        // Start the animation sequence
        await controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: showDuration },
        })

        // Begin the pulsing/bouncing animation
        controls.start({
          y: [0, 10, 0],
          scale: [1, pulseIntensity, 1],
          transition: {
            y: {
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            },
            scale: {
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut",
            },
          },
        })
      } else {
        // Hide the indicator if text animation isn't complete
        controls.start({
          opacity: 0,
          y: 20,
          transition: { duration: hideDuration },
        })
      }
    }

    animateIndicator()
  }, [
    animationComplete,
    controls,
    delay,
    pulseIntensity,
    showDuration,
    hideDuration,
  ])

  return (
    <MotionBox
      style={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
        opacity: opacity,
      }}
      sx={{ marginTop: 2, marginBottom: 1 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={controls}
        className="flex items-center justify-center mt-8 mb-4"
        style={{
          color,
          fontSize: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ExpandMoreIcon />
      </motion.div>
    </MotionBox>
  )
}

export default ScrollIndicator
