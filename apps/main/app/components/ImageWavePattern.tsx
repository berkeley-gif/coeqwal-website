import { Box, useTheme } from "@repo/ui/mui"
import { motion } from "@repo/motion"

interface ImageWavePatternProps {
  /** Number of images in the wave pattern */
  imageCount?: number
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
 */
export function ImageWavePattern({
  imageCount = 16,
  height = "33.33vh",
  zIndex,
  imagePath = "/images/circular-crops",
  imageExtension = "png"
}: ImageWavePatternProps) {
  const theme = useTheme()

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
        transform: { xs: "scale(0.8)", md: "scale(1.20)", lg: "scale(1)" },
        transformOrigin: "top center",
        willChange: "transform", // Performance optimization
      }}
    >
      {Array.from({ length: imageCount }, (_, i) => {
        // Create wave pattern across the width
        const xPosition = (i / (imageCount - 1)) * 100 // Distribute evenly across width
        const waveHeight = Math.sin((i / (imageCount - 1)) * Math.PI * 3) * 15 + 50 // Sine wave with 3 cycles
        const imageNumber = (i % imageCount) + 1 // Cycle through images
        const size = 60 + Math.sin((i / (imageCount - 1)) * Math.PI * 2) * 20 // Varying sizes 40-80px
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, // Can change opacity (including with a function)
              y: [0, -10, 0, -5], // Bobbing motion
              rotate: [0, 5, -5, 0] // Rocking motion
            }}
            transition={{
              opacity: { delay: i * 0.1, duration: 0.8, ease: "easeOut" }, // Fade in once
              y: { delay: i * 0.1 + 0.8, duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }, // Continuous bobbing
              rotate: { delay: i * 0.1 + 0.8, duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" } // Continuous rocking
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
                opacity: 1, // Also can change opacity here
                filter: "brightness(1.1) contrast(1.1)",
                boxShadow: "0 4px 20px rgba(42, 82, 135, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                  opacity: 1,
                }
              }}
            />
          </motion.div>
        )
      })}
    </Box>
  )
}
