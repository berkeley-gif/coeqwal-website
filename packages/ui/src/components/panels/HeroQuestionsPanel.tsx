"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"

interface HeroQuestionsPanelProps extends BasePanelProps {
  title: string
  content: string
  backgroundImage?: string
  verticalAlignment?: "top" | "center" | "bottom"
  children?: React.ReactNode
}

/**
 * HeroQuestionsPanel Component
 *
 * A full-height panel with title and content, designed to showcase questions.
 * Optionally includes a background image.
 *
 * @example
 * <HeroQuestionsPanel
 *   title="How can we balance California's water needs?"
 *   content="Explore scenarios across the state's water system"
 *   backgroundImage="/images/hero-background.jpg"
 *   verticalAlignment="center"
 * />
 */
export function HeroQuestionsPanel({
  title,
  content,
  backgroundImage,
  verticalAlignment = "center",
  children,
  ...panelProps
}: HeroQuestionsPanelProps) {
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
        <Typography
          variant="h1"
          gutterBottom
          align="center"
          sx={{
            fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.6rem" },
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          align="center"
          sx={{
            fontSize: { xs: "1.1rem", sm: "1.2rem", md: "1.2857rem" },
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
