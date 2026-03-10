"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { useScroll, useTransform, motion } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { StickyElement } from "@repo/scrollytelling"
import { useTierAnimationData } from "./useTierAnimationData"
import TierDemoMap, { type TierDemoMapHandle } from "./TierDemoMap"
import ParticleOverlay, { type ParticleStartPos } from "./ParticleOverlay"
import { OutcomeGlyph } from "@repo/viz"

const SCROLL_RUNWAY = "300vh"
const GLYPH_SIZE = 280

interface TierAnimationSectionProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export default function TierAnimationSection({
  scrollContainerRef,
}: TierAnimationSectionProps) {
  const theme = useTheme()
  const { tierColorMap, centroids, tierDistribution, tierColors, isLoading, error } =
    useTierAnimationData()

  const runwayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const glyphRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<TierDemoMapHandle>(null)

  const [glyphRect, setGlyphRect] = useState<{
    x: number; y: number; width: number; height: number
  } | null>(null)
  const [startPositions, setStartPositions] = useState<ParticleStartPos[]>([])

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    container: scrollContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  const mapOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [1, 1, 0])
  const glyphOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0, 1])

  // Measure glyph position relative to the panel container
  const measureGlyph = useCallback(() => {
    if (!glyphRef.current || !panelRef.current) return
    const panelRect = panelRef.current.getBoundingClientRect()
    const elRect = glyphRef.current.getBoundingClientRect()
    if (elRect.width === 0) return
    setGlyphRect({
      x: elRect.left - panelRect.left,
      y: elRect.top - panelRect.top,
      width: elRect.width,
      height: elRect.height,
    })
  }, [])

  // Measure after loading completes and glyph is rendered
  useEffect(() => {
    if (isLoading) return
    // Wait for layout to settle
    const raf = requestAnimationFrame(() => {
      measureGlyph()
    })
    window.addEventListener("resize", measureGlyph)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measureGlyph)
    }
  }, [isLoading, measureGlyph])

  const computeStartPositions = useCallback(() => {
    if (!mapRef.current || centroids.length === 0) return

    const positions: ParticleStartPos[] = []
    for (const c of centroids) {
      const pt = mapRef.current.project(c.lng, c.lat)
      if (pt) {
        positions.push({ x: pt.x, y: pt.y, color: c.color, tier: c.tier })
      }
    }
    setStartPositions(positions)
  }, [centroids])

  useEffect(() => {
    if (isLoading || centroids.length === 0) return
    const timer = setTimeout(computeStartPositions, 1500)
    return () => clearTimeout(timer)
  }, [isLoading, centroids, computeStartPositions])

  useEffect(() => {
    window.addEventListener("resize", computeStartPositions)
    return () => window.removeEventListener("resize", computeStartPositions)
  }, [computeStartPositions])

  if (error) {
    return (
      <Box
        sx={{
          mx: theme.space.section.sm,
          my: theme.space.section.sm,
          minHeight: "50vh",
          borderRadius: theme.borderRadius.lg,
          backgroundColor: theme.palette.common.white,
          border: theme.border.heavy,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Could not load tier animation data.
        </Typography>
      </Box>
    )
  }

  return (
    <div
      ref={runwayRef}
      style={{
        position: "relative",
        minHeight: SCROLL_RUNWAY,
        marginLeft: theme.space.section.sm * 8,
        marginRight: theme.space.section.sm * 8,
        marginTop: theme.space.section.sm * 8,
        marginBottom: theme.space.section.sm * 8,
      }}
    >
      <StickyElement top={0}>
        <Box
          ref={panelRef}
          sx={{
            position: "relative",
            height: "80vh",
            borderRadius: theme.borderRadius.lg,
            backgroundColor: theme.palette.common.white,
            border: theme.border.heavy,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              p: theme.space.panel.padding,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <Typography variant="h3" component="h2" color="text.secondary">
              Outcomes
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, maxWidth: 420, color: "text.secondary" }}
            >
              Each polygon on the map represents an agricultural demand unit.
              Scroll to see how they assemble into the tier distribution glyph.
            </Typography>
          </Box>

          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <CircularProgress size={40} />
            </Box>
          ) : (
            <>
              {/* Map layer */}
              <TierDemoMap ref={mapRef} tierColorMap={tierColorMap} />
              <MapFade opacity={mapOpacity} />

              {/* Particle overlay — only render once glyph is measured */}
              {startPositions.length > 0 && glyphRect && (
                <ParticleOverlay
                  startPositions={startPositions}
                  glyphRect={glyphRect}
                  tierDistribution={tierDistribution}
                  scrollProgress={scrollYProgress}
                />
              )}

              {/* Glyph target */}
              <motion.div
                ref={glyphRef}
                style={{
                  position: "absolute",
                  bottom: "10%",
                  right: "10%",
                  zIndex: 3,
                  opacity: glyphOpacity,
                }}
              >
                <OutcomeGlyph
                  size={GLYPH_SIZE}
                  values={tierDistribution}
                  tierColors={tierColors}
                />
              </motion.div>
            </>
          )}
        </Box>
      </StickyElement>
    </div>
  )
}

function MapFade({ opacity }: { opacity: MotionValue<number> }) {
  const inverseOpacity = useTransform(opacity, (v) => 1 - v)

  return (
    <motion.div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "white",
        opacity: inverseOpacity,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  )
}
