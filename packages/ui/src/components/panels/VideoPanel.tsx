"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"
import { VideoBackground } from "../common/VideoBackground"

// Create an extended interface that doesn't conflict with BasePanelProps
interface VideoPanelProps extends Omit<BasePanelProps, "content"> {
  title: string
  content: string | string[]
  videoSrc: string
  posterSrc: string
  overlayOpacity?: number
  verticalAlignment?: "top" | "center" | "bottom"
  paragraphBgColor?: string
  children?: React.ReactNode
}

/**
 * VideoPanel Component
 *
 * A full-height panel with video background, title, and content.
 * Extends the basic panel functionality to include a video background.
 *
 * Content can be provided as:
 * - A single string
 * - An array of paragraph strings
 *
 * @example
 * <VideoPanel
 *   title="COEQWAL la la la"
 *   content={[
 *     "First paragraph",
 *     "Second paragraph"
 *   ]}
 *   videoSrc="/videos/background.mp4"
 *   posterSrc="/videos/poster.jpg"
 *   overlayOpacity={0.5}
 *   verticalAlignment="center"
 *   paragraphBgColor="rgba(154, 203, 207, 0.5)"
 * />
 */
export function VideoPanel({
  title,
  content,
  videoSrc,
  posterSrc,
  overlayOpacity = 0.5,
  verticalAlignment = "top",
  paragraphBgColor,
  children,
  ...panelProps
}: VideoPanelProps) {
  // Handle content as either string or array
  const contentParagraphs = Array.isArray(content)
    ? content
    : content.split(/\n\n+/)

  return (
    <BasePanel
      fullHeight={true}
      paddingVariant="wide"
      background="dark"
      {...panelProps}
      sx={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "transparent",
        height: "100%",
        ...panelProps.sx,
      }}
    >
      {/* Video  */}
      <VideoBackground
        videoSrc={videoSrc}
        posterSrc={posterSrc}
        opacity={overlayOpacity}
      />

      {/* Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxWidth: "770px",
          textAlign: "left",
          position: "relative",
          zIndex: 2, // Ensure content is above video
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

        <Box
          sx={(theme) => ({
            backgroundColor: paragraphBgColor || theme.background.paragraph,
            borderRadius: theme.borderRadius.standard,
            padding: theme.spacing(3),
            marginLeft: theme.spacing(-3), // Negative margin to align with title
          })}
        >
          {contentParagraphs.map((paragraph, index) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ mb: index < contentParagraphs.length - 1 ? 2 : 0 }}
            >
              {paragraph}
            </Typography>
          ))}
        </Box>

        {children}
      </Box>
    </BasePanel>
  )
}
