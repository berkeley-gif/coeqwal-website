"use client"

/**
 * VideoHero - Full-viewport hero section with background video
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 1.1.1: Video/image marked as decorative (aria-hidden, empty alt)
 * - WCAG 1.3.1: Uses semantic <section> with aria-label
 * - WCAG 2.2.2: Pause/play control for autoplay video (DO NOT REMOVE)
 * - WCAG 2.3.3: Animations handled via MotionConfig. Video playback uses useReducedMotion hook
 * - WCAG 2.4.7: Focus-visible styles on interactive elements
 * - WCAG 4.1.2: Proper aria-labels on controls
 */

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"
import { useReducedMotion } from "@repo/motion"
import {
  ScrollToButton,
  resolveRadius,
  resolveInset,
  resolveCssLengthPx,
  type RadiusValue,
  type PanelInset,
} from "@repo/ui"
import { Box, Typography, useTheme, IconButton } from "@repo/ui/mui"

export type VideoSource = { src: string; type: string }
export interface VideoHeroProps {
  sources: VideoSource[]
  poster?: string
  fallbackImage?: string
  className?: string
  id?: string
  title?: string
  paragraphs?: string[] // The paragraphs that appear underneath the title
  children?: React.ReactNode // Custom content in case you don't want the title/paragraphs layout
  /** Hide the headline (for use with MorphingHeadline) */
  hideHeadline?: boolean
  /** Rounded corner radius. Token key or raw CSS value. */
  borderRadius?: RadiusValue
  /** Pull the hero in from the viewport edges so all four rounded
   *  corners are visible against a `frameBackground`. */
  inset?: PanelInset
  /** Background rendered in the frame around an inset hero. */
  frameBackground?: string
}

export default function VideoHero({
  sources,
  fallbackImage,
  hideHeadline = false,
  borderRadius,
  inset,
  frameBackground,
}: VideoHeroProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [failed, setFailed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // WCAG 2.3.3: Use hook to respect user's reduced motion preference for video playback
  const prefersReducedMotion = useReducedMotion()
  const [isPlaying, setIsPlaying] = useState(false)

  // Set initial playing state after mount (hook returns null on SSR)
  useEffect(() => {
    setMounted(true)
    // Start playing only if user doesn't prefer reduced motion
    if (prefersReducedMotion === false) {
      setIsPlaying(true)
    }
  }, [prefersReducedMotion])

  /**
   * WCAG 2.2.2: Pause, Stop, Hide
   * Users must be able to pause autoplay video content.
   * DO NOT REMOVE this function or the associated button.
   */
  const toggleVideoPlayback = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video.play().catch(() => setFailed(true))
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    if (!mounted || failed) return

    const v = videoRef.current
    if (!v) return

    // WCAG 2.3.3: Respect prefers-reduced-motion - DO NOT REMOVE
    if (prefersReducedMotion) {
      v.pause()
      setIsPlaying(false)
      return
    }

    const tryPlay = async () => {
      try {
        await v.play()
        setIsPlaying(true)
      } catch (err) {
        // if autoplay blocked, fall back to poster
        console.warn("Hero video play() rejected:", err)
        setFailed(true)
        setIsPlaying(false)
      }
    }
    if (canPlay && isPlaying) tryPlay()
  }, [mounted, canPlay, failed, isPlaying, prefersReducedMotion])

  const showStaticImage = failed

  const radius = resolveRadius(borderRadius, theme.borderRadius)
  const insetCfg = resolveInset(inset)

  // Inset mode uses a wrapping frame Box. Inner height must subtract the
  // vertical frame padding so the hero still fits one viewport.
  const heroHeight =
    insetCfg && insetCfg.y !== 0
      ? typeof insetCfg.y === "number"
        ? `calc(100vh - ${insetCfg.y * 2}px)`
        : `calc(100vh - (${insetCfg.y} * 2))`
      : "100vh"

  const hero = (
    // WCAG 1.3.1: Semantic section element with accessible name
    // Uses CSS Grid stacking for layering video behind content
    <Box
      component="section"
      id="homeHero"
      aria-label="Welcome to COEQWAL"
      sx={{
        position: "relative", // For absolute children (pause button, scroll indicator)
        display: "grid",
        gridTemplateAreas: '"stack"',
        gridTemplateRows: "1fr",
        height: heroHeight,
        width: "100%",
        overflow: "hidden",
        pointerEvents: "auto", // Re-enable interactions (parent main has pointerEvents: none)
        cursor: "default", // Override map's pan cursor
        borderRadius: radius,
      }}
    >
      {/* WCAG 1.1.1: Decorative video/image, hidden from assistive technology */}
      {/* Grid stacking: all children with gridArea: "stack" occupy same cell */}
      <Box
        id="homeHeroVid"
        aria-hidden="true"
        sx={{
          gridArea: "stack",
          zIndex: theme.zIndex.heroBackground,
        }}
      >
        {showStaticImage ? (
          <Image
            src={fallbackImage || ""}
            alt="" // WCAG 1.1.1: Empty alt for decorative image - DO NOT ADD TEXT
            role="presentation"
            fill
            style={{ objectFit: "cover" }}
            unoptimized // Required for SSG/static export
            priority
          />
        ) : (
          <video
            ref={videoRef}
            style={{
              height: "100%",
              width: "100%",
              objectFit: "cover",
            }}
            muted
            loop
            playsInline
            autoPlay={!prefersReducedMotion} // WCAG 2.3.3: Respects reduced motion
            poster={fallbackImage}
            onCanPlay={() => setCanPlay(true)}
            onError={(e) => {
              console.warn(
                "Hero video error",
                (e.target as HTMLVideoElement).error,
              )
              setFailed(true)
            }}
            aria-hidden="true" // WCAG 1.1.1: Decorative video - DO NOT REMOVE
            preload="metadata"
            onLoadedMetadata={() => {
              if (!prefersReducedMotion) {
                videoRef.current?.play().catch(() => setFailed(true))
              }
            }}
          >
            {sources.map((s, i) => (
              <source key={i} src={s.src} type={s.type} />
            ))}
          </video>
        )}
      </Box>

      {/*
        WCAG 2.2.2: Pause, Stop, Hide - DO NOT REMOVE THIS BUTTON
        Users must be able to pause autoplay video content.
        WCAG 2.4.7: Focus-visible styles for keyboard navigation
        WCAG 4.1.2: aria-label and aria-pressed for screen readers
      */}
      {!showStaticImage && (
        <IconButton
          onClick={toggleVideoPlayback}
          aria-label={
            isPlaying ? "Pause background video" : "Play background video"
          }
          aria-pressed={isPlaying}
          sx={{
            position: "absolute",
            bottom: "clamp(24px, 4vh, 48px)",
            right: 16,
            zIndex: theme.zIndex.heroControls,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "text.secondary",
            width: 52,
            height: 52,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
            // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
            "&:focus-visible": {
              outline: `2px solid ${theme.palette.text.secondary}`,
              outlineOffset: 2,
            },
          }}
        >
          {/* SVG icons with aria-hidden (label is on button) */}
          {isPlaying ? (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </IconButton>
      )}

      {/* Headline.upper-left, offset below fixed header */}
      <Box
        sx={{
          gridArea: "stack",
          display: hideHeadline ? { xs: "block", lg: "none" } : "block",
          alignSelf: "flex-start",
          justifySelf: "flex-start",
          marginTop: `calc(${theme.layout.headerHeight}px + 48px)`,
          marginLeft: theme.space.panel.padding,
          marginRight: theme.space.panel.padding,
          maxWidth: { xs: "100%", sm: "720px" },
          color: "text.secondary",
          textShadow: theme.textShadow.display,
          pointerEvents: "auto",
          zIndex: theme.zIndex.heroContent,
        }}
      >
        <Typography
          variant="h2Main"
          component="h2"
          sx={{ display: "block", mb: 0.5 }}
        >
          {t("homePanel.titleLine1")}
        </Typography>
        <Typography variant="h1" component="h1" sx={{ display: "block" }}>
          {t("homePanel.titleLine2")}
        </Typography>
      </Box>

      {/* Paragraph.lower-right. Left edge aligns with the first
          header nav item ("Guides") via the `--coeqwal-nav-left`
          CSS variable published by BaseHeader. Right edge aligns
          with the header's right panel padding so the block tracks
          the nav horizontally. Falls back gracefully if the header
          hasn't measured yet (e.g. SSR, mobile nav). */}
      <Typography
        variant="displayBody"
        component="p"
        sx={{
          position: "absolute",
          bottom: theme.space.panel.topOffset,
          left: `var(--coeqwal-nav-left, calc(100% - 480px - ${theme.space.panel.padding}))`,
          right: theme.space.panel.padding,
          textAlign: "left",
          color: "text.secondary",
          textShadow: theme.textShadow.nav,
          lineHeight: 1.6,
          pointerEvents: "auto",
          zIndex: theme.zIndex.heroContent,
        }}
      >
        {t("homePanel.content")}
      </Typography>

      {/* WCAG 2.4.4: Scroll indicator with descriptive aria-label */}
      <Box
        sx={{
          position: "absolute",
          bottom: "clamp(24px, 4vh, 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: theme.zIndex.heroScrollIndicator,
        }}
      >
        <ScrollToButton
          label={
            <Typography
              component="span"
              variant="overline"
              aria-hidden
              sx={{
                color: `${theme.palette.text.secondary}E6`,
                textShadow: theme.textShadow.nav,
                letterSpacing: "0.2em",
                fontWeight: 600,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {t("homePanel.scrollHint")}
            </Typography>
          }
          color={`${theme.palette.text.secondary}D9`}
          size={52}
          scrollToId="about-coeqwal"
          // Scroll so the About panel's rounded card sits flush
          // below the header: subtract the header height, then add
          // back one top frame-gap (`theme.layout.panel.insetY`) so
          // the frame strip tucks under the header instead of
          // appearing as extra whitespace above the card. Resolved
          // at click time so the responsive `clamp()` value is
          // read at the viewport's current width.
          scrollOffset={() =>
            theme.layout.headerHeight -
            resolveCssLengthPx(theme.layout.panel.insetY, 24)
          }
          ariaLabel="Scroll down to learn more"
        />
      </Box>

      {/* Gradient overlay - subtle vignette for depth (decorative) */}
      <Box
        aria-hidden="true"
        sx={{
          gridArea: "stack", // CSS Grid stacking
          background:
            "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.35) 80%, rgba(0, 0, 0, 0.55) 100%)",
          pointerEvents: "none",
          zIndex: theme.zIndex.heroBackground,
        }}
      />
    </Box>
  )

  if (insetCfg) {
    return (
      <Box
        sx={{
          background: frameBackground ?? "transparent",
          px: insetCfg.x,
          py: insetCfg.y,
          width: "100%",
        }}
      >
        {hero}
      </Box>
    )
  }

  return hero
}
