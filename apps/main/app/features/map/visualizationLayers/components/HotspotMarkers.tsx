"use client"

/**
 * HotspotMarkers component
 *
 * Renders markers for tier 4 locations for specific outcomes.
 * Each marker shows an image with a tier-colored label.
 * Coordinates come from the API response, then refined using
 * Mapbox tile polygons when available (pointOnFeature).
 */

import { useState, useEffect, useCallback } from "react"
import { Marker, useMap } from "@repo/map"
import { Box } from "@repo/ui/mui"
import { useTheme } from "@repo/ui/mui"
import { pointOnFeature } from "@turf/turf"
import type { Feature, Polygon, MultiPolygon } from "geojson"
import { fetchTierLocationData, type TierFeature } from "@repo/data/coeqwal"
import { getDemandUnitNameInfo } from "../../config/demandUnitNames"

// Outcome configurations for hotspots (keyed by outcome code)
const HOTSPOT_CONFIGS: Record<
  string,
  {
    ariaLabel: string
    labelPrefix: string
  }
> = {
  CWS_DEL: {
    ariaLabel: "Community water system at risk",
    labelPrefix: "Water system at risk",
  },
  WRC_SALMON_AB: {
    ariaLabel: "Salmon habitat at risk",
    labelPrefix: "Salmon habitat at risk",
  },
  AG_REV: {
    ariaLabel: "Agricultural area at risk",
    labelPrefix: "Farm at risk",
  },
  ENV_FLOWS: {
    ariaLabel: "Environmental flow at risk",
    labelPrefix: "Flow at risk",
  },
  GW_STOR: {
    ariaLabel: "Groundwater location at risk",
    labelPrefix: "Groundwater at risk",
  },
}

interface HotspotMarkersProps {
  /** The outcome code to show hotspots for */
  outcomeCode: string | null
  /** Scenario ID for API call */
  scenarioId?: string
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
 * Get a point guaranteed to be inside the polygon using Turf's pointOnFeature.
 * For Point geometries, returns the coordinates directly.
 */
function getPolygonCenter(feature: TierFeature): [number, number] | null {
  const { geometry } = feature

  if (geometry.type === "Point") {
    const coords = geometry.coordinates as number[]
    if (coords.length < 2) return null
    return [coords[0]!, coords[1]!]
  }

  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") {
    try {
      const pt = pointOnFeature(feature as Feature<Polygon | MultiPolygon>)
      return pt.geometry.coordinates as [number, number]
    } catch {
      return null
    }
  }

  return null
}

export function HotspotMarkers({
  outcomeCode,
  scenarioId = "s0020",
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

  // Get config for this outcome code
  const config = outcomeCode ? HOTSPOT_CONFIGS[outcomeCode] : null

  // Fetch tier 4 locations, then refine with Mapbox tile data before displaying.
  // Waits for tiles so names and coordinates are resolved in a single update.
  useEffect(() => {
    if (!config || !outcomeCode || !visible) {
      setHotspots([])
      return
    }

    let cancelled = false

    const loadHotspots = async () => {
      try {
        const response = await fetchTierLocationData(scenarioId, outcomeCode)
        if (cancelled) return

        const MAX_HOTSPOT_MARKERS = 5

        // Build initial hotspot data from API + static name mapping
        const hotspotsData: HotspotData[] = response.features
          .filter((f) => f.properties.tier_level === 4)
          .map((feature) => {
            const locationId = feature.properties.location_id
            const coords = getPolygonCenter(feature)
            if (!coords) return null

            let name = feature.properties.location_name
            const staticInfo = getDemandUnitNameInfo(locationId)
            if (staticInfo) {
              name =
                staticInfo.subName ||
                staticInfo.urbName ||
                staticInfo.modName ||
                name
            }

            return {
              id: locationId,
              name,
              longitude: coords[0],
              latitude: coords[1],
              tier: feature.properties.tier_level,
            }
          })
          .filter((h): h is HotspotData => h !== null)
          .slice(0, MAX_HOTSPOT_MARKERS)

        if (cancelled || hotspotsData.length === 0) {
          if (!cancelled) setHotspots(hotspotsData)
          return
        }

        // Refine coordinates and names from Mapbox tile polygons, then set state.
        // Done inside a single withMap call so we have map access for all hotspots.
        mapAPI.withMap((mapRef) => {
          const map = mapRef.getMap()

          const refineAndSet = () => {
            if (cancelled) return

            const refined = hotspotsData.map((hotspot) => {
              try {
                const features = map.querySourceFeatures("composite", {
                  sourceLayer: "demand_units",
                  filter: ["==", "DU_ID", hotspot.id],
                })

                let { longitude: lng, latitude: lat, name } = hotspot

                // Refine coordinates from polygon
                const poly = features.find(
                  (f) =>
                    f.geometry.type === "Polygon" ||
                    f.geometry.type === "MultiPolygon",
                )
                if (poly) {
                  const pt = pointOnFeature(
                    poly as unknown as Feature<Polygon | MultiPolygon>,
                  )
                  ;[lng, lat] = pt.geometry.coordinates as [number, number]
                }

                // Refine name from tile properties
                const nameFeature = features[0]
                const tileName =
                  nameFeature?.properties?.Sub_Name?.trim() ||
                  nameFeature?.properties?.Urb_Name?.trim() ||
                  nameFeature?.properties?.Mod_Name?.trim()
                if (tileName) {
                  name = tileName
                }

                return { ...hotspot, longitude: lng, latitude: lat, name }
              } catch {
                return hotspot
              }
            })

            setHotspots(refined)
          }

          if (map.isSourceLoaded("composite")) {
            refineAndSet()
          } else {
            const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
              if (e.sourceId === "composite" && e.isSourceLoaded) {
                map.off("sourcedata", onSourceData)
                refineAndSet()
              }
            }
            map.on("sourcedata", onSourceData)
            // Fallback: set with best available data after timeout
            setTimeout(() => {
              map.off("sourcedata", onSourceData)
              refineAndSet()
            }, 3000)
          }
        })
      } catch {
        if (!cancelled) setHotspots([])
      }
    }

    loadHotspots()

    return () => {
      cancelled = true
    }
  }, [config, outcomeCode, scenarioId, visible, mapAPI])

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
          anchor="center"
        >
          <Box
            onClick={() => handleMarkerClick(hotspot)}
            aria-label={config.ariaLabel}
            sx={{
              position: "relative",
              cursor: "pointer",
              transition: theme.transition.default,
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {/* Pin marker.omitted for ENV_FLOWS, which uses TierMarkers diamonds */}
            {outcomeCode !== "ENV_FLOWS" && (
              <Box
                sx={{
                  fontSize: "28px",
                  lineHeight: 1,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
                }}
              >
                📍
              </Box>
            )}

            {/* Co-marker label */}
            <Box
              sx={{
                position: "absolute",
                left: "100%",
                top: "50%",
                transform: "translateY(-50%)",
                ml: theme.space.component.sm,
                ...theme.typography.compactMicro,
                backgroundColor: tierColor,
                color: theme.palette.common.white,
                py: theme.space.component.xs,
                px: theme.space.component.sm,
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
