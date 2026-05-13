"use client"

/**
 * IntroSection composes the home-page intro: a video hero, an About
 * COEQWAL panel, a sticky-scrolling Water Themes panel, and a closing
 * "Want to know more?" panel. A `MorphingHeadline` is fixed in the
 * upper-left corner and morphs through three text states timed against
 * the seams between the first three panels.
 *
 * The morphing-headline plumbing (gap meeting events, crossfade
 * windows, glide-to-center motion ranges, headline-height measurement,
 * per-panel content opacity sync) lives in
 * `./intro/useMorphingHeadlineChoreography`. This file is the
 * composition root.
 */

import { Suspense, useRef } from "react"
import { Box, useTheme } from "@repo/ui/mui"
import { ErrorBoundary } from "@repo/utils"

import VideoHero from "./intro/VideoHero"
import type { VideoSource } from "./intro/VideoHero"
import MorphingHeadline from "./intro/MorphingHeadline"
import { WaterThemesPanel } from "./intro/WaterThemesPanel"

import { AboutCoeqwalPanel } from "./intro/AboutCoeqwalPanel"
import { ViewportCenterMarker } from "./intro/ViewportCenterMarker"
import { WantToKnowMorePanel } from "./intro/WantToKnowMorePanel"
import { useHeadlines } from "./intro/useHeadlines"
import { useHeroScrollObserver } from "./intro/useHeroScrollObserver"
import { useMorphingHeadlineChoreography } from "./intro/useMorphingHeadlineChoreography"

const VIDEO_SRCS: VideoSource[] = [
  {
    src: "/video/landing-hero-reel.mp4",
    type: "video/mp4",
  },
]

const IntroSection = () => {
  const theme = useTheme()

  const containerRef = useRef<HTMLDivElement>(null)
  const morphHeadlineRef = useRef<HTMLDivElement>(null)
  const viewportCenterRef = useRef<HTMLDivElement>(null)
  const videoHeroRef = useRef<HTMLDivElement>(null)
  const aboutPanelRef = useRef<HTMLDivElement>(null)
  const waterThemesPanelRef = useRef<HTMLDivElement>(null)
  // Dock marker at the end of the WaterThemes 300vh sticky section.
  // The MorphingHeadline docks here so it only scrolls away once the
  // full section is done.
  const waterThemesDockRef = useRef<HTMLDivElement>(null)

  useHeroScrollObserver(videoHeroRef)

  const headlines = useHeadlines()

  const {
    headlineHeight,
    panelBoundaries,
    crossfadeAt1,
    crossfadeRanges,
    centerEnterRange,
    centerExitRange,
    aboutOpacity,
    waterThemesOpacity,
  } = useMorphingHeadlineChoreography({
    refs: {
      containerRef,
      headlineRef: morphHeadlineRef,
      videoHeroRef,
      aboutPanelRef,
      waterThemesPanelRef,
      viewportCenterRef,
    },
  })

  return (
    <Box ref={containerRef} sx={{ pointerEvents: "auto" }}>
      <ViewportCenterMarker ref={viewportCenterRef} height={headlineHeight} />

      <MorphingHeadline
        ref={morphHeadlineRef}
        headlines={headlines}
        containerRef={containerRef}
        weights={[1, 1, 2]}
        panelBoundaries={panelBoundaries}
        crossfadeAt={crossfadeAt1 > 0 ? crossfadeAt1 : undefined}
        crossfadeRanges={crossfadeRanges}
        dockRef={waterThemesDockRef}
        centerEnterRange={centerEnterRange}
        centerExitRange={centerExitRange}
      />

      <div ref={videoHeroRef}>
        <VideoHero
          sources={VIDEO_SRCS}
          fallbackImage="/images/home_hero_fallback.png"
          hideHeadline
        />
      </div>

      <AboutCoeqwalPanel ref={aboutPanelRef} contentOpacity={aboutOpacity} />

      {/* WaterThemesPanel reads `?theme=...` via `usePanelRoute`
          (which calls `useSearchParams`), so it must sit under a
          Suspense boundary. The boundary is local here, not around
          the entire IntroSection in page.tsx, so the rest of the
          intro (VideoHero, About panel) renders at SSG.

          Silent null fallback on error: this is a passive scroll
          decoration. Replacing it with an error UI mid-intro would
          be more disruptive than letting it disappear. */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <WaterThemesPanel
            panelRef={waterThemesPanelRef}
            dockRef={waterThemesDockRef}
            contentOpacity={waterThemesOpacity}
            borderRadius={theme.layout.panel.radius}
            inset={{
              x: theme.layout.panel.insetX,
              y: theme.layout.panel.insetY,
            }}
            frameBackground={theme.palette.common.white}
          />
        </Suspense>
      </ErrorBoundary>

      <WantToKnowMorePanel />
    </Box>
  )
}

export default IntroSection
