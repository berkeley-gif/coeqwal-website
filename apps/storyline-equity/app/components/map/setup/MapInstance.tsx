"use client"

import { ReactNode, useEffect, useRef } from "react"
import { Box, Typography } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { Map, useMap } from "@repo/map"
import "./mapboxControlStyles.css"
import {
  useActiveSectionStore,
  useCameraView,
  useConclusionProgress,
} from "../../../store"
import { CALIFORNIA_VIEW } from "../config/cameraPresets"

const visualCopy = {
  Background: {
    title: "Map title — Background",
    caption: "Placeholder caption for the Background frame.",
  },
  HistoricalContext: {
    title: "Map title — Historical context",
    caption: "Placeholder caption for the Historical Context frame.",
  },
  GoldRush: {
    title: "Map title — Gold Rush",
    caption: "Placeholder caption for the Gold Rush frame.",
  },
  Infrastructure: {
    title: "Map title — Infrastructure",
    caption: "Placeholder caption for the Infrastructure frame.",
  },
  ClimateResilience: {
    title: "Map title — Climate resilience",
    caption: "Placeholder caption for the Climate Resilience frame.",
  },
  Transparency: {
    title: "Map title — Transparency",
    caption: "Placeholder caption for the Transparency frame.",
  },
  Conclusion: {
    title: "Graphic title — Conclusion",
    caption: "Placeholder caption for the Conclusion frame.",
  },
} as const

const LOAD_MAP_VISUALS = true
const TITLE_BAND_COLOR = "#6b4f8a"

// ============================================================================
// Constants
// ============================================================================

export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0],
  [-95.0, 55.0],
]

export const CALIFORNIA_BOUNDS: [[number, number], [number, number]] = [
  [-124.5, 32.5],
  [-114.0, 42.0],
]

interface MapInstanceProps {
  mapboxToken?: string
  children?: ReactNode
}

export default function MapInstance({
  mapboxToken,
  children,
}: MapInstanceProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const cameraView = useCameraView()
  const activeSection = useActiveSectionStore()
  const conclusionProgress = useConclusionProgress()
  const conclusionMapOpacity =
    activeSection === "Conclusion"
      ? 1 - Math.min(1, Math.max(0, (conclusionProgress - 0.48) / 0.16))
      : 1
  const copy =
    activeSection in visualCopy
      ? visualCopy[activeSection as keyof typeof visualCopy]
      : null
  const prevCameraRef = useRef<string | null>(null)

  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    const cameraKey = [
      cameraView.longitude,
      cameraView.latitude,
      cameraView.zoom,
      cameraView.maxZoom ?? "",
      cameraView.bearing ?? 0,
      cameraView.pitch ?? 0,
      cameraView.bounds?.flat().join(",") ?? "",
      cameraView.boundsPadding
        ? Object.values(cameraView.boundsPadding).join(",")
        : "",
    ].join(":")

    if (prevCameraRef.current === cameraKey) return

    prevCameraRef.current = cameraKey

    if (cameraView.bounds) {
      map.mapRef.current.fitBounds(cameraView.bounds, {
        padding: cameraView.boundsPadding,
        maxZoom: cameraView.maxZoom,
        bearing: cameraView.bearing ?? 0,
        pitch: cameraView.pitch ?? 0,
        duration: 1500,
        easing: (t: number) => t * (2 - t),
      })
      return
    }

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 1500,
      easing: (t: number) => t * (2 - t),
    })
  }, [cameraView, map])

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "45dvw",
        height: "100dvh",
        zIndex: 0,
        pointerEvents: "auto",
        display: "grid",
        gridTemplateRows: "15dvh 85dvh",
      }}
    >
      <Box
        component="header"
        sx={{
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          px: { md: 2, lg: 4.5, xl: 5 },
          pb: 2,
          color: "common.white",
          backgroundColor: TITLE_BAND_COLOR,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {copy ? (
          <>
            <Typography component="h2" variant="h6">
              {copy.title}
            </Typography>
            <Typography
              component="p"
              variant="caption"
              sx={{
                mt: 0.5,
                color: "rgba(242, 240, 239, 0.7)",
              }}
            >
              {copy.caption}
            </Typography>
          </>
        ) : null}
      </Box>
      <Box
        component={motion.div}
        animate={{ opacity: conclusionMapOpacity }}
        transition={{ duration: 0.08, ease: "linear" }}
        sx={{
          position: "relative",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {LOAD_MAP_VISUALS ? (
          <Map
            mapboxToken={token}
            mapStyle={"mapbox://styles/coeqwal/cmsizk292001101sr3mby7byk"}
            initialViewState={CALIFORNIA_VIEW}
            maxBounds={MAP_BOUNDS}
            style={{ width: "100%", height: "100%" }}
            interactive={false}
            navigationControl={false}
            dragPan={false}
          >
            {children}
          </Map>
        ) : null}
      </Box>
    </Box>
  )
}
