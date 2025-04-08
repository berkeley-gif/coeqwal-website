"use client"

import { Box, Typography } from "@mui/material"
import { BasePanel, BasePanelProps } from "./index"
import { VideoBackground } from "../common/VideoBackground"

interface VideoPanelProps extends BasePanelProps {
  title: string
  content: string
  videoSrc: string
  posterSrc: string
  overlayOpacity?: number
  children?: React.ReactNode
}

/**
 * VideoPanel Component
 *
 * A full-height panel with video background, title, and content.
 * Extends the basic panel functionality to include a video background.
 *
 * @example
 * <VideoPanel
 *   title="COEQWAL la la la"
 *   content="Paragraph paragraph paragraph"
 *   videoSrc="/videos/background.mp4"
 *   posterSrc="/videos/poster.jpg"
 *   overlayOpacity={0.5}
 * />
 */
export function VideoPanel({
  title,
  content,
  videoSrc,
  posterSrc,
  overlayOpacity = 0.5,
  children,
  ...panelProps
}: VideoPanelProps) {
  return (
    <BasePanel
      fullHeight={true}
      paddingVariant="wide"
      {...panelProps}
      sx={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
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
