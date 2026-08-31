"use client"

import { ReactNode, useEffect, useRef } from "react"
import { Box } from "@repo/ui/mui"
import { motion } from "@repo/motion"
import { Map, useMap } from "@repo/map"
import "./mapboxControlStyles.css"
import {
  useActiveSectionStore,
  useCameraView,
  useConclusionProgress,
} from "../../../store"
import { CALIFORNIA_VIEW } from "../config/cameraPresets"

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
  const prevCameraRef = useRef<string | null>(null)

  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    const cameraKey = [
      cameraView.longitude,
      cameraView.latitude,
      cameraView.zoom,
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
        width: "35%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "auto",
        backgroundColor: "#172a48",
      }}
    >
      <Box
        component={motion.div}
        animate={{ opacity: conclusionMapOpacity }}
        transition={{ duration: 0.08, ease: "linear" }}
        sx={{ position: "absolute", inset: 0 }}
      >
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
      </Box>
    </Box>
  )
}
