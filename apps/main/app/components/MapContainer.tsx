"use client"

import { useEffect, useRef } from "react"
import Map, { useMap } from "@repo/map" // 👈 default + named import
import type { MapboxMapRef, ViewState } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { useMapState, mapActions } from "@repo/state/map"

interface MapContainerProps {
  uncontrolledRef?: React.RefObject<MapboxMapRef>
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const mapState = useMapState()
  const initialized = useRef(false)

  // 🟢 Render log
  console.log("📦 MapContainer rendered")

  // ✅ Register mapRef and sync uncontrolledRef
  useEffect(() => {
    console.log("🚀 MapContainer useEffect running")

    const ref = mapRef?.current
    if (!ref) {
      console.warn("❌ mapRef.current is null in MapContainer")
      return
    }

    if (uncontrolledRef) {
      uncontrolledRef.current = ref
      console.log("🔗 uncontrolledRef assigned")
    }

    if (!initialized.current) {
      mapActions.registerMapInstance(ref)
      initialized.current = true
      console.log("📌 map instance registered with mapActions")
    }

    const interval = setInterval(() => {
      console.log("🕵️ Polling mapRef:", mapRef.current)
    }, 3000)

    return () => clearInterval(interval)
  }, [mapRef, uncontrolledRef])

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        pointerEvents: "auto",
      }}
    >
      <Map
        mapboxToken={mapboxToken}
        viewState={mapState.viewState}
        initialViewState={mapState.viewState}
        onMoveEnd={(evt: { viewState: ViewState }) => {
          mapState.onViewStateChange({
            ...evt.viewState,
            bearing: evt.viewState.bearing ?? 0,
            pitch: evt.viewState.pitch ?? 0,
          })
        }}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        scrollZoom={false}
        interactive
        dragPan
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
}