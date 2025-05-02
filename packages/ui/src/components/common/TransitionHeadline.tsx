"use client"

import { useState, useEffect } from "react"
import { Typography, Box, Fade, SxProps, Theme } from "@mui/material"

interface TransitionHeadlineProps {
  headlines: string[]
  transitionInterval?: number
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  color?: string
  className?: string
  sx?: SxProps<Theme>
}

/**
 * TransitionHeadline Component
 *
 * A headline component that transitions between different sentences.
 *
 * @example
 * <TransitionHeadline
 *   headlines={[
 *     "How do reservoir operations affect Delta outflow?",
 *     "What scenarios improve salmon survival?",
 *     "Can we balance urban and agricultural needs?"
 *   ]}
 *   transitionInterval={4000}
 *   variant="h1"
 * />
 */
export function TransitionHeadline({
  headlines,
  transitionInterval = 4000,
  variant = "h1",
  color,
  className,
  sx = {},
}: TransitionHeadlineProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (headlines.length <= 1) return

    // Function to handle the transition
    const handleTransition = () => {
      setIsVisible(false) // Start fade out

      // After fade out, change the headline and fade in
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % headlines.length)
        setIsVisible(true) // Start fade in
      }, 500) // Half a second for fade-out
    }

    // Set up the interval
    const interval = setInterval(handleTransition, transitionInterval)

    // Clean up the interval
    return () => clearInterval(interval)
  }, [headlines, transitionInterval])

  // If no headlines provided, return null
  if (!headlines || headlines.length === 0) return null

  return (
    <Box
      sx={{
        ...sx,
      }}
    >
      <Fade in={isVisible} timeout={500}>
        <Typography
          variant={variant}
          align="center"
          color={color}
          className={className}
          sx={() => ({
            transition: "all 0.5s ease-in-out",
            // Remove any fixed calculations that prevent shrinking
            display: "block",
          })}
        >
          {headlines[currentIndex]}
        </Typography>
      </Fade>
    </Box>
  )
}
