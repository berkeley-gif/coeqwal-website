"use client"

import { useEffect, useRef, useState } from "react"
import { Map, useMap, Marker, MapRef } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { useMapStore, mapActions } from "@repo/state/map"
import AnimatedMarker from "./AnimatedMarker"
import { WATER_FEATURES, filterMarkersByType } from "../utils/markers"
import { useStoryStore } from "@repo/state"

interface MapContainerProps {
  uncontrolledRef?: React.RefObject<MapRef | null>
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  const mapState = useMapStore()
  const initialized = useRef(false)

  // Use utilities to manage markers
  const [markers] = useState(WATER_FEATURES)
  const [filterType] = useState<string | null>(null)
  // const [filterType, setFilterType] = useState<string | null>(null) // Uncomment when needed

  // Filter markers if a type is selected
  const filteredMarkers = filterType
    ? filterMarkersByType(markers, filterType)
    : markers

  // ✅ Register mapRef and sync uncontrolledRef
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return

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
  }, [mapRef, uncontrolledRef])

  // Example of how to add markers programmatically
  // const addCustomMarker = () => {
  //   const newMarker = {
  //     id: `custom-${Date.now()}`,
  //     longitude: -119.5 + (Math.random() * 2 - 1),
  //     latitude: 38.5 + (Math.random() * 2 - 1),
  //     color: "#FF9800",
  //     title: "Custom Marker",
  //     properties: { type: "custom" },
  //   }

  //   setMarkers((prev) => [...prev, newMarker])
  // }

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
        initialViewState={mapState.viewState} // uncontrolled
        mapStyle="mapbox://styles/digijill/cl122pj52001415qofin7bb1c"
        scrollZoom={false}
        interactive
        dragPan
        style={{ width: "100%", height: "100%" }}
        onLoad={() => {
          const map = mapRef.current?.getMap()
          if (map && map.getLayer("snowfall")) {
            map.setPaintProperty("snowfall", "raster-opacity", 0)
            map.setPaintProperty("snowfall", "raster-opacity-transition", {
              duration: 0,
              delay: 0,
            })
          }
          // initial view: ensure paragraph background off
          useStoryStore.getState().setOverlay("paragraphShade", false)
        }}
      >
        {/* Standard markers rendered using our utility & AnimatedMarker */}
        {filteredMarkers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
          >
            <AnimatedMarker
              id={marker.id}
              color={marker.color}
              size={24}
              onClick={() => {
                console.log(`Clicked marker ${marker.id}: ${marker.title}`)

                // Example of flying to marker on click
                mapRef.current?.flyTo({
                  center: [marker.longitude, marker.latitude],
                  zoom: 10,
                  duration: 2000,
                })
              }}
            />
          </Marker>
        ))}
      </Map>
    </Box>
  )
}
