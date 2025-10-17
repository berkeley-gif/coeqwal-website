import React, { useEffect, useMemo, useRef, useState } from "react"
import { Typography, useTheme } from "@repo/ui/mui"
import { useTranslation } from "@repo/i18n"

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
        console.log('VideoHero mounted')
        setMounted(true)
    }, [])

    useEffect(() => {
        console.log('mounted', mounted)
        console.log('sources', sources)
        console.log('canplay', canPlay)
        if (!mounted || failed) return

        const v = videoRef.current
        if (!v) return

        const tryPlay = async () => {
            try {
                console.log('tryplay')
                await v.play()
            } catch (err) {
                // if autoplay blocked, fall back to poster
                console.warn('Hero video play() rejected:', err)
                setFailed(true)
            }
        }
        if (canPlay) tryPlay()
    }, [mounted, canPlay, failed])

    const showStaticImage = failed

    return (
        <div id='homeHero' style={{
            position: 'relative',
            minHeight: '100vh',
            width: '100%',
            overflow: 'hidden',
            paddingTop: '100px',
            paddingBottom: '100px'
        }}>
            <div id='homeHeroVid' style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
            }}>
                {showStaticImage ? (
                    <img style={{
                        objectFit: 'cover'
                    }} src={fallbackImage} />
                ) : (
                    <video
                        ref={videoRef}
                        style={{
                            height: '100%',
                            width: '100%',
                            objectFit: 'cover'
                        }}
                        muted
                        loop
                        playsInline
                        autoPlay
                        onCanPlay={() => setCanPlay(true)}
                        onError={(e) => {
                            console.warn('Hero video error', (e.target as HTMLVideoElement).error)
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
                id='homeHeroTitle'
                style={{
                    position: 'absolute',
                    left: 0,
                    minHeight: '400px',
                    width: '700px',
                    background: theme.palette.nature.earth,
                    padding: 85
                }}>
                <Typography
                    variant="h1"
                    component="h1"
                    sx={{
                        fontSize: "6.5rem", // Custom for demo with new title
                        textAlign: "left",
                        fontWeight: 500,
                        color: theme.palette.blue.darkest,
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", // Trying San Francisco on Mac, system fonts elsewhere; replace with new headline font
                    }}
                >
                    {t("homePanel.title")}
                </Typography>
            </div>
            <div
                id="homeHeroBody"
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    minHeight: '300px',
                    width: '45vw',
                    background: theme.palette.blue.darkest,
                    padding: 85
                }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',

                    gap: '25px',
                    color: theme.palette.utility.white,
                }}>
                    <Typography
                        style={{
                            fontSize: '1.4rem',
                        }}
                        variant="body1"
                    >
                        {t("homePanel.content")}
                    </Typography>
                    <Typography
                        variant="body1"
                    >
                        {t("homePanel.callToAction")}
                    </Typography>
                </div>

            </div>
        </div >
    )

}



