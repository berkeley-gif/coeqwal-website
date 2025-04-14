"use client"

import React, { useEffect } from "react"
import { Map, useMap } from "@repo/map"
import type { MapboxMapRef } from "@repo/map"
import { stateMapViewState } from "./helpers/mapViews"

interface MapContainerProps {
  uncontrolledRef?: React.RefObject<MapboxMapRef | null>
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap() // from our context

  const refToUse = mapRef

  useEffect(() => {
    if (uncontrolledRef && refToUse.current) {
      uncontrolledRef.current = refToUse.current
    }
  }, [uncontrolledRef, refToUse])

  return (
    <Map
      mapboxToken={mapboxToken}
      mapStyle="mapbox://styles/yskuo/cm9dhus8h009v01sp2sxn2g6r"
      initialViewState={stateMapViewState}
      style={{ width: "100%", height: "100%" }}
      interactive={false}
      navigationControl={false}
      dragPan={false}
    />
  )
}
