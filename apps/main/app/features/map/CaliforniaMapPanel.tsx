"use client"

/**
 * CaliforniaMapPanel
 *
 * Uses Zustand store for state and derived layer visibility.
 * Layer visibility is determined by activeSection
 */

import { useEffect, useRef, useState } from "react"
import { Map, NavigationControl, Marker, Popup, useMap } from "@repo/map"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import BasinsLayer from "./layers/BasinsLayer"
import RiversLayer from "./layers/RiversLayer"
import BasinInflowArrows from "./layers/BasinInflowArrows"
import TierMarkers from "../scenarioExplorer/components/TierMarkers"
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../lib/api/tierLocationApi"
import {
  useOutcomeMapLayer,
  outcomeUsesPolygons,
} from "./hooks/useOutcomeMapLayer"
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
  type MapMode,
} from "./store"
import { useMapLayers } from "./hooks/useMapLayers"
import "./MapboxControlStyles.css"

// Map bounds
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0], // Southwest
  [-95.0, 55.0], // Northeast
]

// Mapbox layer IDs that we need to preload
const MAPBOX_LAYER_IDS = [
  "california-label",
  "central-valley-polygon",
  "central-valley-polygon-halo",
  "central-valley-label",
  "inflow-watersheds",
]

interface CaliforniaMapPanelProps {
  id?: string
  mapboxToken?: string
  /** Called when the map style has loaded and is ready for interaction */
  onMapReady?: () => void
}

export default function CaliforniaMapPanel({
  id = "california-map",
  mapboxToken,
  onMapReady,
}: CaliforniaMapPanelProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const theme = useTheme()
  const onMapReadyCalledRef = useRef(false)

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

  // Check if outcome uses polygon visualization (CWS, AG_REV, etc.)
  const usesPolygons = selectedOutcome
    ? outcomeUsesPolygons(selectedOutcome)
    : false

  // Use polygon layer for CWS, AG_REV, etc.
  // This standalone component always operates in "learn" mode
  const mapMode: MapMode = "learn"
  const { hoveredFeature } = useOutcomeMapLayer({
    learnOutcome: usesPolygons ? selectedOutcome : null,
    learnStrategy: "current-ops",
    exploreOutcome: null,
    exploreStrategy: "current-ops",
    mapMode,
  })

  // Tier location data for other outcomes (point/polygon based from API)
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)
  const [, setTierDataLoading] = useState(false)

  // Fetch tier location data for outcomes that DON'T use polygons
  useEffect(() => {
    // Clear if no outcome or if using polygon layer
    if (!selectedOutcome || usesPolygons) {
      setTierData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setTierDataLoading(true)
        // Use "current-ops" strategy for the Learn section
        const data = await fetchTierLocationData(
          "current-ops",
          selectedOutcome!,
        )

        if (!cancelled) {
          setTierData(data)

          // Zoom to show all markers if there are features
          if (data.features.length > 0 && map.mapRef?.current) {
            // Calculate bounds from features
            let minLng = Infinity,
              minLat = Infinity,
              maxLng = -Infinity,
              maxLat = -Infinity

            data.features.forEach((feature) => {
              if (feature.geometry.type === "Point") {
                const [lng, lat] = feature.geometry.coordinates as [
                  number,
                  number,
                ]
                minLng = Math.min(minLng, lng)
                minLat = Math.min(minLat, lat)
                maxLng = Math.max(maxLng, lng)
                maxLat = Math.max(maxLat, lat)
              }
            })

            if (minLng !== Infinity) {
              map.mapRef.current.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                { padding: 100, maxZoom: 9, duration: 1000 },
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
  }, [selectedOutcome, usesPolygons, map])

  // Apply Mapbox layer states based on activeSection
  useMapLayers()

  // Notify parent when map is ready
  // Includes preloading of Mapbox layers to ensure tile data is cached
  useEffect(() => {
    if (onMapReadyCalledRef.current) return

    const preloadAndNotify = (mapboxInstance: mapboxgl.Map) => {
      if (onMapReadyCalledRef.current) return
      onMapReadyCalledRef.current = true

      // Step 1: Immediately hide all layers and set opacity to 0
      // This prevents any visual flash from stale layer state
      MAPBOX_LAYER_IDS.forEach((layerId) => {
        try {
          if (mapboxInstance.getLayer(layerId)) {
            mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
            // Also reset opacity to 0 to prevent flash when visibility changes
            const layer = mapboxInstance.getLayer(layerId)
            if (layer?.type === "symbol") {
              mapboxInstance.setPaintProperty(layerId, "text-opacity", 0)
            } else if (layer?.type === "fill") {
              mapboxInstance.setPaintProperty(layerId, "fill-opacity", 0)
            } else if (layer?.type === "line") {
              mapboxInstance.setPaintProperty(layerId, "line-opacity", 0)
            }
          }
        } catch {
          // Layer might not exist
        }
      })

      // Step 2: Trigger tile loading by briefly making layers visible (but with 0 opacity)
      MAPBOX_LAYER_IDS.forEach((layerId) => {
        try {
          if (mapboxInstance.getLayer(layerId)) {
            mapboxInstance.setLayoutProperty(layerId, "visibility", "visible")
          }
        } catch {
          // Layer might not exist
        }
      })

      // Step 3: Wait for idle event (all tiles loaded) or timeout
      const onIdle = () => {
        // Step 4: Hide all layers again (useMapLayers will properly show them)
        MAPBOX_LAYER_IDS.forEach((layerId) => {
          try {
            if (mapboxInstance.getLayer(layerId)) {
              mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
            }
          } catch {
            // Ignore
          }
        })

        // Step 5: Now we're truly ready
        onMapReady?.()
      }

      // Use idle event with timeout fallback
      const timeoutId = setTimeout(() => {
        mapboxInstance.off("idle", onIdle)
        onIdle()
      }, 3000) // 3 second max wait

      mapboxInstance.once("idle", () => {
        clearTimeout(timeoutId)
        onIdle()
      })
    }

    const checkReady = () => {
      if (onMapReadyCalledRef.current) return false

      const mapboxInstance = map.mapRef?.current?.getMap?.()
      if (mapboxInstance && mapboxInstance.isStyleLoaded()) {
        preloadAndNotify(mapboxInstance)
        return true
      }
      return false
    }

    // Check immediately
    if (checkReady()) return

    // Poll until ready (handles race conditions)
    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval)
      }
    }, 100)

    // Also listen for style.load event as backup
    const mapboxInstance = map.mapRef?.current?.getMap?.()
    if (mapboxInstance) {
      mapboxInstance.once("style.load", checkReady)
    }

    return () => {
      clearInterval(interval)
    }
""  }, [map.mapRef, onMapReady])

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

        {/* Tier markers for outcomes that DON'T use polygons */}
        {/* (Polygon outcomes like CWS/AG_REV are handled by useOutcomeMapLayer) */}
        {tierData && !usesPolygons && <TierMarkers data={tierData} />}

        {/* Hover tooltip for polygon layer features */}
        {hoveredFeature && (
          <Popup
            longitude={hoveredFeature.longitude}
            latitude={hoveredFeature.latitude}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={15}
          >
            <Box
              sx={{
                p: 1.5,
                minWidth: 200,
                maxWidth: 300,
              }}
            >
              {/* Primary name - Urb_Name for CWS, Mod_Name for others */}
              {(() => {
                const isUrban = hoveredFeature.classType === "Urban"
                const primaryName =
                  isUrban && hoveredFeature.urbName
                    ? hoveredFeature.urbName
                    : hoveredFeature.modName
                const secondaryName =
                  isUrban && hoveredFeature.urbName && hoveredFeature.modName
                    ? hoveredFeature.modName
                    : null

                return (
                  <>
                    {primaryName && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.blue.darkest,
                          mb: 0.5,
                        }}
                      >
                        {primaryName}
                      </Typography>
                    )}
                    {secondaryName && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.grey[700],
                          mb: 0.5,
                        }}
                      >
                        {secondaryName}
                      </Typography>
                    )}
                  </>
                )
              })()}

              {/* Sub_name */}
              {hoveredFeature.subName && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.grey[600],
                    mb: 0.5,
                  }}
                >
                  {hoveredFeature.subName}
                </Typography>
              )}

              {/* Comments */}
              {hoveredFeature.comments && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    display: "block",
                    mb: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {hoveredFeature.comments}
                </Typography>
              )}

              {/* Type */}
              {hoveredFeature.type && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  {hoveredFeature.type}
                </Typography>
              )}

              {/* CalSim ID */}
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.grey[500],
                  display: "block",
                  mb: 1,
                }}
              >
                CalSim ID: {hoveredFeature.duId}
              </Typography>

              {/* Tier with colored bullet */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "2px",
                    backgroundColor:
                      theme.palette.tiers[
                        `tier${hoveredFeature.tierLevel}` as keyof typeof theme.palette.tiers
                      ],
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  <strong>Tier {hoveredFeature.tierLevel}:</strong>{" "}
                  {hoveredFeature.tierLabel}
                </Typography>
              </Box>
            </Box>
          </Popup>
        )}
      </Map>
    </Box>
  )
}
