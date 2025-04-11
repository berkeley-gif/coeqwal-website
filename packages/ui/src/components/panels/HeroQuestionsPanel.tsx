"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"
import { TransitionHeadline } from "../common/TransitionHeadline"

interface HeroQuestionsPanelProps extends BasePanelProps {
  title?: string // Title optional
  headlines?: string[] // Array of headlines
  content: string
  backgroundImage?: string
  verticalAlignment?: "top" | "center" | "bottom"
  children?: React.ReactNode
  transitionInterval?: number // Interval for headline transitions
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
  ...panelProps
}: HeroQuestionsPanelProps) {
  // Use title as a single headline if headlines array is empty
  const headlinesArray =
    headlines.length > 0 ? headlines : title ? [title] : [""]

  return (
    <BasePanel
      fullHeight={true}
      paddingVariant="wide"
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
          height: "100%",
          width: "100%",
          maxWidth: { xs: "90%", sm: "80%", md: "770px" },
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto",
          paddingTop: verticalAlignment === "top" ? "2rem" : 0,
          paddingBottom: verticalAlignment === "bottom" ? "2rem" : 0,
          padding: { xs: theme.spacing(2), md: theme.spacing(4) },
        })}
      >
        <TransitionHeadline
          headlines={headlinesArray}
          transitionInterval={transitionInterval}
          variant="h1"
          sx={{ marginBottom: 3 }}
        />
        <Typography
          variant="body1"
          align="center"
          sx={{
            maxWidth: { xs: "100%", md: "80%" },
            margin: "0 auto",
          }}
        >
          {content}
        </Typography>

        {children}
      </Box>
    </BasePanel>
  )
}
