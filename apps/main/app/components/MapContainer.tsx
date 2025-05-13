"use client"

// import { useEffect, useRef, useState } from "react"
import { useEffect, useRef } from "react"
// import { Map, useMap, Marker, MapRef } from "@repo/map"
import { Map, useMap, MapRef } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { mapActions } from "@repo/state/map"
// import AnimatedMarker from "./AnimatedMarker"
// import { WATER_FEATURES, filterMarkersByType } from "../utils/markers"
import { useStoryStore } from "@repo/state"

interface MapContainerProps {
  uncontrolledRef?: React.RefObject<MapRef | null>
}

export default function MapContainer({ uncontrolledRef }: MapContainerProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const { mapRef } = useMap()
  // const mapState = useMapStore()
  const initialized = useRef(false)

  // Use utilities to manage markers
  // const [markers] = useState(WATER_FEATURES)
  // const [filterType] = useState<string | null>(null)
  // const [filterType, setFilterType] = useState<string | null>(null) // Uncomment when needed

  // Filter markers if a type is selected
  // const filteredMarkers = filterType
  //   ? filterMarkersByType(markers, filterType)
  //   : markers

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
        mapActions.registerMapInstance(ref)
        initialized.current = true
        console.log("📌 map instance registered with mapActions")
      }
    }

    // Start the check process
    checkMapRef()
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
        initialViewState={{
          longitude: -127.5,
          latitude: 37.962,
          zoom: 5.83,
          bearing: 0,
          pitch: 0,
        }} // Hard-coded to match the animation's first keyframe
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

          // Explicitly trigger an update to uncontrolledRef
          if (uncontrolledRef && !uncontrolledRef.current && mapRef.current) {
            console.log(
              "🔄 Map loaded - updating uncontrolledRef directly in onLoad",
            )
            uncontrolledRef.current = mapRef.current
          }

          // Make absolutely sure the map is in the correct position
          if (mapRef.current) {
            console.log("📍 Ensuring map is in the correct position on load")
            mapRef.current.jumpTo({
              center: [-127.5, 37.962],
              zoom: 5.83,
              bearing: 0,
              pitch: 0,
            })
          }

          // initial view: ensure paragraph background off
          useStoryStore.getState().setOverlay("paragraphShade", false)
        }}
      >
        {/* 
        // Pulsing motion markers temporarily disabled
        // Uncomment to re-enable
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
        */}
      </Map>
    </Box>
  )
}
