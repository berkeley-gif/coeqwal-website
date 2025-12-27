"use client"

/**
 * HotspotMarkers component
 *
 * Renders markers for tier 4 locations for specific outcomes.
 * Each marker shows an image with a tier-colored label.
 * Supports both Point and Polygon geometries (calculates centroid for polygons). TODO: refine this. Some du's are across multiple disconnected polygons.
 */

import React, { useState, useEffect, useCallback } from "react"
import { Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { useTheme } from "@repo/ui/mui"
import {
  fetchTierLocationData,
  type TierFeature,
} from "../../../../lib/api/tierLocationApi"
import { getDemandUnitNameInfo } from "../../config/demandUnitNames"

// Outcome configurations for hotspots
const HOTSPOT_CONFIGS: Record<
  string,
  {
    image: string
    imageAlt: string
    labelPrefix: string
  }
> = {
  "Community deliveries": {
    image: "/images/map_markers/drinking_water.png",
    imageAlt: "Community water system marker showing water system at risk",
    labelPrefix: "Water system at risk",
  },
  "Salmon abundance": {
    image: "/images/map_markers/salmon.png",
    imageAlt: "Salmon habitat marker showing habitat at risk",
    labelPrefix: "Salmon habitat at risk",
  },
}

interface HotspotMarkersProps {
  /** The outcome to show hotspots for */
  outcome: string | null
  /** Strategy ID for API call */
  strategy?: string
  /** Whether markers are visible */
  visible?: boolean
}

interface HotspotData {
  id: string
  name: string
  longitude: number
  latitude: number
  tier: number
}

/**
 * Calculate the bounding box center of a polygon
 * This is more reliable than centroid for small/irregular polygons
 * For MultiPolygon, calculates bbox across all polygons
 * TODO: Consider better technique for MultiPolygon center calculation
 */
function getPolygonCenter(feature: TierFeature): [number, number] | null {
  const { geometry } = feature

  if (geometry.type === "Point") {
    const coords = geometry.coordinates as number[]
    if (coords.length < 2) return null
    return [coords[0]!, coords[1]!]
  }

  // Collect all coordinates to find bounding box
  const allCoords: number[][] = []

  if (geometry.type === "Polygon") {
    const coords = geometry.coordinates as number[][][]
    coords.forEach((ring) => ring.forEach((pt) => allCoords.push(pt)))
  } else if (geometry.type === "MultiPolygon") {
    const coords = geometry.coordinates as number[][][][]
    coords.forEach((polygon) =>
      polygon.forEach((ring) => ring.forEach((pt) => allCoords.push(pt))),
    )
  } else {
    return null
  }

  if (allCoords.length === 0) return null

  // Calculate bounding box
  let minLng = Infinity,
    maxLng = -Infinity
  let minLat = Infinity,
    maxLat = -Infinity

  for (const point of allCoords) {
    if (point[0] !== undefined && point[1] !== undefined) {
      minLng = Math.min(minLng, point[0])
      maxLng = Math.max(maxLng, point[0])
      minLat = Math.min(minLat, point[1])
      maxLat = Math.max(maxLat, point[1])
    }
  }

  // Return center of bounding box
  const centerLng = (minLng + maxLng) / 2
  const centerLat = (minLat + maxLat) / 2

  return [centerLng, centerLat]
}

export function HotspotMarkers({
  outcome,
  strategy = "current-ops",
  visible = true,
}: HotspotMarkersProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const [hotspots, setHotspots] = useState<HotspotData[]>([])

  // Handle click to zoom to hotspot location
  const handleMarkerClick = useCallback(
    (hotspot: HotspotData) => {
      mapAPI.withMap((mapRef) => {
        const map = mapRef.getMap()
        map.easeTo({
          center: [hotspot.longitude, hotspot.latitude],
          zoom: 9,
          duration: 1000,
        })
      })
    },
    [mapAPI],
  )

  // Get config for this outcome
  const config = outcome ? HOTSPOT_CONFIGS[outcome] : null

  // Fetch tier 4 locations when outcome changes
  useEffect(() => {
    if (!config || !outcome || !visible) {
      setHotspots([])
      return
    }

    const loadHotspots = async () => {
      try {
        const response = await fetchTierLocationData(strategy, outcome)

        // Filter for tier 4 features (Point, Polygon, or MultiPolygon)
        const tier4Features = response.features.filter(
          (f) => f.properties.tier_level === 4,
        )

        // Query Mapbox for enhanced names and coordinates from actual rendered polygons
        // Wait for tiles to load before querying
        const { namesLookup, mapboxCoordsLookup } = await new Promise<{
          namesLookup: Map<
            string,
            { subName?: string; urbName?: string; modName?: string }
          >
          mapboxCoordsLookup: Map<string, [number, number]>
        }>((resolve) => {
          mapAPI.withMap((mapRef) => {
            const map = mapRef.getMap()

            const queryFeatures = () => {
              const names: Map<
                string,
                { subName?: string; urbName?: string; modName?: string }
              > = new Map()
              const coords: Map<string, [number, number]> = new Map()
              const featuresByDuId: Map<
                string,
                Array<{
                  bbox: [number, number, number, number]
                  pointCount: number
                }>
              > = new Map()

              try {
                const features = map.querySourceFeatures("composite", {
                  sourceLayer: "demand_units",
                })

                features.forEach((f) => {
                  const duId = f.properties?.DU_ID
                  if (duId) {
                    // Store all name fields (trimmed, non-empty)
                    const subName = f.properties?.Sub_Name?.trim()
                    const urbName = f.properties?.Urb_Name?.trim()
                    const modName = f.properties?.Mod_Name?.trim()

                    if (!names.has(duId)) {
                      names.set(duId, {})
                    }
                    const nameObj = names.get(duId)!
                    if (subName && subName !== "") nameObj.subName = subName
                    if (urbName && urbName !== "") nameObj.urbName = urbName
                    if (modName && modName !== "") nameObj.modName = modName

                    // Calculate center from Mapbox geometry (more accurate for rendered polygons)
                    if (
                      f.geometry.type === "Polygon" ||
                      f.geometry.type === "MultiPolygon"
                    ) {
                      const allCoords: number[][] = []
                      if (f.geometry.type === "Polygon") {
                        const polyCoords = f.geometry
                          .coordinates as number[][][]
                        polyCoords.forEach((ring) =>
                          ring.forEach((pt) => allCoords.push(pt as number[])),
                        )
                      } else {
                        const multiCoords = f.geometry
                          .coordinates as number[][][][]
                        multiCoords.forEach((polygon) =>
                          polygon.forEach((ring) =>
                            ring.forEach((pt) =>
                              allCoords.push(pt as number[]),
                            ),
                          ),
                        )
                      }
                      if (allCoords.length > 0) {
                        let minLng = Infinity,
                          maxLng = -Infinity
                        let minLat = Infinity,
                          maxLat = -Infinity
                        for (const pt of allCoords) {
                          if (pt[0] !== undefined && pt[1] !== undefined) {
                            minLng = Math.min(minLng, pt[0])
                            maxLng = Math.max(maxLng, pt[0])
                            minLat = Math.min(minLat, pt[1])
                            maxLat = Math.max(maxLat, pt[1])
                          }
                        }

                        // Track this feature's bbox
                        if (!featuresByDuId.has(duId)) {
                          featuresByDuId.set(duId, [])
                        }
                        featuresByDuId.get(duId)!.push({
                          bbox: [minLng, minLat, maxLng, maxLat],
                          pointCount: allCoords.length,
                        })

                        // Merge bounding boxes if we've seen this DU_ID before
                        const existing = coords.get(duId)
                        if (existing) {
                          // Expand the bbox to include both
                          const prevFeatures = featuresByDuId.get(duId)!
                          let mergedMinLng = Infinity,
                            mergedMaxLng = -Infinity
                          let mergedMinLat = Infinity,
                            mergedMaxLat = -Infinity
                          prevFeatures.forEach((pf) => {
                            mergedMinLng = Math.min(mergedMinLng, pf.bbox[0])
                            mergedMinLat = Math.min(mergedMinLat, pf.bbox[1])
                            mergedMaxLng = Math.max(mergedMaxLng, pf.bbox[2])
                            mergedMaxLat = Math.max(mergedMaxLat, pf.bbox[3])
                          })
                          coords.set(duId, [
                            (mergedMinLng + mergedMaxLng) / 2,
                            (mergedMinLat + mergedMaxLat) / 2,
                          ])
                        } else {
                          coords.set(duId, [
                            (minLng + maxLng) / 2,
                            (minLat + maxLat) / 2,
                          ])
                        }
                      }
                    }
                  }
                })
              } catch {
                // Silently handle query errors - will fall back to static mapping
              }

              return { namesLookup: names, mapboxCoordsLookup: coords }
            }

            // If source is already loaded, query immediately
            if (map.isSourceLoaded("composite")) {
              resolve(queryFeatures())
            } else {
              // Wait for source to load, then query
              const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
                if (e.sourceId === "composite" && e.isSourceLoaded) {
                  map.off("sourcedata", onSourceData)
                  resolve(queryFeatures())
                }
              }
              map.on("sourcedata", onSourceData)

              // Timeout fallback - query anyway after 2 seconds
              setTimeout(() => {
                map.off("sourcedata", onSourceData)
                resolve(queryFeatures())
              }, 2000)
            }
          })
        })

        // Convert to hotspot data, preferring Mapbox coordinates over API coordinates
        const hotspotsData: HotspotData[] = tier4Features
          .map((feature) => {
            const locationId = feature.properties.location_id

            // Prefer Mapbox coordinates (more accurate for rendered polygons)
            // Fall back to API polygon center if Mapbox coords not available
            const mapboxCoords = mapboxCoordsLookup.get(locationId)
            const apiCenter = getPolygonCenter(feature)

            const coords = mapboxCoords || apiCenter
            if (!coords) return null

            // Priority: Sub_Name > Urb_Name > Mod_Name > staticMapping > location_name
            let enhancedName = feature.properties.location_name
            const names = namesLookup.get(locationId)
            if (names) {
              if (names.subName) {
                enhancedName = names.subName
              } else if (names.urbName) {
                enhancedName = names.urbName
              } else if (names.modName) {
                enhancedName = names.modName
              }
            } else {
              // Fallback to static mapping when Mapbox tiles not loaded
              const staticInfo = getDemandUnitNameInfo(locationId)
              if (staticInfo) {
                enhancedName =
                  staticInfo.subName ||
                  staticInfo.urbName ||
                  staticInfo.modName ||
                  enhancedName
              }
            }

            return {
              id: locationId,
              name: enhancedName,
              longitude: coords[0],
              latitude: coords[1],
              tier: feature.properties.tier_level,
            }
          })
          .filter((h): h is HotspotData => h !== null)

        setHotspots(hotspotsData)
      } catch {
        // Silently handle errors
        setHotspots([])
      }
    }

    loadHotspots()
  }, [config, outcome, strategy, visible, mapAPI])

  // Don't render if no config or not visible
  if (!config || !visible || hotspots.length === 0) {
    return null
  }

  const tierColor = theme.palette.tiers.tier4 // Red for tier 4 (worst)

  return (
    <>
      {hotspots.map((hotspot) => (
        <Marker
          key={hotspot.id}
          longitude={hotspot.longitude}
          latitude={hotspot.latitude}
          anchor="bottom"
        >
          <Box
            onClick={() => handleMarkerClick(hotspot)}
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: theme.transition.default,
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {/* Marker image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.image}
              alt={config.imageAlt}
              style={{
                width: "60px",
                height: "auto",
                filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.3))",
              }}
            />

            {/* Co-marker label */}
            <Box
              sx={{
                position: "absolute",
                left: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                ml: 1,
                ...theme.typography.compact.micro,
                backgroundColor: tierColor,
                color: theme.palette.utility.white,
                py: 0.5,
                px: 1,
                borderRadius: theme.borderRadius.sm,
                fontWeight: theme.typography.fontWeightSemiBold,
                whiteSpace: "nowrap",
                boxShadow: theme.shadow.subtle,
                border: theme.border.subtleOutline,
                pointerEvents: "none",
              }}
            >
              {hotspot.name}
            </Box>
          </Box>
        </Marker>
      ))}
    </>
  )
}

export default HotspotMarkers

