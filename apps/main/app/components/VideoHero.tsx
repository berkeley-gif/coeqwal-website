import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"
import { ScrollToButton, DisplayBlock } from "@repo/ui"
import { Box, Typography, useTheme } from "@repo/ui/mui"

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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || failed) return

    const v = videoRef.current
    if (!v) return

    const tryPlay = async () => {
      try {
        await v.play()
      } catch (err) {
        // if autoplay blocked, fall back to poster
        console.warn("Hero video play() rejected:", err)
        setFailed(true)
      }
    }
    if (canPlay) tryPlay()
  }, [mounted, canPlay, failed])

  const showStaticImage = failed

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
    <Box
      id="homeHero"
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Video background */}
      <Box
        id="homeHeroVid"
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        {showStaticImage ? (
          <Image
            src={fallbackImage || ""}
            alt="Video fallback"
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
            autoPlay
            poster={fallbackImage} // Shows while video loads
            onCanPlay={() => setCanPlay(true)}
            onError={(e) => {
              console.warn(
                "Hero video error",
                (e.target as HTMLVideoElement).error,
              )
              setFailed(true)
            }}
            aria-hidden
            preload="metadata"
            onLoadedMetadata={() => {
              // optional: try again once metadata is ready
              videoRef.current?.play().catch(() => setFailed(true))
            }}
          >
            {sources.map((s, i) => (
              <source key={i} src={s.src} type={s.type} />
            ))}
          </video>
        )}
      </Box>

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
          zIndex: 1,
          pointerEvents: "auto",
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
          }}
        >
          <Typography
            variant="h1"
            sx={{
              color: "common.white",
              textShadow: theme.textShadow.display,
              maxWidth: "16ch",
              textAlign: { xs: "center", md: "left" }, // Centered on mobile, left on desktop
            }}
          >
            {t("homePanel.titleLine1")}
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
          }}
        >
          <DisplayBlock>
            {t("homePanel.content")}
          </DisplayBlock>
        </MotionBox>
      </Box>

      {/* Scroll indicator — centered at bottom */}
      <Box
        sx={{
          position: "absolute",
          bottom: "clamp(24px, 4vh, 48px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        <ScrollToButton
          color="rgba(255, 255, 255, 0.85)"
          size={52}
        />
      </Box>

      {/* Gradient overlay — subtle vignette for depth */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.35) 80%, rgba(0, 0, 0, 0.55) 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </Box>
  )
}
