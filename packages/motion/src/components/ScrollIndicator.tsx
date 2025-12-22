import React, { useEffect } from "react"
import { motion, useAnimation } from "../index"
import type { TargetAndTransition } from "framer-motion"

type MotionAxis = "vertical" | "horizontal"

interface ScrollIndicatorProps {
  /** Whether to start the animation immediately */
  animationComplete?: boolean
  /** Delay before starting animation (in seconds) */
  delay?: number
  /** Color of the indicator */
  color?: string
  /** Size of the indicator */
  size?: number
  /** Pulse intensity (scale factor) */
  pulseIntensity?: number
  /** Duration of the show animation */
  showDuration?: number
  /** Duration of the hide animation */
  hideDuration?: number
  /** Click handler for the indicator */
  onClick?: () => void
  /** Target element ID to scroll to (if provided, handles scrolling automatically) */
  scrollToId?: string
  /** Custom icon/content to animate */
  children?: React.ReactNode
  /** Additional styles */
  style?: React.CSSProperties
  /** CSS class name */
  className?: string
  /** The direction of bounce */
  motionAxis?: MotionAxis
}

/**
 * An animated scroll indicator that bounces and pulses to draw attention.
 * Used to indicate that users should click or scroll to see more content.
 */
export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({
  animationComplete = true,
  delay = 1.0,
  color = "currentColor",
  size = 28,
  pulseIntensity = 1.2,
  showDuration = 1.5,
  hideDuration = 0.8,
  onClick,
  scrollToId,
  children,
  style = {},
  className,
  motionAxis = "vertical",
}) => {
  const controls = useAnimation()

  const axisKey: "x" | "y" = motionAxis === "horizontal" ? "x" : "y"

  // Handle scroll to target element
  const handleScrollClick = () => {
    if (scrollToId) {
      const targetElement = document.getElementById(scrollToId)
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect()
        const currentScrollTop =
          window.pageYOffset || document.documentElement.scrollTop
        const targetPosition = rect.top + currentScrollTop - 20 // Small offset for better positioning

        requestAnimationFrame(() => {
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          })
        })
      }
    }

    // Call custom onClick if provided
    onClick?.()
  }

  useEffect(() => {
    let animationRunning = true
    let timeoutId: NodeJS.Timeout | null = null

    const bounce = [0, 10, 0, 10, 0, 10, 0]

    const animateIndicator = async () => {
      if (!animationRunning) return

      if (animationComplete) {
        // Wait for specified delay
        timeoutId = setTimeout(async () => {
          if (!animationRunning) return

          try {
            const showAnim: TargetAndTransition = {
              opacity: 1,
              transition: { duration: showDuration },
            }
            showAnim[axisKey] = 0
            // Start the animation sequence
            await controls.start(showAnim)

            // Begin the pulsing/bouncing animation with pauses
            const animateWithPauses = async () => {
              while (animationRunning) {
                if (!animationRunning) break

                try {
                  const bounceAnim: TargetAndTransition = {
                    transition: {
                      duration: 6,
                      ease: "easeInOut",
                    },
                  }
                  bounceAnim[axisKey] = bounce
                  bounceAnim.scale =
                    pulseIntensity !== 1 ? [1, pulseIntensity, 1] : 1

                  await controls.start(bounceAnim)
                } catch {
                  // Animation interrupted, exit gracefully
                  break
                }
              }
            }

            if (animationRunning) {
              animateWithPauses()
            }
          } catch {
            // Animation interrupted, exit gracefully
          }
        }, delay * 1000)
      } else {
        // Hide the indicator if animation isn't complete
        try {
          const hideAnim: TargetAndTransition = {
            opacity: 0,
            transition: { duration: hideDuration },
          }
          hideAnim[axisKey] = 20
          controls.start(hideAnim)
        } catch {
          // Animation interrupted, exit gracefully
        }
      }
    }

    animateIndicator()

    // Cleanup function
    return () => {
      animationRunning = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [
    animationComplete,
    controls,
    delay,
    pulseIntensity,
    showDuration,
    hideDuration,
    motionAxis,
    axisKey,
  ])

  /** Initial state (typed safely) */
  const initial: TargetAndTransition = { opacity: 0 }
  initial[axisKey] = 20

  return (
    <motion.div
      initial={initial}
      animate={controls}
      onClick={handleScrollClick}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick || scrollToId ? "pointer" : "default",
        color,
        fontSize: size,
        ...style,
      }}
    >
      {children}
    </motion.div>
  )
}
