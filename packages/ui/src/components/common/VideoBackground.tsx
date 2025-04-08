"use client"

import { Box } from "@mui/material"
import { FC, useRef, useEffect } from "react"

interface VideoBackgroundProps {
  videoSrc: string
  posterSrc: string
  opacity?: number
  children?: React.ReactNode
}

export const VideoBackground: FC<VideoBackgroundProps> = ({
  videoSrc,
  posterSrc,
  opacity = 0.5,
  children,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Ensure video plays when component mounts
  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          await videoRef.current.play()
          console.log("Video is playing")
        } catch (err) {
          console.error("Error playing video:", err)
        }
      }
    }

    playVideo()
  }, [])

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Direct HTML5 video element with inline styles for maximum browser compatibility */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={posterSrc}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          minWidth: "100%",
          minHeight: "100%",
          width: "auto",
          height: "auto",
          transform: "translateX(-50%) translateY(-50%)",
          objectFit: "cover",
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "black",
          opacity: opacity,
        }}
      />

      {/* Content container */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          zIndex: 2,
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
