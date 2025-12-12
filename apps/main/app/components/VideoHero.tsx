import React, { useEffect, useMemo, useRef, useState } from "react"
import { Typography, useTheme, Box } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

import { HEADER_EXPANDED_H } from "../../../../packages/ui/src/components/navigation/BaseHeader"

// Format text with medium weight on key words
const formatHeroText = (text: string) => {
  const parts = text.split(/(\blearn\b|\bexplore\b|\bempowers?\b)/gi)

  return parts.map((part, index) => {
    if (part.match(/\b(learn|explore|empowers?)\b/i)) {
      return (
        <span key={index} style={{ fontWeight: 600 }}>
          {part}
        </span>
      )
    }
    return part
  })
}

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

export default function VideoHero({
  sources,
  fallbackImage,
  className,
  id,
  title,
  paragraphs,
  children,
}: VideoHeroProps) {
  const theme = useTheme()
  const { t } = useTranslation()
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

  return (
    <div
      id="homeHero"
      style={{
        position: "relative",
        height: `calc(100vh - ${HEADER_EXPANDED_H}px)`,
        width: "100%",
        overflow: "hidden",
        paddingTop: "50px",
        paddingBottom: "100px",
        marginTop: HEADER_EXPANDED_H,
      }}
    >
      <div
        id="homeHeroVid"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      >
        {showStaticImage ? (
          <img
            style={{
              objectFit: "cover",
            }}
            src={fallbackImage}
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
      </div>
      <div
        id="homeHeroTitle"
        style={{
          position: "absolute",
          left: 0,
          width: "auto",
          background: theme.palette.nature.earth,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { sm: "2.5rem", md: "3rem", lg: "2.6rem", xl: "5.5rem" }, // Custom for demo with new title
            padding: { sm: "45px", md: "45px" },
            lineHeight: "120%",
            textAlign: "left",
            fontWeight: 500,
            width: "auto",
            color: theme.palette.blue.darkest,
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", // Trying San Francisco on Mac, system fonts elsewhere; replace with new headline font
          }}
        >
          {t("homePanel.titleLine1")} <br />
          {t("homePanel.titleLine2")}
        </Typography>
      </div>
      <div id="scrollArrow">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            height: "80vh",
          }}
        >
          <Box
            component="span"
            sx={{
              fontSize: "2.5rem",
              color: "white",
              animation: "bounce 2s ease-in-out infinite",
              "@keyframes bounce": {
                "0%, 100%": { transform: "translateY(0)" },
                "50%": { transform: "translateY(-8px)" },
              },
            }}
          >
            ↓
          </Box>
        </Box>
      </div>
      <div
        id="homeHeroBody"
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          minHeight: "auto",
          maxWidth: "40vw",
          background: theme.palette.blue.darkest,
          padding: "50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "25px",
            color: theme.palette.utility.white,
          }}
        >
          <Typography
            sx={{
              fontSize: { md: "1.1rem", lg: "1.2rem", xl: "1.5rem" },
            }}
            variant="body1"
          >
            {t("homePanel.content")}
          </Typography>
        </div>
      </div>
    </div>
  )
}
