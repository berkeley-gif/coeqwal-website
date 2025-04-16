"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"
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
