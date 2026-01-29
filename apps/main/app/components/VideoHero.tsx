"use client"

/**
 * VideoHero - Full-viewport hero section with background video
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 1.1.1: Video/image marked as decorative (aria-hidden, empty alt)
 * - WCAG 1.3.1: Uses semantic <section> with aria-label
 * - WCAG 2.2.2: Pause/play control for autoplay video (DO NOT REMOVE)
 * - WCAG 2.3.3: Animations handled via MotionConfig; video playback uses useReducedMotion hook
 * - WCAG 2.4.7: Focus-visible styles on interactive elements
 * - WCAG 4.1.2: Proper aria-labels on controls
 */

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"
import { motion, useReducedMotion } from "@repo/motion"
import { ScrollToButton, DisplayBlock } from "@repo/ui"
import { Box, Typography, useTheme, IconButton } from "@repo/ui/mui"

// Motion-enabled MUI components
const MotionBox = motion.create(Box)

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
}

export default function VideoHero({
  sources,
  fallbackImage,
  hideHeadline = false,
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

  // Animation variants - MotionConfig in ThemeRegistry handles reduced motion automatically
  const heroIn = {
    hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const heroInRight = {
    hidden: { opacity: 0, x: 24, filter: "blur(6px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut", delay: 0.12 },
    },
  }

  return (
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
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        pointerEvents: "auto", // Re-enable interactions (parent main has pointerEvents: none)
        cursor: "default", // Override map's pan cursor
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
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.heroControls,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            width: 44, // WCAG 2.5.5: Minimum 44x44px touch target
            height: 44,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.7)",
            },
            // WCAG 2.4.7: Focus visible indicator - DO NOT REMOVE
            "&:focus-visible": {
              outline: "2px solid white",
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

      {/* Content layout - grid stacking + flex for diagonal positioning */}
      <Box
        sx={{
          gridArea: "stack", // CSS Grid stacking: occupies same cell as video
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: theme.space.panel.topOffset,
          paddingBottom: theme.space.panel.bottomOffset,
          paddingLeft: theme.space.panel.padding,
          paddingRight: theme.space.panel.padding,
          zIndex: theme.zIndex.heroContent,
          pointerEvents: "none", // Let clicks pass through to pause button (WCAG 2.2.2)
        }}
      >
        {/* Headline - top-left on desktop, centered on mobile */}
        {/* When hideHeadline: show on mobile only (MorphingHeadline handles desktop) */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroIn}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            display: hideHeadline
              ? { xs: "flex", md: "none" } // Mobile: show, Desktop: hidden (MorphingHeadline)
              : { xs: "flex", md: "block" }, // Always show when not using MorphingHeadline
            justifyContent: { xs: "center", md: "flex-start" },
            pointerEvents: "auto", // Re-enable for text selection
          }}
        >
          <Box
            sx={{
              color: "common.white",
              textShadow: theme.textShadow.display,
              // fontSize needed for maxWidth "ch" unit to calculate correctly
              fontSize: theme.typography.h1Bold.fontSize,
              // lineHeight controls spacing between the two headline lines
              lineHeight: 1.05,
              maxWidth: "16ch",
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Typography variant="h2" component="span">
              {t("homePanel.titleLine1")}
            </Typography>
            <br />
            <Typography variant="h1Bold" component="span">
              {t("homePanel.titleLine2")}
            </Typography>
          </Box>
        </MotionBox>
        {/* Desktop spacer when headline hidden (maintains DisplayBlock position) */}
        {hideHeadline && <Box sx={{ display: { xs: "none", md: "block" } }} />}

        {/* Body - bottom-right on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroInRight}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-end" },
            display: { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-end" },
            pointerEvents: "auto", // Re-enable for text selection
          }}
        >
          <DisplayBlock
            sx={{
              // WCAG AA: Darkish transparent fill for text contrast against video
              background: "rgba(0, 0, 0, 0.2)",
            }}
          >
            {t("homePanel.content")}
          </DisplayBlock>
        </MotionBox>
      </Box>

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
          color="rgba(255, 255, 255, 0.85)"
          size={52}
          scrollToId="intro"
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
}
