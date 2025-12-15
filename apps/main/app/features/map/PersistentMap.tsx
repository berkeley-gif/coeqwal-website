"use client"

/**
 * PersistentMap
 *
 * A single, persistent Mapbox instance that lives outside the tab system.
 * This component renders ONCE at the page level and never unmounts, regardless
 * of tab switches. It positions and configures itself based on `mapMode` from
 * the store.
 *
 * Architecture:
 * - Renders immediately (preloading during IntroSection scroll)
 * - Positions itself via CSS based on which tab is active
 * - Renders appropriate layers based on mode (Learn vs Explore)
 * - Tabs call `learnMapActions.setMapMode()` to configure the map
 *
 * Performance benefits:
 * - Single WebGL context (no GPU memory duplication)
 * - No re-initialization when switching tabs
 * - Tiles stay cached across tab switches
 */

import { useEffect, useRef, useState, useMemo } from "react"
import { Map, NavigationControl, Marker, Popup, useMap, GeolocateControl } from "@repo/map"
import { Box, Typography, useTheme } from "@repo/ui/mui"

// Learn layers
import BasinsLayer from "./layers/BasinsLayer"
import RiversLayer from "./layers/RiversLayer"
import BasinInflowArrows from "./layers/BasinInflowArrows"

// Explore components
import TierMarkers from "../scenarioExplorer/components/TierMarkers"

// API
import {
  fetchTierLocationData,
  type TierLocationResponse,
} from "../../lib/api/tierLocationApi"

// Hooks
import {
  useOutcomeMapLayer,
  outcomeUsesPolygons,
} from "./hooks/useOutcomeMapLayer"
import { useMapLayers } from "./hooks/useMapLayers"

// Explore hooks
import { useTierMapData } from "../scenarioExplorer/hooks/useTierMapData"

// Store
import {
  useMapMode,
  useActiveSection,
  useGeocoderMarker,
  useRiversProgress,
  useDerivedArrowsOpacity,
  useShowBasins,
  useShowRivers,
  useShowArrows,
  useCameraView,
  useSelectedOutcome,
  useExploreTierSelection,
  useLearnMapScrollOffset,
  learnMapActions,
  CALIFORNIA_VIEW,
  type SectionId,
  type MapMode,
} from "./store"

import "./MapboxControlStyles.css"

// Map bounds (California region)
const MAP_BOUNDS: [[number, number], [number, number]] = [
  [-145.0, 20.0], // Southwest
  [-95.0, 55.0], // Northeast
]

// California geographic bounds for Explore mode centering
const CALIFORNIA_BOUNDS: [[number, number], [number, number]] = [
  [-124.5, 32.5], // Southwest (lon, lat)
  [-114.0, 42.0], // Northeast (lon, lat)
]

// Position styles for different modes
// zIndexBasement comes from theme.zIndex.basement
// scrollOffset creates the "release from sticky" effect in Learn mode
const getContainerStyles = (
  mode: MapMode,
  zIndexBasement: number,
  scrollOffset: number = 0,
): React.CSSProperties => {
  const base: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: zIndexBasement, // Use theme z-index for map background layer
    transition: "opacity 0.3s ease-out",
  }

  switch (mode) {
    case "hidden":
      return {
        ...base,
        opacity: 0,
        pointerEvents: "none",
      }
    case "learn":
      return {
        ...base,
        opacity: 1,
        pointerEvents: "auto",
        // Apply scroll offset to "release" the map from being fixed
        // This makes the map scroll up with content when offset > 0
        // Short transition smooths the initial "release" moment
        transform: scrollOffset > 0 ? `translateY(-${scrollOffset}px)` : undefined,
        transition: "opacity 0.3s ease-out, transform 0.15s ease-out",
      }
    case "explore":
      return {
        ...base,
        opacity: 1,
        pointerEvents: "auto",
      }
    default:
      return base
  }
}

interface PersistentMapProps {
  mapboxToken?: string
}

export default function PersistentMap({ mapboxToken }: PersistentMapProps) {
  const token = mapboxToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const map = useMap()
  const theme = useTheme()
  const onMapReadyCalledRef = useRef(false)

  // Store state
  const mapMode = useMapMode()


  // Learn-specific state
  const activeSection = useActiveSection()
  const geocoderMarker = useGeocoderMarker()
  const riversProgress = useRiversProgress()
  const arrowsOpacity = useDerivedArrowsOpacity()
  const showBasins = useShowBasins()
  const showRivers = useShowRivers()
  const showArrows = useShowArrows()
  const cameraView = useCameraView()
  const selectedOutcome = useSelectedOutcome()

  // Explore-specific state
  const exploreTierSelection = useExploreTierSelection()

  // Scroll offset for "release from sticky" effect in Learn mode
  const learnMapScrollOffset = useLearnMapScrollOffset()

  // Check if Learn outcome uses polygon visualization
  const learnUsesPolygons = selectedOutcome
    ? outcomeUsesPolygons(selectedOutcome)
    : false

  // Check if Explore outcome uses polygon visualization
  const exploreUsesPolygons = exploreTierSelection?.outcome
    ? outcomeUsesPolygons(exploreTierSelection.outcome)
    : false

  // Use polygon layer for Learn mode (CWS, AG_REV, etc.)
  const { hoveredFeature: learnHoveredFeature } = useOutcomeMapLayer({
    outcome: learnUsesPolygons ? selectedOutcome : null,
    strategy: "current-ops",
    visible: mapMode === "learn" && learnUsesPolygons && !!selectedOutcome,
  })

  // Use polygon layer for Explore mode (CWS, AG_REV, etc.)
  // skipCameraControl: let useTierMapData handle zoom instead of this hook
  const { hoveredFeature: exploreHoveredFeature } = useOutcomeMapLayer({
    outcome: exploreUsesPolygons ? exploreTierSelection?.outcome ?? null : null,
    strategy: exploreTierSelection?.strategy ?? "current-ops",
    visible: mapMode === "explore" && exploreUsesPolygons && !!exploreTierSelection,
    skipCameraControl: true,
  })

  // Explore mode: fetch tier data based on selection
  const { tierData: exploreTierData } = useTierMapData({
    selectedTier: mapMode === "explore" ? exploreTierSelection : null,
  })

  // Tier location data for outcomes that DON'T use polygons
  const [tierData, setTierData] = useState<TierLocationResponse | null>(null)
  const [, setTierDataLoading] = useState(false)

  // Fetch tier location data when in Learn mode and outcome selected (non-polygon outcomes only)
  useEffect(() => {
    if (mapMode !== "learn" || !selectedOutcome || learnUsesPolygons) {
      setTierData(null)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setTierDataLoading(true)
        const data = await fetchTierLocationData("current-ops", selectedOutcome!)

        if (!cancelled) {
          setTierData(data)

          // Zoom to show all markers if there are features
          if (data.features.length > 0 && map.mapRef?.current) {
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
    return () => { cancelled = true }
  }, [selectedOutcome, learnUsesPolygons, map, mapMode])

  // Apply Mapbox layer states based on activeSection (Learn mode only)
  useMapLayers()

  // Mapbox layer IDs that we need to preload
  const MAPBOX_LAYER_IDS = useMemo(() => [
    "california-label",
    "central-valley-polygon",
    "central-valley-polygon-halo",
    "central-valley-label",
    "inflow-watersheds",
  ], [])

  // Initialize map and notify when ready
  useEffect(() => {
    if (onMapReadyCalledRef.current) return

    const preloadAndNotify = (mapboxInstance: mapboxgl.Map) => {
      if (onMapReadyCalledRef.current) return
      onMapReadyCalledRef.current = true

      // Hide all layers initially (prevent flash)
      MAPBOX_LAYER_IDS.forEach((layerId) => {
        try {
          if (mapboxInstance.getLayer(layerId)) {
            mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
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

      // Trigger tile loading by briefly making layers visible
      MAPBOX_LAYER_IDS.forEach((layerId) => {
        try {
          if (mapboxInstance.getLayer(layerId)) {
            mapboxInstance.setLayoutProperty(layerId, "visibility", "visible")
          }
        } catch {
          // Layer might not exist
        }
      })

      // Wait for idle (tiles loaded) then hide layers again
      const onIdle = () => {
        MAPBOX_LAYER_IDS.forEach((layerId) => {
          try {
            if (mapboxInstance.getLayer(layerId)) {
              mapboxInstance.setLayoutProperty(layerId, "visibility", "none")
            }
          } catch {
            // Ignore
          }
        })

        // Now we're truly ready
        learnMapActions.setMapReady(true)
      }

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

    // Poll until ready
    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval)
      }
    }, 100)

    // Also listen for style.load event
    const mapboxInstance = map.mapRef?.current?.getMap?.()
    if (mapboxInstance) {
      mapboxInstance.once("style.load", checkReady)
    }

    return () => {
      clearInterval(interval)
    }
  }, [map.mapRef, MAPBOX_LAYER_IDS])

  // Track previous section for camera transitions
  const prevSectionRef = useRef<SectionId | null>(null)

  // Camera transitions when section changes (Learn mode)
  useEffect(() => {
    // Reset prevSectionRef when leaving Learn mode so camera transition fires on return
    if (mapMode !== "learn") {
      prevSectionRef.current = null
      return
    }
    if (!map.mapRef?.current || !cameraView) return
    if (prevSectionRef.current === activeSection) return

    prevSectionRef.current = activeSection

    // Include padding reset in easeTo to animate both together (smooth transition from Explore)
    map.mapRef.current.easeTo({
      center: [cameraView.longitude, cameraView.latitude],
      zoom: cameraView.zoom,
      bearing: cameraView.bearing ?? 0,
      pitch: cameraView.pitch ?? 0,
      padding: { left: 0, top: 0, right: 0, bottom: 0 },
      duration: 2000,
      easing: (t: number) => t * (2 - t), // ease-out-quad
    })
  }, [activeSection, cameraView, map, mapMode])

  // Reset camera when switching to Explore mode
  useEffect(() => {
    if (mapMode !== "explore") return
    if (!map.mapRef?.current) return

    // Calculate left padding = 50% of viewport width (the left panel)
    const leftPadding = window.innerWidth / 2

    // Fit California bounds into the visible right half
    // top: 300 = 230px interface chrome + 70px visual offset
    map.mapRef.current.fitBounds(CALIFORNIA_BOUNDS, {
      padding: { left: leftPadding, top: 300, right: 0, bottom: 20 },
      maxZoom: 6,
      duration: 1000,
    })
  }, [mapMode, map])

  // Hide native Mapbox layers when switching to Explore mode
  useEffect(() => {
    if (mapMode !== "explore") return
    if (!map.mapRef?.current) return

    const mapInstance = map.mapRef.current.getMap()

    // Hide all Learn mode native layers
    const layersToHide = [
      "california-label",
      "central-valley-polygon",
      "central-valley-polygon-halo",
      "central-valley-label",
      "inflow-watersheds",
    ]

    layersToHide.forEach((layerId) => {
      try {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.setLayoutProperty(layerId, "visibility", "none")
        }
      } catch {
        /* ignore */
      }
    })
  }, [mapMode, map])

  // Re-center on resize while in Explore mode
  useEffect(() => {
    if (mapMode !== "explore") return
    if (!map.mapRef?.current) return

    const handleResize = () => {
      const leftPadding = window.innerWidth / 2
      map.mapRef.current?.fitBounds(CALIFORNIA_BOUNDS, {
        padding: { left: leftPadding, top: 300, right: 0, bottom: 20 },
        maxZoom: 6,
        duration: 300,
      })
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [mapMode, map])

  // NOTE: Learn mode camera is handled by "Camera transitions when section changes" effect
  // which fires when resetLearnState() sets activeSection to "california"

  // Clear visualizations when map is hidden (tab change)
  useEffect(() => {
    if (mapMode === "hidden") {
      learnMapActions.setSelectedOutcome(null)
      learnMapActions.setExploreTierSelection(null)
    }
  }, [mapMode])

  const containerStyles = getContainerStyles(
    mapMode,
    theme.zIndex.basement,
    mapMode === "learn" ? learnMapScrollOffset : 0,
  )

  // Determine if we should show Learn or Explore layers
  const isLearnMode = mapMode === "learn"
  const isExploreMode = mapMode === "explore"

  return (
    <>
      {/* Teal backdrop for Learn mode - sits behind the map, revealed when map scrolls away */}
      {isLearnMode && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: theme.palette.learn.background,
            zIndex: theme.zIndex.basement - 1, // Behind the map
            opacity: learnMapScrollOffset > 0 ? 1 : 0,
            transition: "opacity 0.15s ease-out",
            pointerEvents: "none",
          }}
        />
      )}
      <Box
        id="persistent-map"
        sx={{
          ...containerStyles,
          "& .mapboxgl-ctrl-bottom-left": isExploreMode
            ? { bottom: "80px" }
            : undefined,
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
        interactive={true}  // Always interactive - visibility controlled by CSS pointerEvents
        projection={{ name: "globe" }}
      >
        <NavigationControl position="bottom-left" />
        {isExploreMode && <GeolocateControl position="bottom-left" />}

        {/* Learn mode layers */}
        {isLearnMode && (
          <>
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

            {/* Tier markers for Learn mode outcomes (non-polygon outcomes only) */}
            {tierData && !learnUsesPolygons && <TierMarkers data={tierData} />}

            {/* Hover tooltip for Learn mode polygon features */}
            {learnHoveredFeature && (
              <Popup
                longitude={learnHoveredFeature.longitude}
                latitude={learnHoveredFeature.latitude}
                anchor="bottom"
                closeButton={false}
                closeOnClick={false}
                offset={15}
              >
                <Box sx={{ p: 1.5, minWidth: 200, maxWidth: 300 }}>
                  {(() => {
                    const isUrban = learnHoveredFeature.classType === "Urban"
                    const primaryName =
                      isUrban && learnHoveredFeature.urbName
                        ? learnHoveredFeature.urbName
                        : learnHoveredFeature.modName
                    const secondaryName =
                      isUrban && learnHoveredFeature.urbName && learnHoveredFeature.modName
                        ? learnHoveredFeature.modName
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

                  {learnHoveredFeature.subName && (
                    <Typography
                      variant="body2"
                      sx={{ color: theme.palette.grey[600], mb: 0.5 }}
                    >
                      {learnHoveredFeature.subName}
                    </Typography>
                  )}

                  {learnHoveredFeature.comments && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.grey[600],
                        display: "block",
                        mb: 0.5,
                        lineHeight: 1.3,
                      }}
                    >
                      {learnHoveredFeature.comments}
                    </Typography>
                  )}

                  {learnHoveredFeature.type && (
                    <Typography
                      variant="caption"
                      sx={{
                        color: theme.palette.grey[600],
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {learnHoveredFeature.type}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.grey[500],
                      display: "block",
                      mb: 1,
                    }}
                  >
                    CalSim ID: {learnHoveredFeature.duId}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "2px",
                        backgroundColor:
                          theme.palette.tiers[
                            `tier${learnHoveredFeature.tierLevel}` as keyof typeof theme.palette.tiers
                          ],
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                      <strong>Tier {learnHoveredFeature.tierLevel}:</strong>{" "}
                      {learnHoveredFeature.tierLabel}
                    </Typography>
                  </Box>
                </Box>
              </Popup>
            )}
          </>
        )}

        {/* Explore mode layers */}
        {/* Only show TierMarkers when NOT using polygon visualization */}
        {isExploreMode && exploreTierData && exploreTierData.features.length > 0 && !exploreUsesPolygons && (
          <TierMarkers data={exploreTierData} />
        )}

        {/* Hover tooltip for Explore mode polygon features */}
        {isExploreMode && exploreHoveredFeature && (
          <Popup
            longitude={exploreHoveredFeature.longitude}
            latitude={exploreHoveredFeature.latitude}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={15}
          >
            <Box sx={{ p: 1.5, minWidth: 200, maxWidth: 300 }}>
              {(() => {
                const isUrban = exploreHoveredFeature.classType === "Urban"
                const primaryName =
                  isUrban && exploreHoveredFeature.urbName
                    ? exploreHoveredFeature.urbName
                    : exploreHoveredFeature.modName
                const secondaryName =
                  isUrban && exploreHoveredFeature.urbName && exploreHoveredFeature.modName
                    ? exploreHoveredFeature.modName
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

              {exploreHoveredFeature.subName && (
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.grey[600], mb: 0.5 }}
                >
                  {exploreHoveredFeature.subName}
                </Typography>
              )}

              {exploreHoveredFeature.comments && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    display: "block",
                    mb: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {exploreHoveredFeature.comments}
                </Typography>
              )}

              {exploreHoveredFeature.type && (
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.grey[600],
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  {exploreHoveredFeature.type}
                </Typography>
              )}

              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.grey[500],
                  display: "block",
                  mb: 1,
                }}
              >
                CalSim ID: {exploreHoveredFeature.duId}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "2px",
                    backgroundColor:
                      theme.palette.tiers[
                        `tier${exploreHoveredFeature.tierLevel}` as keyof typeof theme.palette.tiers
                      ],
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                  <strong>Tier {exploreHoveredFeature.tierLevel}:</strong>{" "}
                  {exploreHoveredFeature.tierLabel}
                </Typography>
              </Box>
            </Box>
          </Popup>
        )}
      </Map>
    </Box>
    </>
  )
}
