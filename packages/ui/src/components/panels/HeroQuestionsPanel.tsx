"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, type BasePanelProps } from "./BasePanel"
import { TransitionHeadline } from "../common/TransitionHeadline"

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
  transitionInterval = 4000,
  includeHeaderSpacing = true,
  headlineColor,
  overlayCircles = [],
  ...panelProps
}: HeroQuestionsPanelProps) {
  // Use title as a single headline if headlines array is empty
  const headlinesArray =
    headlines.length > 0 ? headlines : title ? [title] : [""]

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
          {overlayCircles.map((circle, index) => {
            // Calculate center-relative position
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
              />
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
          sx={{ marginBottom: content ? 3 : 0 }}
        />

        {content && (
          <Typography
            variant="h5"
            align="center"
            sx={{
              //   maxWidth: { xs: "100%", md: "80%" },
              margin: "0 auto",
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
