"use client"

import { useEffect, useRef } from "react"
import { Map, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import useStoryStore from "../store"

const INITIAL_VIEW_STATE = {
  longitude: -119.5,
  latitude: 37.5,
  zoom: 5.5,
  pitch: 0,
  bearing: 0,
}

export default function MapContainer() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const setMapReady = useStoryStore((state) => state.setMapReady)
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const checkMapRef = () => {
      const ref = mapRef?.current
      if (!ref) {
        setTimeout(checkMapRef, 500)
        return
      }
      if (!initialized.current) {
        initialized.current = true
      }
    }

    checkMapRef()
  }, [mapRef])

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/coeqwal/cmc0zhlcr008p01sof4ob61vg"
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={() => setMapReady(true)}
      />
    </Box>
  )
}
