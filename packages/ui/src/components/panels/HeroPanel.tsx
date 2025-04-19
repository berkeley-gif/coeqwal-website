"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, type BasePanelProps } from "./BasePanel"

interface HeroPanelProps extends BasePanelProps {
  title: string
  content: string
  backgroundImage?: string
  verticalAlignment?: "top" | "center" | "bottom"
  children?: React.ReactNode
}

/**
 * HeroPanel Component
 *
 * A full-height panel with title and content, optionally with a background image.
 *
 * @example
 * <HeroPanel
 *   title="COEQWAL la la la"
 *   content="Paragraph paragraph paragraph"
 *   backgroundImage="/images/hero-background.jpg"
 *   verticalAlignment="center"
 * />
 */
export function HeroPanel({
  title,
  content,
  backgroundImage,
  verticalAlignment = "bottom",
  children,
  ...panelProps
}: HeroPanelProps) {
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
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxWidth: "770px",
          textAlign: "left",
          position: "relative",
          zIndex: 1,
          justifyContent:
            verticalAlignment === "top"
              ? "flex-start"
              : verticalAlignment === "bottom"
                ? "flex-end"
                : "center",
          paddingTop: verticalAlignment === "top" ? "2rem" : 0,
          paddingBottom: verticalAlignment === "bottom" ? "2rem" : 0,
        }}
      >
        <Typography variant="h1" gutterBottom>
          {title}
        </Typography>

        <Typography variant="body1">{content}</Typography>

        {children}
      </Box>
    </BasePanel>
  )
}
