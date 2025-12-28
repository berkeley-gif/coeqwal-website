"use client"

/**
 * TierMarkers - Map markers showing tier data by location
 *
 * Displays markers on the map for each location with tier data.
 * Reports hover/click events to parent for unified tooltip handling.
 */

import React, { useState, useEffect } from "react"
import { Marker, useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocationResponse } from "../../../../lib/api/tierLocationApi"
import type { HoveredFeatureInfo } from "../types"
import { getTierLabel } from "../../../../content/tiers"

interface TierMarkersProps {
  data: TierLocationResponse
  /** Called when a marker is hovered */
  onHover?: (feature: HoveredFeatureInfo | null) => void
  /** Called when a marker is clicked */
  onClick?: (feature: HoveredFeatureInfo) => void
}

/**
 * TierMarkers to render tier data on the map
 * Displays GeoJSON FeatureCollection with points and polygons
 * Colored by tier level
 */
export default function TierMarkers({
  data,
  onHover,
  onClick,
}: TierMarkersProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const [mapReady, setMapReady] = useState(false)

  // Separate by geometry type
  const pointFeatures = data.features.filter((f) => f.geometry.type === "Point")
  const polygonFeatures = data.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon",
  )

  // Wait for map to be ready
  useEffect(() => {
    mapAPI.withMap((map) => {
      if (map.isStyleLoaded()) {
        setMapReady(true)
      } else {
        map.once("styledata", () => setMapReady(true))
      }
    })
  }, [mapAPI])

  // Clean up old layers when data changes (new tier selected)
  useEffect(() => {
    // Remove all previous tier layers (only if style is loaded)
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Wait for style to be loaded before accessing layers/sources
      if (!map.isStyleLoaded()) {
        return // Style not ready, cleanup will happen when polygon effect runs
      }

      const existingLayers = map.getStyle().layers
      const existingSources = Object.keys(map.getStyle().sources)

      // Remove all tier-polygon layers
      existingLayers.forEach((layer) => {
        if (
          layer.id.startsWith("tier-polygon-") &&
          layer.id !== `tier-polygon-fill-${data.metadata.tier_code}`
        ) {
          map.removeLayer(layer.id)
        }
      })

      // Remove all tier-polygons sources
      existingSources.forEach((sourceId) => {
        if (
          sourceId.startsWith("tier-polygons-") &&
          sourceId !== `tier-polygons-${data.metadata.tier_code}`
        ) {
          map.removeSource(sourceId)
        }
      })
    })
  }, [data, mapAPI])

  // Add polygon layers directly via map API (more reliable than declarative)
  useEffect(() => {
    if (!mapReady || polygonFeatures.length === 0) return

    const cleanup = mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()

      // Double-check style is loaded (safety check)
      if (!map.isStyleLoaded()) return

      const sourceId = `tier-polygons-${data.metadata.tier_code}`
      const fillLayerId = `tier-polygon-fill-${data.metadata.tier_code}`
      const outlineLayerId = `tier-polygon-outline-${data.metadata.tier_code}`

      // Remove ALL previous tier layers first
      const existingLayers = map.getStyle().layers
      existingLayers.forEach((layer) => {
        if (layer.id.startsWith("tier-polygon-")) {
          map.removeLayer(layer.id)
        }
      })

      // Remove ALL previous tier sources
      Object.keys(map.getStyle().sources).forEach((srcId) => {
        if (srcId.startsWith("tier-polygons-")) {
          map.removeSource(srcId)
        }
      })

      // Add source
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: polygonFeatures as GeoJSON.Feature[],
        },
      })

      // Add fill layer
      map.addLayer({
        id: fillLayerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": [
            "match",
            ["get", "tier_level"],
            1,
            theme.palette.tiers.tier1,
            2,
            theme.palette.tiers.tier2,
            3,
            theme.palette.tiers.tier3,
            4,
            theme.palette.tiers.tier4,
            theme.palette.grey[500],
          ],
          "fill-opacity": 0.7,
        },
      })

      // Add outline layer
      map.addLayer({
        id: outlineLayerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": [
            "match",
            ["get", "tier_level"],
            1,
            theme.palette.tiers.tier1,
            2,
            theme.palette.tiers.tier2,
            3,
            theme.palette.tiers.tier3,
            4,
            theme.palette.tiers.tier4,
            theme.palette.grey[500],
          ],
          "line-width": 2,
        },
      })

      // Add click handler for polygon features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleClick = (e: any) => {
        const feature = e.features?.[0]
        if (feature && feature.properties && onClick) {
          const featureInfo: HoveredFeatureInfo = {
            longitude: e.lngLat.lng,
            latitude: e.lngLat.lat,
            geometryType: "polygon",
            layerType: "point", // Using point since these are tier-polygon layers
            featureId: feature.properties.location_id as string,
            tierLevel: feature.properties.tier_level as number,
            tierLabel: getTierLabel(feature.properties.tier_level as number),
            tierValue: feature.properties.tier_value as number,
            locationName: feature.properties.location_name as string,
            locationType: feature.properties.location_type_display as string,
            properties: feature.properties,
            urbName: null,
            modName: null,
            subName: null,
            comments: null,
            type: null,
            classType: null,
            hydroRegion: null,
            gisAcres: null,
          }
          onClick(featureInfo)
        }
      }

      map.on("click", fillLayerId, handleClick)

      // Cleanup
      return () => {
        map.off("click", fillLayerId, handleClick)
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      }
    })

    return cleanup
  }, [mapAPI, mapReady, polygonFeatures, data, theme, onClick])

  // Get tier color
  const getTierColor = (tier: number): string => {
    switch (tier) {
      case 1:
        return theme.palette.tiers.tier1
      case 2:
        return theme.palette.tiers.tier2
      case 3:
        return theme.palette.tiers.tier3
      case 4:
        return theme.palette.tiers.tier4
      default:
        return theme.palette.grey[500]
    }
  }

  // Build feature info for tooltip callbacks
  const buildFeatureInfo = (
    feature: (typeof pointFeatures)[0],
    lng: number,
    lat: number,
  ): HoveredFeatureInfo => ({
    longitude: lng,
    latitude: lat,
    geometryType: "point",
    layerType: "point",
    featureId: feature.properties.location_id,
    tierLevel: feature.properties.tier_level,
    tierLabel: getTierLabel(feature.properties.tier_level),
    tierValue: feature.properties.tier_value,
    locationName: feature.properties.location_name,
    locationType: feature.properties.location_type_display,
    properties: feature.properties,
    // These are for polygon layers, null for points
    urbName: null,
    modName: null,
    subName: null,
    comments: null,
    type: null,
    classType: null,
    hydroRegion: null,
    gisAcres: null,
  })

  // Determine if markers should use diamond shape (Environmental flows)
  // Check tier_code OR tier_name for robustness
  const isDiamond =
    data.metadata.tier_code === "ENV_FLOWS" ||
    data.metadata.tier_name?.toLowerCase().includes("environmental")

  return (
    <>
      {/* Point markers */}
      {pointFeatures.map((feature) => {
        const coords = feature.geometry.coordinates as [number, number]
        const [lng, lat] = coords
        const featureInfo = buildFeatureInfo(feature, lng, lat)

        return (
          <Marker
            key={feature.properties.location_id}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: getTierColor(feature.properties.tier_level),
                // Diamond: white outline to match rivers; Circle: standard onDark border
                border: isDiamond
                  ? "2px solid rgba(255, 255, 255, 0.9)"
                  : theme.border.onDark,
                boxShadow: theme.shadow.sm,
                cursor: "pointer",
                // Diamond: rotate first, then scale for narrow diamond; Circle: use border-radius
                borderRadius: isDiamond
                  ? theme.borderRadius.xs
                  : theme.borderRadius.circle,
                transform: isDiamond ? "scale(0.5, 1) rotate(45deg)" : "none",
                transformOrigin: "center",
              }}
              onMouseEnter={() => onHover?.(featureInfo)}
              onMouseLeave={() => onHover?.(null)}
              onClick={() => onClick?.(featureInfo)}
            />
          </Marker>
        )
      })}
    </>
  )
}
