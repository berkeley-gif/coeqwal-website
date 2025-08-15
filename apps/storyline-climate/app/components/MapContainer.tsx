"use client"

import { useEffect, useRef } from "react"
import { Map, useMap, MapRef } from "@repo/map"
import { Box } from "@repo/ui/mui"

interface MapContainerProps {
  onLoad?: () => void
  uncontrolledRef?: React.RefObject<MapRef | null>
}

export default function MapContainer({
  uncontrolledRef,
  onLoad,
}: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const initialized = useRef(false)
  const resourceLoaded = useRef(false)

  useEffect(() => {
    if (!resourceLoaded.current) {
      //loadResources()
      console.log("📦 Resource loaded, setting map ready state")
      resourceLoaded.current = true
    }
    console.log("📌 MapContainer useEffect running for activeSection:")
    //updateMapLayer(activeSection)
    //updateMapViewState(activeSection)
    //updateMapAnnotations(activeSection)
  }, [resourceLoaded])

  // ✅ Register mapRef and sync uncontrolledRef
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

    console.log("🚀 MapContainer useEffect running")

    // Wait for mapRef to be initialized
    const checkMapRef = () => {
      const ref = mapRef?.current
      if (!ref) {
        console.warn(
          "❌ mapRef.current is null in MapContainer, will retry in 500ms",
        )
        setTimeout(checkMapRef, 500)
        return
      }

      console.log("✅ mapRef.current initialized in MapContainer")

      if (uncontrolledRef) {
        uncontrolledRef.current = ref
        console.log(
          "🔗 uncontrolledRef assigned successfully",
          ref ? "with valid map" : "but map is null",
        )
      }

      if (!initialized.current) {
        initialized.current = true
        console.log("📌 map instance registered with mapActions")
      }
    }

    // Start the check process
    checkMapRef()
  }, [mapRef, uncontrolledRef])

  return (
    <Box sx={{ width: "100%", height: "100vh" }}>
      <Map
        mapboxToken={mapboxToken}
        mapStyle="mapbox://styles/coeqwal/cmc0zhlcr008p01sof4ob61vg"
        //initialViewState={mapViewState}
        style={{ width: "100%", height: "100%" }}
        interactive={false}
        navigationControl={false}
        dragPan={false}
        onLoad={onLoad}
      ></Map>
    </Box>
  )
}
