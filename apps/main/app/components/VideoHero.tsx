import React, { useEffect, useMemo, useRef, useState } from "react"
import { Typography, useTheme, Box } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"
import { motion } from "@repo/motion"
import { ScrollToButton } from "@repo/ui"

import { HEADER_EXPANDED_H } from "../../../../packages/ui/src/components/navigation/BaseHeader"

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
    <div
      id="homeHero"
      style={{
        position: "relative",
        height: `calc(100vh - ${HEADER_EXPANDED_H}px)`,
        width: "100%",
        overflow: "hidden",
        paddingTop: "75px",
        marginTop: HEADER_EXPANDED_H,
      }}
    >
      {/** Video */}
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
      {/** Title / Question */}
      <motion.div
        id="homeHeroTitle"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={heroIn}
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
            fontSize: {
              sm: "2.2rem",
              md: "2.8rem",
              lg: "2.6rem",
              xl: "3.8rem",
            }, // Custom for demo with new title
            padding: { sm: "35px", md: "45px" },
            lineHeight: "140%",
            textAlign: "left",
            fontWeight: 500,
            width: "auto",
            color: theme.palette.blue.darkest,
            fontFamily: theme.typography.fontFamily,
          }}
        >
          {t("homePanel.titleLine1")} <br />
          {t("homePanel.titleLine2")}
        </Typography>
      </motion.div>

      {/** Body Text */}
      <motion.div
        id="homeHeroBody"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={heroInRight}
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
            flexDirection: "column",
            gap: "10px",
            color: theme.palette.common.white,
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
          <ScrollToButton color={theme.palette.common.white} size={70} />
        </div>
      </motion.div>
    </div>
  )
}
