"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { useScroll, useTransform, motion } from "@repo/motion"
import type { MotionValue } from "@repo/motion"
import { StickyElement } from "@repo/scrollytelling"
import { useMap } from "@repo/map"
import { mapActions } from "../../map/store"
import { useTierAnimationData } from "./useTierAnimationData"
import ParticleOverlay, { type ParticleStartPos } from "./ParticleOverlay"

const SCROLL_RUNWAY = "300vh"

const CAM_CENTER: [number, number] = [-120.5, 37.2]
const CAM_ZOOM = 6.2

interface TierAnimationSectionProps {
  scrollContainerRef: React.RefObject<HTMLElement | null>
}

export default function TierAnimationSection({
  scrollContainerRef,
}: TierAnimationSectionProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const { centroids, tierDistribution, isLoading, error } =
    useTierAnimationData()

  const runwayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const cameraSetRef = useRef(false)

  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null)
  const [startPositions, setStartPositions] = useState<ParticleStartPos[]>([])
  const [panelInView, setPanelInView] = useState(false)

  // Activate persistent map with AG_REV visualization on mount
  useEffect(() => {
    mapActions.setMapMode("get-started")
    mapActions.setOutcomeVisualization("AG_REV", "s0020")

    return () => {
      mapActions.setMapMode("hidden")
      mapActions.clearOutcomeVisualization()

      // Reset map padding on unmount
      if (mapAPI.mapRef?.current) {
        try {
          mapAPI.mapRef.current.easeTo({
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: 0,
          })
        } catch { /* ok */ }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect when the runway scrolls into view
  useEffect(() => {
    const el = runwayRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setPanelInView(true)
      },
      { threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Fly camera to Central Valley with padding matching the panel position.
  // Deferred until the panel is in view (stuck position) so getBoundingClientRect is accurate.
  useEffect(() => {
    if (!panelInView || isLoading || !mapAPI.mapRef?.current || !panelRef.current)
      return
    if (cameraSetRef.current) return

    const timer = setTimeout(() => {
      if (!panelRef.current || !mapAPI.mapRef?.current) return

      const rect = panelRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight

      const padding = {
        top: Math.max(0, Math.round(rect.top)),
        bottom: Math.max(0, Math.round(vh - rect.bottom)),
        left: Math.max(0, Math.round(rect.left)),
        right: Math.max(0, Math.round(vw - rect.right)),
      }

      mapAPI.mapRef.current.easeTo({
        center: CAM_CENTER,
        zoom: CAM_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
        padding,
      })
      cameraSetRef.current = true
    }, 200)

    return () => clearTimeout(timer)
  }, [panelInView, isLoading, mapAPI.mapRef])

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    container: scrollContainerRef,
    offset: ["start start", "end end"],
    layoutEffect: false,
  })

  const mapOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7], [1, 1, 0])

  // Measure panel size for particle end positions
  const measurePanel = useCallback(() => {
    if (!panelRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    if (rect.width === 0) return
    setPanelSize({ width: rect.width, height: rect.height })
  }, [])

  useEffect(() => {
    if (isLoading) return
    const raf = requestAnimationFrame(measurePanel)
    window.addEventListener("resize", measurePanel)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measurePanel)
    }
  }, [isLoading, measurePanel])

  // Project centroids from lng/lat to panel-relative screen coords
  const computeStartPositions = useCallback(() => {
    if (!mapAPI.mapRef?.current || !panelRef.current || centroids.length === 0)
      return

    const panelRect = panelRef.current.getBoundingClientRect()
    const positions: ParticleStartPos[] = []
    for (const c of centroids) {
      const pt = mapAPI.project(c.lng, c.lat)
      if (pt) {
        positions.push({
          x: pt.x - panelRect.left,
          y: pt.y - panelRect.top,
          color: c.color,
          tier: c.tier,
        })
      }
    }
    setStartPositions(positions)
  }, [centroids, mapAPI])

  // Compute particle positions after camera has settled and panel is in view
  useEffect(() => {
    if (!panelInView || isLoading || centroids.length === 0) return
    // Wait for camera easeTo (1500ms) + buffer
    const timer = setTimeout(computeStartPositions, 2000)
    return () => clearTimeout(timer)
  }, [panelInView, isLoading, centroids, computeStartPositions])

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

  const blueBg = theme.palette.tabPanels.explore
  const spacing = theme.space.section.sm * 8

  return (
    <div
      ref={runwayRef}
      style={{
        position: "relative",
        minHeight: SCROLL_RUNWAY,
        clipPath: "inset(0)",
        paddingLeft: spacing,
        paddingRight: spacing,
        paddingTop: spacing,
        paddingBottom: spacing,
      }}
    >
      <StickyElement top={0}>
        <Box
          ref={panelRef}
          sx={{
            position: "relative",
            height: "80vh",
            borderRadius: theme.borderRadius.lg,
            backgroundColor: "transparent",
            border: theme.border.heavy,
            overflow: "hidden",
            boxShadow: `0 0 0 100vmax ${blueBg}`,
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
              {/* White overlay that fades IN to cover the persistent map */}
              <MapFade opacity={mapOpacity} />

              {/* Particles morph from map dots into tier lines */}
              {startPositions.length > 0 && panelSize && (
                <ParticleOverlay
                  startPositions={startPositions}
                  panelWidth={panelSize.width}
                  panelHeight={panelSize.height}
                  tierDistribution={tierDistribution}
                  scrollProgress={scrollYProgress}
                />
              )}
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
        top: 0,
        right: 0,
        bottom: 0,
        width: "25%",
        backgroundColor: "white",
        opacity: inverseOpacity,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  )
}
