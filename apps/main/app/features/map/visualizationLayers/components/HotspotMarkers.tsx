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
    image: string
    imageAlt: string
    labelPrefix: string
  }
> = {
  CWS_DEL: {
    image: "/images/map_markers/drinking_water.png",
    imageAlt: "Community water system marker showing water system at risk",
    labelPrefix: "Water system at risk",
  },
  WRC_SALMON_AB: {
    image: "/images/map_markers/salmon.png",
    imageAlt: "Salmon habitat marker showing habitat at risk",
    labelPrefix: "Salmon habitat at risk",
  },
  AG_REV: {
    image: "/images/map_markers/2008_03_24_PH_0262_Victoria_Island.png",
    imageAlt: "Agricultural area marker showing farm at risk",
    labelPrefix: "Farm at risk",
  },
  ENV_FLOWS: {
    image: "/images/map_markers/flow.png",
    imageAlt: "Environmental flow marker showing flow at risk",
    labelPrefix: "Flow at risk",
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

  // Fetch tier 4 locations when outcome code changes
  useEffect(() => {
    if (!config || !outcomeCode || !visible) {
      setHotspots([])
      return
    }

    const loadHotspots = async () => {
      try {
        const response = await fetchTierLocationData(scenarioId, outcomeCode)

        // Filter for tier 4 features and convert to hotspot data
        const hotspotsData: HotspotData[] = response.features
          .filter((f) => f.properties.tier_level === 4)
          .map((feature) => {
            const locationId = feature.properties.location_id
            const coords = getPolygonCenter(feature)
            if (!coords) return null

            // Use static name mapping, fall back to API location_name
            let enhancedName = feature.properties.location_name
            const staticInfo = getDemandUnitNameInfo(locationId)
            if (staticInfo) {
              enhancedName =
                staticInfo.subName ||
                staticInfo.urbName ||
                staticInfo.modName ||
                enhancedName
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

        // Limit to 5 markers to avoid overwhelming the map
        const MAX_HOTSPOT_MARKERS = 5
        setHotspots(hotspotsData.slice(0, MAX_HOTSPOT_MARKERS))
      } catch {
        setHotspots([])
      }
    }

    loadHotspots()
  }, [config, outcomeCode, scenarioId, visible])

  // Refine hotspot coordinates and names using Mapbox tile data.
  // The API returns Point centroids (may not match rendered polygon) and CalSim IDs
  // (not human-readable). This queries tiles for each hotspot's DU_ID to get
  // accurate polygon placement via pointOnFeature and real names (Sub_Name, etc.).
  useEffect(() => {
    if (hotspots.length === 0) return

    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      const refineCoords = () => {
        let updated = false
        const refined = hotspots.map((hotspot) => {
          try {
            const features = map.querySourceFeatures("composite", {
              sourceLayer: "demand_units",
              filter: ["==", "DU_ID", hotspot.id],
            })

            const poly = features.find(
              (f) =>
                f.geometry.type === "Polygon" ||
                f.geometry.type === "MultiPolygon",
            )

            // Extract name from any matching feature
            const nameFeature = features[0]
            const subName = nameFeature?.properties?.Sub_Name?.trim()
            const urbName = nameFeature?.properties?.Urb_Name?.trim()
            const modName = nameFeature?.properties?.Mod_Name?.trim()
            const tileName = subName || urbName || modName

            let newLng = hotspot.longitude
            let newLat = hotspot.latitude
            let newName = hotspot.name

            if (poly) {
              const pt = pointOnFeature(
                poly as unknown as Feature<Polygon | MultiPolygon>,
              )
              ;[newLng, newLat] = pt.geometry.coordinates as [number, number]
            }

            if (tileName) {
              newName = tileName
            }

            if (
              newLng !== hotspot.longitude ||
              newLat !== hotspot.latitude ||
              newName !== hotspot.name
            ) {
              updated = true
              return { ...hotspot, longitude: newLng, latitude: newLat, name: newName }
            }
          } catch {
            // Keep existing values if query fails
          }
          return hotspot
        })

        if (updated) {
          setHotspots(refined)
        }
      }

      if (map.isSourceLoaded("composite")) {
        refineCoords()
      } else {
        const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
          if (e.sourceId === "composite" && e.isSourceLoaded) {
            map.off("sourcedata", onSourceData)
            refineCoords()
          }
        }
        map.on("sourcedata", onSourceData)
        setTimeout(() => {
          map.off("sourcedata", onSourceData)
          refineCoords()
        }, 3000)
      }
    })
  }, [hotspots.length > 0, mapAPI]) // eslint-disable-line react-hooks/exhaustive-deps

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
