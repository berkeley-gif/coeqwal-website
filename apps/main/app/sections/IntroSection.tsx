"use client"

/**
 * IntroSection composes the home-page intro: a video hero, an About
 * COEQWAL panel, and a sticky-scrolling Water Themes panel. Each panel
 * renders its own static header inline rather than a shared floating
 * headline overlay.
 */

import { Suspense, useRef } from "react"
import { Box } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"

import VideoHero from "./intro/VideoHero"
import type { VideoSource } from "./intro/VideoHero"
import { WaterThemesPanel } from "./intro/WaterThemesPanel"

import { AboutCoeqwalPanel } from "./intro/AboutCoeqwalPanel"
import { useHeroScrollObserver } from "./intro/useHeroScrollObserver"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const IntroSection = () => {
  const videoHeroRef = useRef<HTMLDivElement>(null)
  useHeroScrollObserver(videoHeroRef)

  return (
    <Box sx={{ pointerEvents: "auto" }}>
      <div ref={videoHeroRef}>
        <VideoHero
          sources={VIDEO_SRCS}
          fallbackImage="/images/home_hero_fallback.png"
        />
      </div>

      <AboutCoeqwalPanel />
      <WaterThemesPanel />

    </Box>
  )
}

export default IntroSection
