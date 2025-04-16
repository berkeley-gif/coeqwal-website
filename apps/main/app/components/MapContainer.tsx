"use client"

import React, { useEffect } from "react"
import { Map } from "@repo/map"
import { useMap } from "@repo/map"
import type { MutableRefObject } from "react" // MutableRefObject is not deprecated
import type { MapboxMapRef, ViewState } from "@repo/map"
import { Box } from "@repo/ui/mui"

interface MapContainerProps {
  // For the uncontrolled mode
  uncontrolledRef?: MutableRefObject<MapboxMapRef | null>

  // For the controlled mode
  viewState?: ViewState
  onViewStateChange?: (newViewState: ViewState) => void
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

  const { mapRef } = useMap()

  // We'll use the context mapRef since we can't directly forward external refs to the Map component
  const refToUse = mapRef

  // Test button with context mapRef
  // const testFlyTo = useCallback(() => {
  //   if (refToUse.current) {
  //     refToUse.current.flyTo(-121.5, 38.05, 10)
  //   }

  //   // Also update the uncontrolled ref if provided
  //   if (uncontrolledRef && refToUse.current) {
  //     uncontrolledRef.current = refToUse.current
  //   }
  // }, [refToUse, uncontrolledRef])

  // After Map is mounted, set the uncontrolledRef to point to the same Map instance
  useEffect(() => {
    if (uncontrolledRef && refToUse.current) {
      uncontrolledRef.current = refToUse.current
    }
  }, [uncontrolledRef, refToUse])

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
        initialViewState={{
          longitude: -126.037,
          latitude: 37.962,
          zoom: 5.83,
          bearing: 0,
          pitch: 0,
        }}
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        scrollZoom={false}
        interactive={true}
        dragPan={true}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  )
}
