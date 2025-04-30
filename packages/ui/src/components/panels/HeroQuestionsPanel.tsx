"use client"

import { Box, Typography } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { BasePanel, type BasePanelProps } from "./BasePanel"
import { TransitionHeadline } from "../common/TransitionHeadline"
import { Fade } from "@mui/material"
import { SxProps, Theme } from "@mui/material/styles"

interface HeroQuestionsPanelProps extends BasePanelProps {
  title?: string // Title optional
  headlines?: string[] // Array of headlines
  content?: string // Content optional
  backgroundImage?: string
  verticalAlignment?: "top" | "center" | "bottom"
  children?: React.ReactNode
  transitionInterval?: number // Interval for headline transitions
  includeHeaderSpacing?: boolean
  /** Optional MUI palette key or CSS color string for the headline text */
  headlineColor?: string
  /**
   * Optional circles to overlay on the panel. Each circle is positioned
   * relative to the center of the panel.
   */
  overlayCircles?: Array<{
    /** Horizontal position in percentage relative to center (positive = right, negative = left) */
    xPercent: number
    /** Vertical position in percentage relative to center (positive = down, negative = up) */
    yPercent: number
    /** Circle radius in pixels */
    radius: number
    /** Circle stroke color (defaults to theme pop.main) */
    stroke?: string
    /** Circle stroke width in pixels (defaults to 3) */
    strokeWidth?: number
    /** Text to display in a speech bubble next to this circle */
    speechBubbleText?: string
    /** Where to position the speech bubble relative to the circle */
    speechBubbleAnchor?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
    /** Distance in pixels between circle and speech bubble */
    speechBubblePadding?: number
    /** Maximum width of the speech bubble in pixels */
    speechBubbleWidth?: number
    /** Typography variant for the speech bubble text */
    speechBubbleVariant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  }>
}

/**
 * HeroQuestionsPanel Component
 *
 * A full-height panel with transitioning headlines and content.
 * Designed to showcase questions or prompts that change over time.
 *
 * @example
 * <HeroQuestionsPanel
 *   headlines={[
 *     "How can we balance California's water needs?",
 *     "What scenarios improve salmon survival?",
 *     "Can we meet urban and agricultural demand?"
 *   ]}
 *   content="Explore scenarios across the state's water system"
 *   backgroundImage="/images/hero-background.jpg"
 *   verticalAlignment="center"
 * />
 */
export function HeroQuestionsPanel({
  title,
  headlines = [],
  content,
  backgroundImage,
  verticalAlignment = "center",
  children,
  transitionInterval = 6000,
  includeHeaderSpacing = true,
  headlineColor,
  overlayCircles = [],
  ...panelProps
}: HeroQuestionsPanelProps) {
  // Use title as a single headline if headlines array is empty
  const headlinesArray =
    headlines.length > 0 ? headlines : title ? [title] : [""]

  // State for tracking which circles/bubbles are currently visible
  const [visibleBubbles, setVisibleBubbles] = useState<number[]>([])
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  // Set up animation sequence for the speech bubbles
  useEffect(() => {
    // Only apply animation if we have circles with speech bubbles
    if (!overlayCircles.length) return

    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current)
    }

    // Calculate timing
    const showDuration = transitionInterval
    const staggerDelay = transitionInterval * 0.95 // Controls overlap - lower value = more overlap
    const totalItems = overlayCircles.length

    // Start with no bubbles visible
    setVisibleBubbles([])

    // Function to cycle through bubbles
    const showBubble = (index: number) => {
      // Add this bubble to visible bubbles
      setVisibleBubbles((prev) => [...prev, index])

      // Schedule when to hide this bubble
      setTimeout(() => {
        setVisibleBubbles((prev) => prev.filter((i) => i !== index))
      }, showDuration)
    }

    // Function to start the sequence
    const startSequence = () => {
      // Clear any existing bubbles
      setVisibleBubbles([])

      // Display each bubble with a staggered delay
      overlayCircles.forEach((_, index) => {
        const delay = index * staggerDelay

        setTimeout(() => {
          showBubble(index)
        }, delay)
      })

      // Schedule the next sequence
      const sequenceDuration = staggerDelay * (totalItems - 1) + showDuration
      animationRef.current = setTimeout(() => {
        startSequence()
      }, sequenceDuration + 1000) // 1 second pause between sequences
    }

    // Start animation sequence after a brief delay
    animationRef.current = setTimeout(() => {
      startSequence()
    }, 500)

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [overlayCircles.length, transitionInterval, overlayCircles])

  return (
    <BasePanel
      fullHeight={true}
      paddingVariant="wide"
      includeHeaderSpacing={includeHeaderSpacing}
      {...panelProps}
      sx={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        ...panelProps.sx,
      }}
    >
      {/* Overlay circles */}
      {overlayCircles.length > 0 && (
        <Box
          component="svg"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0, // below content
          }}
        >
          {/* Add SVG filter definition for shadow */}
          <defs>
            <filter
              id="circle-shadow"
              x="-25%"
              y="-25%"
              width="150%"
              height="150%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5"
                floodColor="rgba(0, 0, 0, 0.25)"
              />
            </filter>
          </defs>

          {overlayCircles.map((circle, index) => {
            // Check if this circle should be visible
            const isVisible = visibleBubbles.includes(index)

            const cx = `calc(50% + ${circle.xPercent}%)`
            const cy = `calc(50% + ${circle.yPercent}%)`

            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={circle.radius}
                fill="none"
                stroke={circle.stroke || "currentColor"}
                strokeWidth={circle.strokeWidth || 3}
                opacity={isVisible ? 1 : 0} // Completely fade out when not active
                style={{
                  transition: "opacity 1500ms ease-in-out",
                  filter: "url(#circle-shadow)",
                }}
              />
            )
          })}
        </Box>
      )}

      {/* Speech Bubbles */}
      {overlayCircles.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 2, // above circles and content
          }}
        >
          {overlayCircles.map((circle, index) => {
            // Skip if no speech bubble text
            if (!circle.speechBubbleText) return null

            // Get circle position and properties
            const cx = `calc(50% + ${circle.xPercent}%)`
            const cy = `calc(50% + ${circle.yPercent}%)`
            const radius = circle.radius
            const padding = circle.speechBubblePadding ?? 10
            const bubbleWidth = circle.speechBubbleWidth ?? 300
            const variant = circle.speechBubbleVariant ?? "h4"

            // Check if this bubble should be visible
            const isVisible = visibleBubbles.includes(index)

            // Choose anchor if not specified (based on circle position)
            const anchor =
              circle.speechBubbleAnchor ??
              (circle.xPercent >= 0
                ? circle.yPercent >= 0
                  ? "top-left"
                  : "bottom-left"
                : circle.yPercent >= 0
                  ? "top-right"
                  : "bottom-right")

            // Calculate position and text alignment based on anchor point
            let left, top, textAlign: "left" | "right" | "center"
            let boxSx: SxProps<Theme> = {}

            switch (anchor) {
              case "top-left": // Above and to the left of the circle
                left = `calc(${cx} - ${radius}px - ${bubbleWidth}px - ${padding}px)`
                top = `calc(${cy} - ${radius}px - ${padding}px)`
                textAlign = "right"
                boxSx = {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end", // Right align
                  justifyContent: "flex-start", // Top align
                }
                break

              case "top-right": // Above and to the right of the circle
                left = `calc(${cx} + ${radius}px + ${padding}px)`
                top = `calc(${cy} - ${radius}px - ${padding}px)`
                textAlign = "left"
                boxSx = {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start", // Left align
                  justifyContent: "flex-start", // Top align
                }
                break

              case "bottom-left": // Below and to the left of the circle
                left = `calc(${cx} - ${radius}px - ${bubbleWidth}px - ${padding}px)`
                top = `calc(${cy} + ${radius}px + ${padding}px)`
                textAlign = "right"
                boxSx = {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end", // Right align
                  justifyContent: "flex-end", // Bottom align
                }
                break

              case "bottom-right": // Below and to the right of the circle
              default:
                left = `calc(${cx} + ${radius}px + ${padding}px)`
                top = `calc(${cy} + ${radius}px + ${padding}px)`
                textAlign = "left"
                boxSx = {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start", // Left align
                  justifyContent: "flex-end", // Bottom align
                }
                break
            }

            return (
              <Fade key={`bubble-${index}`} in={isVisible} timeout={1800}>
                <Box
                  sx={{
                    position: "absolute",
                    left,
                    top,
                    maxWidth: `${bubbleWidth}px`,
                    minHeight: "200px", // Add minimum height for vertical alignment
                    pointerEvents: "auto",
                    ...boxSx, // Apply position-specific styles
                  }}
                >
                  <Typography
                    variant={variant}
                    color={headlineColor}
                    sx={{
                      textAlign,
                      textShadow: "0px 0px 6px rgba(0, 0, 0, 0.7)",
                    }}
                  >
                    {circle.speechBubbleText}
                  </Typography>
                </Box>
              </Fade>
            )
          })}
        </Box>
      )}

      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          height: "auto",
          width: "100%",
          maxWidth: "96%",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          alignItems: "center",
          margin: "0 auto",
          padding: { xs: theme.spacing(1), md: theme.spacing(2) },
          justifyContent:
            verticalAlignment === "top"
              ? "flex-start"
              : verticalAlignment === "bottom"
                ? "flex-end"
                : "center",
        })}
      >
        <TransitionHeadline
          headlines={headlinesArray}
          transitionInterval={transitionInterval}
          variant="h1"
          color={headlineColor}
          sx={{
            marginBottom: content ? 3 : 0,
            textShadow: "0px 0px 6px rgba(0, 0, 0, 0.7)",
          }}
        />

        {content && (
          <Typography
            variant="h5"
            align="center"
            sx={{
              margin: "0 auto",
              textShadow: "0px 0px 6px rgba(0, 0, 0, 0.7)",
            }}
          >
            {content}
          </Typography>
        )}

        {children}
      </Box>
    </BasePanel>
  )
}
