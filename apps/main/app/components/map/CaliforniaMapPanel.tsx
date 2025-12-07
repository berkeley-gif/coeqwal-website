"use client"

/**
 * CaliforniaMapPanel
 *
 * Uses Zustand store for state and derived layer visibility.
 * Layer visibility is determined by activeSection
 */

import { useEffect, useRef, useState } from "react"
import { Map, NavigationControl, Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import BasinsLayer from "./layers/BasinsLayer"
import RiversLayer from "./layers/RiversLayer"
import BasinInflowArrows from "./layers/BasinInflowArrows"
import TierMarkers from "../../features/scenarioExplorer/components/TierMarkers"
import { fetchTierLocationData, type TierLocationResponse } from "../../api/tierLocationApi"
import {
  useActiveSection,
  useGeocoderMarker,
  useRiversProgress,
  useDerivedArrowsOpacity,
  useShowBasins,
  useShowRivers,
  useShowArrows,
  useCameraView,
  useSelectedOutcome,
  CALIFORNIA_VIEW,
  type SectionId,
} from "./store"
import { useMapLayers } from "./hooks/useMapLayers"
import "./MapboxControlStyles.css"

// Map bounds
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0], // Southwest
  [-95.0, 55.0], // Northeast
]

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()

  // Store selectors
  const activeSection = useActiveSection()
  const geocoderMarker = useGeocoderMarker()
  const riversProgress = useRiversProgress()
  const arrowsOpacity = useDerivedArrowsOpacity() // Use derived opacity (1 when visible, 0 when not)
  const showBasins = useShowBasins()
  const showRivers = useShowRivers()
  const showArrows = useShowArrows()
  const cameraView = useCameraView()
  const selectedOutcome = useSelectedOutcome()

  // Tier location data for map visualization
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)
  const [tierDataLoading, setTierDataLoading] = useState(false)

  // Fetch tier location data when selectedOutcome changes
  useEffect(() => {
    if (!selectedOutcome) {
      setTierData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setTierDataLoading(true)
        // Use "current-ops" strategy for the Learn section
        const data = await fetchTierLocationData("current-ops", selectedOutcome!)
        
        if (!cancelled) {
          setTierData(data)
          
          // Zoom to show all markers if there are features
          if (data.features.length > 0 && map.mapRef?.current) {
            // Calculate bounds from features
            let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
            
            data.features.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                const [lng, lat] = feature.geometry.coordinates as [number, number]
                minLng = Math.min(minLng, lng)
                minLat = Math.min(minLat, lat)
                maxLng = Math.max(maxLng, lng)
                maxLat = Math.max(maxLat, lat)
              }
            })
            
            if (minLng !== Infinity) {
              map.mapRef.current.fitBounds(
                [[minLng, minLat], [maxLng, maxLat]],
                { padding: 100, maxZoom: 9, duration: 1000 }
              )
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch tier location data:", err)
        if (!cancelled) {
          setTierData(null)
        }
      } finally {
        if (!cancelled) {
          setTierDataLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [selectedOutcome, map])

  // Apply Mapbox layer states based on activeSection
  useMapLayers()

  // Track previous section for camera transitions
  const prevSectionRef = useRef<SectionId | null>(null)

  // Camera transitions when section changes
  useEffect(() => {
    if (!map.mapRef?.current || !cameraView) return
    if (prevSectionRef.current === activeSection) return

    prevSectionRef.current = activeSection

    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      duration: 2000,
      easing: (t: number) => t * (2 - t), // ease-out-quad
    })
  }, [activeSection, cameraView, map])

  return (
    <Box
      id={id}
      sx={{
        position: "sticky",
        top: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "auto",
      }}
    >
      <Map
        mapboxToken={token}
        mapStyle="mapbox://styles/coeqwal/cmh2f40sm000w01qy8m0gaea8"
        initialViewState={CALIFORNIA_VIEW}
        minZoom={4}
        maxZoom={18}
        maxBounds={MAP_BOUNDS}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        touchZoom={true}
        touchRotate={false}
        dragPan={true}
        dragRotate={false}
        doubleClickZoom={true}
        keyboard={true}
        interactive={true}
        projection={{ name: "globe" }}
      >
        <NavigationControl position="bottom-left" />

        {/* React-rendered layers use derived visibility from store */}
        {/* Sacramento/San Joaquin labels fade out during first 30% of river animation */}
        {/* Tulare label stays visible */}
        <BasinsLayer
          visible={showBasins}
          riverBasinLabelsOpacity={
            showRivers ? Math.max(0, 1 - riversProgress / 0.3) : 1
          }
        />
        <RiversLayer visible={showRivers} progress={riversProgress} />
        <BasinInflowArrows visible={showArrows} opacity={arrowsOpacity} />

        {/* Geocoder marker */}
        {geocoderMarker && (
          <Marker
            longitude={geocoderMarker[0]}
            latitude={geocoderMarker[1]}
            anchor="center"
          >
            <Box
              sx={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.5)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                fontSize: "28px",
                lineHeight: 1,
              }}
            >
              📍
            </Box>
          </Marker>
        )}

        {/* Tier markers for selected outcome */}
        {tierData && <TierMarkers data={tierData} />}
      </Map>
    </Box>
  )
}
