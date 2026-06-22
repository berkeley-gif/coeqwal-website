"use client"

import { ReactNode, useEffect, useRef } from "react"
import { Box } from "@repo/ui/mui"
import { Map, useMap } from "@repo/map"
import "./mapboxControlStyles.css"
import { useActiveSectionStore, useCameraView } from "../../../store"
import { CALIFORNIA_VIEW } from "../config/cameraPresets"
import type { SectionId } from "../config/sectionConfig"

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

const EMPTY_MAP_STYLE = {
  version: 8,
  name: "empty map",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#172a48",
      },
    },
  ],
} as const


interface MapInstanceProps {
  mapboxToken?: string
  children?: ReactNode
}

export default function MapInstance({ mapboxToken, children }: MapInstanceProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const activeSection = useActiveSectionStore()
  const cameraView = useCameraView()
  const prevSectionRef = useRef<SectionId | null>(null)

  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    if (prevSectionRef.current === activeSection) return

    prevSectionRef.current = activeSection
    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 1500,
      easing: (t: number) => t * (2 - t),
    })
  }, [activeSection, cameraView, map])

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
      <Map
        mapboxToken={token}
        mapStyle={"mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"}
        //mapStyle={EMPTY_MAP_STYLE as unknown as string} //
        initialViewState={CALIFORNIA_VIEW}
        maxBounds={MAP_BOUNDS}
        style={{ width: "100%", height: "100%" }}
        interactive={true}
        navigationControl={true}
        dragPan={true}
      >
        {children}
      </Map>
    </Box>
  )
}
