"use client"

import { Box, Typography, useTheme } from "@mui/material"
import { useState, useEffect, useRef } from "react"
import { BasePanel, TransitionHeadline } from "@repo/ui"
import type { Theme as AppTheme } from "@mui/material/styles"
import { PhotoWithQuestions } from "./PhotoWithQuestions"
import { Fade } from "@mui/material"
import { SxProps } from "@mui/material/styles"
import type { BasePanelProps } from "@repo/ui"

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
  /**
   * Optional SVG images to display as questions. Each SVG is positioned
   * relative to the center of the panel and will transition in sequence.
   */
  questionSvgs?: Array<{
    /** Path to the SVG file */
    src: string
    /** Horizontal position in percentage relative to center (positive = right, negative = left) */
    xPercent: number
    /** Vertical position in percentage relative to center (positive = down, negative = up) */
    yPercent: number
    /** Width of the SVG in pixels */
    width: number
    /** Height of the SVG in pixels */
    height: number
    /** Optional delay for this SVG in ms (added to the sequence timing) */
    delay?: number
  }>
  // New bottom content
  bottomHeadline?: string
  bottomText?: string
}

export function HeroQuestionsPanel({
  title,
  headlines = [],
  content,
  backgroundImage,
  verticalAlignment = "center",
  children,
  transitionInterval = 4000,
  headlineColor,
  overlayCircles = [],
  questionSvgs = [],
  bottomHeadline = "Learn. Empower. Act.",
  bottomText = "Explore California's water system and discover possibilities for the future of water in our state.",
  ...panelProps
}: HeroQuestionsPanelProps) {
  const [visibleBubbles, setVisibleBubbles] = useState<number[]>([])
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const theme = useTheme()

  // Margin around the full-screen panel. You can tweak spacing here.
  const margin = theme.spacing(2)
  const headerHeight =
    (theme as AppTheme & { layout?: { headerHeight?: number } }).layout
      ?.headerHeight ?? 56
  const topPadding = `${headerHeight}px`

  // Use title as a single headline if headlines array is empty
  const headlinesArray =
    headlines.length > 0 ? headlines : title ? [title] : [""]

  // Animation for bubbles
  useEffect(() => {
    if (!overlayCircles.length) return

    if (animationRef.current) clearTimeout(animationRef.current)

    const showDuration = transitionInterval
    const staggerDelay = transitionInterval * 0.95
    const totalItems = overlayCircles.length

    setVisibleBubbles([])

    const showBubble = (index: number) => {
      setVisibleBubbles((prev) => [...prev, index])
      setTimeout(() => {
        setVisibleBubbles((prev) => prev.filter((i) => i !== index))
      }, showDuration)
    }

    const startSequence = () => {
      setVisibleBubbles([])
      overlayCircles.forEach((_, index) => {
        const delay = index * staggerDelay
        setTimeout(() => showBubble(index), delay)
      })
      const seqDur = staggerDelay * (totalItems - 1) + showDuration
      animationRef.current = setTimeout(startSequence, seqDur + 1000)
    }

    animationRef.current = setTimeout(startSequence, 500)
    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [overlayCircles.length, transitionInterval, overlayCircles])

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        pt: topPadding,
        pb: margin,
        px: margin,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.palette.common.white,
      }}
    >
      <BasePanel
        fullHeight={false}
        paddingVariant="none"
        includeHeaderSpacing={false}
        {...panelProps}
        sx={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          borderRadius: 1,
          overflow: "hidden",
          flex: 1,
          ...(panelProps as BasePanelProps).sx,
        }}
      >
        {backgroundImage && (
          <Box
            component="img"
            src={backgroundImage}
            alt="hero background"
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Circles layer */}
        {/* {overlayCircles.length > 0 && (
          <Box
            component="svg"
            sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
          >
            <defs>
              <filter id="circle-shadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="rgba(0,0,0,0.25)" />
              </filter>
            </defs>
            {overlayCircles.map((circle, index) => {
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
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 1500ms ease-in-out", filter: "url(#circle-shadow)" }}
                />
              )
            })}
          </Box>
        )} */}

        {/* Foreground photo + question svgs */}
        {questionSvgs.length > 0 && (
          <PhotoWithQuestions
            src={backgroundImage ?? ""}
            questionSvgs={questionSvgs}
            transitionInterval={transitionInterval}
          />
        )}

        {/* Speech bubbles */}
        {overlayCircles.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            {overlayCircles.map((circle, index) => {
              if (!circle.speechBubbleText) return null
              const cx = `calc(50% + ${circle.xPercent}%)`
              const cy = `calc(50% + ${circle.yPercent}%)`
              const radius = circle.radius
              const padding = circle.speechBubblePadding ?? 10
              const bubbleWidth = circle.speechBubbleWidth ?? 300
              const variant = circle.speechBubbleVariant ?? "h4"
              const isVisible = visibleBubbles.includes(index)
              const anchor =
                circle.speechBubbleAnchor ??
                (circle.xPercent >= 0
                  ? circle.yPercent >= 0
                    ? "top-left"
                    : "bottom-left"
                  : circle.yPercent >= 0
                    ? "top-right"
                    : "bottom-right")

              let left: string = ""
              let top: string = ""
              let textAlign: "left" | "right" | "center" = "left"
              let boxSx: SxProps = {}

              switch (anchor) {
                case "top-left":
                  left = `calc(${cx} - ${radius}px - ${bubbleWidth}px - ${padding}px)`
                  top = `calc(${cy} - ${radius}px - ${padding}px)`
                  textAlign = "right"
                  boxSx = {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                  }
                  break
                case "top-right":
                  left = `calc(${cx} + ${radius}px + ${padding}px)`
                  top = `calc(${cy} - ${radius}px - ${padding}px)`
                  textAlign = "left"
                  boxSx = {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }
                  break
                case "bottom-left":
                  left = `calc(${cx} - ${radius}px - ${bubbleWidth}px - ${padding}px)`
                  top = `calc(${cy} + ${radius}px + ${padding}px)`
                  textAlign = "right"
                  boxSx = {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }
                  break
                case "bottom-right":
                default:
                  left = `calc(${cx} + ${radius}px + ${padding}px)`
                  top = `calc(${cy} + ${radius}px + ${padding}px)`
                  textAlign = "left"
                  boxSx = {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "flex-end",
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
                      minHeight: "200px",
                      pointerEvents: "auto",
                      ...boxSx,
                    }}
                  >
                    <Typography
                      variant={variant}
                      color={headlineColor}
                      sx={{
                        textAlign,
                        textShadow: "0px 0px 6px rgba(0,0,0,0.7)",
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

        {/* Center content (headline + body) */}
        <Box
          sx={(theme: AppTheme) => ({
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
              textShadow: "0px 0px 6px rgba(0,0,0,0.7)",
            }}
          />

          {content && (
            <Typography
              variant="h5"
              align="center"
              sx={{
                margin: "0 auto",
                textShadow: "0px 0px 6px rgba(0,0,0,0.7)",
              }}
            >
              {content}
            </Typography>
          )}

          {children}
        </Box>
      </BasePanel>

      {/* Bottom headline & text */}
      <Box sx={{ mt: margin, mb: theme.spacing(8), textAlign: "center" }}>
        <Typography
          variant="h1"
          sx={{
            fontFamily: '"akzidenz-grotesk-next-pro", sans-serif',
            fontWeight: 800,
            color: "common.black",
            whiteSpace: "nowrap",
            lineHeight: 1.1,
            fontSize: "clamp(2rem, 6vw, 6rem)",
            mt: 1,
          }}
        >
          {bottomHeadline}
        </Typography>
        <Typography variant="body2" sx={{ color: "common.black", mt: 1 }}>
          {bottomText}
        </Typography>
      </Box>
    </Box>
  )
}
