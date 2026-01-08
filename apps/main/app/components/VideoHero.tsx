/**
 * VideoHero - Full-viewport hero section with background video
 *
 * WCAG 2.0 AA Compliance Notes:
 * - WCAG 1.1.1: Video/image marked as decorative (aria-hidden, empty alt)
 * - WCAG 1.3.1: Uses semantic <section> with aria-label
 * - WCAG 2.2.2: Pause/play control for autoplay video (DO NOT REMOVE)
 * - WCAG 2.3.3: Respects prefers-reduced-motion preference
 * - WCAG 2.4.7: Focus-visible styles on interactive elements
 * - WCAG 4.1.2: Proper aria-labels on controls
 */

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"
import { ScrollToButton, DisplayBlock } from "@repo/ui"
import { Box, Typography, useTheme, IconButton } from "@repo/ui/mui"

// Motion-enabled MUI components
const MotionBox = motion.create(Box)

// WCAG 2.3.3: Check for reduced motion preference
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false

export type VideoSource = { src: string; type: string }
export interface VideoHeroProps {
  sources: VideoSource[]
  poster?: string
  fallbackImage?: string
  className?: string
  id?: string
  title?: string
  paragraphs?: string[] // The paragraphs that appear underneath the title: Max 2
  children?: React.ReactNode // Custom content in case you don't want the title/paragraphs layout
}

export default function VideoHero({ sources, fallbackImage }: VideoHeroProps) {
  const { t } = useTranslation()
  const theme = useTheme()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [canPlay, setCanPlay] = useState(false)
  const [failed, setFailed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(!prefersReducedMotion)

  useEffect(() => {
    setMounted(true)
  }, [])

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
  }, [mounted, canPlay, failed, isPlaying])

  const showStaticImage = failed

  // WCAG 2.3.3: Reduced motion variants - simplified animations for accessibility
  const heroIn = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
        hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
        show: {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          transition: { duration: 0.6, ease: "easeOut" },
        },
      }

  const heroInRight = prefersReducedMotion
    ? {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.3 } },
      }
    : {
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
    <Box
      component="section"
      id="homeHero"
      aria-label="Welcome to COEQWAL"
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        pointerEvents: "auto", // Re-enable interactions (parent main has pointerEvents: none)
        cursor: "default", // Override map's pan cursor
      }}
    >
      {/* WCAG 1.1.1: Decorative video/image - hidden from assistive technology */}
      <Box
        id="homeHeroVid"
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
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

      {/* Content layout — flex space-between for diagonal positioning */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
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
        {/* Headline — top-left on desktop, centered on mobile */}
        <MotionBox
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={heroIn}
          sx={{
            alignSelf: { xs: "stretch", md: "flex-start" },
            display: { xs: "flex", md: "block" },
            justifyContent: { xs: "center", md: "flex-start" },
            pointerEvents: "auto", // Re-enable for text selection
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "common.white",
              textShadow: theme.textShadow.display,
              maxWidth: "16ch",
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Box component="span" sx={{ fontSize: "0.8em" }}>
              {t("homePanel.titleLine1")}
            </Box>
            <br />
            <Box component="span" sx={{ fontWeight: 700 }}>
              {t("homePanel.titleLine2")}
            </Box>
          </Typography>
        </MotionBox>

        {/* Body — bottom-right on desktop, centered on mobile */}
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
          <DisplayBlock>{t("homePanel.content")}</DisplayBlock>
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

      {/* Gradient overlay — subtle vignette for depth (decorative) */}
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.35) 80%, rgba(0, 0, 0, 0.55) 100%)",
          pointerEvents: "none",
          zIndex: theme.zIndex.heroBackground,
        }}
      />
    </Box>
  )
}
