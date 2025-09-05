import React, { useEffect } from "react"
import { motion, useAnimation } from "../index"

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
}

/**
 * An animated scroll indicator that bounces and pulses to draw attention.
 * Used to indicate that users should scroll down to see more content.
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
}) => {
  const controls = useAnimation()

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

    const animateIndicator = async () => {
      if (!animationRunning) return

      if (animationComplete) {
        // Wait for specified delay
        timeoutId = setTimeout(async () => {
          if (!animationRunning) return

          try {
            // Start the animation sequence
            await controls.start({
              opacity: 1,
              y: 0,
              transition: { duration: showDuration },
            })

            // Begin the pulsing/bouncing animation with pauses
            const animateWithPauses = async () => {
              while (animationRunning) {
                if (!animationRunning) break

                try {
                  // Animate 3 bounces
                  await controls.start({
                    y: [0, 10, 0, 10, 0, 10, 0],
                    transition: {
                      duration: 6, // seconds per pulse × 3 pulses
                      ease: "easeInOut",
                    },
                  })

                  // Wait/pause for 3 cycle durations (4.5 seconds)
                  if (animationRunning) {
                    await new Promise((resolve) => {
                      timeoutId = setTimeout(resolve, 4500)
                    })
                  }
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
          controls.start({
            opacity: 0,
            y: 20,
            transition: { duration: hideDuration },
          })
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
  ])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
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
