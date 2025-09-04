import { Box, useTheme, ResponsiveStyleValue } from "@repo/ui/mui"
import { motion } from "@repo/motion"

interface ImageWavePatternProps {
  /** Number of images in the wave pattern - can be responsive */
  imageCount?: ResponsiveStyleValue<number>
  /** Height of the wave container as viewport percentage */
  height?: string
  /** Z-index for layering */
  zIndex?: number
  /** Base path for images (without trailing slash) */
  imagePath?: string
  /** Image file extension */
  imageExtension?: string
}

/**
 * Wave pattern of images with responsive scaling and gentle animation
 * Features:
 * - Currently full screen (a full-screen panel)
 * - Sine wave distribution across viewport width
 * - Staggered fade-in animation
 * - Bobbing and rocking motion
 * - Responsive image scaling
 * - Ambient circles that fade in with text
 */
export function ImageWavePattern({
  imageCount = { xs: 6, sm: 11, lg: 16 }, // Yay ResponsiveStyleValue
  height = "33.33vh",
  zIndex,
  imagePath = "/images/circular-crops",
  imageExtension = "png",
}: ImageWavePatternProps) {
  const theme = useTheme()

  // Create separate image arrays for each breakpoint to ensure proper wave distribution
  const imageCountConfig =
    typeof imageCount === "number"
      ? { xs: imageCount, sm: imageCount, lg: imageCount }
      : {
        xs: (imageCount as { xs?: number; sm?: number; lg?: number }).xs || 16,
        sm: (imageCount as { xs?: number; sm?: number; lg?: number }).sm || 16,
        lg: (imageCount as { xs?: number; sm?: number; lg?: number }).lg || 16,
      }

  // Generate ambient circles for each breakpoint, just like images
  const generateAmbientCirclesForBreakpoint = (count: number) => {
    const circles = []
    const circleCount = Math.floor(count * 1.2) // More bubbles ~ fuller atmosphere

    for (let i = 0; i < circleCount; i++) {
      const xPosition = (i / (circleCount - 1)) * 100
      const waveHeight =
        Math.sin((i / (circleCount - 1)) * Math.PI * 3 + Math.PI / 4) * 15 + 55 // Same base wave as images but with π/4 phase shift and slightly higher center
      const size = 70 + Math.sin((i / (circleCount - 1)) * Math.PI * 3) * 15 // 55-85px range
      const color = "white" // Only white bubbles for contrast against blue background
      const opacity = 0.3 + (i % 4) * 0.15 // 0.3, 0.45, 0.6, 0.75

      circles.push({
        xPosition,
        yPosition: waveHeight,
        size,
        color,
        opacity,
        index: i,
      })
    }

    return circles
  }

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: height,
        zIndex: zIndex || theme.zIndex.introForegroundImages,
        pointerEvents: "none",
        overflow: "hidden",
        // Responsive scaling
        transform: { xs: "scale(1.7)", md: "scale(2.20)", lg: "scale(1.2)", xl: "scale(2.5)" },
        transformOrigin: "top center",
        willChange: "transform", // Performance optimization
      }}
    >
      {/* Responsive image wave patterns - each breakpoint gets proper distribution - needs tweaking but okay for now */}
      {Object.entries(imageCountConfig).map(([breakpoint, count]) => (
        <Box
          key={breakpoint}
          sx={{
            display: {
              xs: breakpoint === "xs" ? "block" : "none",
              sm: breakpoint === "sm" ? "block" : "none",
              lg: breakpoint === "lg" ? "block" : "none",
            },
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
          }}
        >
          {Array.from({ length: count }, (_, i) => {
            // Create wave pattern across the width - properly distributed
            const xPosition = (i / (count - 1)) * 100 // Distribute evenly across width
            const waveHeight =
              Math.sin((i / (count - 1)) * Math.PI * 3) * 15 + 50 // Sine wave with 3 cycles
            const imageNumber = (i % 16) + 1 // Cycle through images 1-16
            const size = 75 + Math.sin((i / (count - 1)) * Math.PI * 2) * 15 // Varying sizes 60-90px

            return (
              <motion.div
                key={`${breakpoint}-${i}`}
                initial={{ opacity: 0, y: -50 }}
                animate={{
                  opacity: 1,
                  y: [0, -10, 0, -5], // Bobbing motion
                  rotate: [0, 5, -5, 0], // Rocking motion
                }}
                transition={{
                  opacity: { delay: i * 0.1, duration: 0.8, ease: "easeOut" },
                  y: {
                    delay: i * 0.1 + 0.8,
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  },
                  rotate: {
                    delay: i * 0.1 + 0.8,
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  },
                }}
                style={{
                  position: "absolute",
                  left: `${xPosition}%`,
                  top: `${waveHeight}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 1,
                }}
              >
                <Box
                  component="img"
                  src={`${imagePath}/${imageNumber}.${imageExtension}`}
                  alt={`Circular crop ${imageNumber}`}
                  sx={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    opacity: 1,
                    filter: "brightness(1.1) contrast(1.1)",
                    boxShadow: "0 4px 20px rgba(42, 82, 135, 0.3)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.1)",
                      opacity: 1,
                    },
                  }}
                />
              </motion.div>
            )
          })}
        </Box>
      ))}

      {/* Responsive ambient circles wave pattern - each breakpoint gets proper distribution */}
      {Object.entries(imageCountConfig).map(([breakpoint, count]) => {
        const ambientCircles = generateAmbientCirclesForBreakpoint(count)

        return (
          <Box
            key={`ambient-${breakpoint}`}
            sx={{
              display: {
                xs: breakpoint === "xs" ? "block" : "none",
                sm: breakpoint === "sm" ? "block" : "none",
                lg: breakpoint === "lg" ? "block" : "none",
              },
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "100%",
            }}
          >
            {ambientCircles.map((circle, i) => {
              const circleColor =
                circle.color === "white"
                  ? theme.palette.ambient.rippleWhite
                  : theme.palette.ambient.rippleBlue

              return (
                <motion.div
                  key={`ambient-${breakpoint}-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: circle.opacity,
                    y: [0, -12, 0, -8, 0], // Bubbly floating motion
                    scale: [1, 1.05, 1, 1.02, 1], // Gentle breathing/pulsing
                  }}
                  transition={{
                    opacity: {
                      delay: 2 + i * 0.05,
                      duration: 1.2,
                      ease: "easeOut",
                    }, // Fade in with text
                    y: {
                      delay: 2 + i * 0.05 + 1.2,
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                    scale: {
                      delay: 2 + i * 0.05 + 1.2,
                      duration: 6,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "easeInOut",
                    },
                  }}
                  style={{
                    position: "absolute",
                    left: `${circle.xPosition}%`,
                    top: `${circle.yPosition}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: 0, // Behind the main images
                  }}
                >
                  <Box
                    sx={{
                      width: `${circle.size}px`,
                      height: `${circle.size}px`,
                      borderRadius: "50%",
                      backgroundColor: circleColor,
                    }}
                  />
                </motion.div>
              )
            })}
          </Box>
        )
      })}
    </Box>
  )
}
