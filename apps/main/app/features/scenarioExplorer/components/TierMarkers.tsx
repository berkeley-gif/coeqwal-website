"use client"

import React, { useState, useEffect } from "react"
import { Marker, Layer, Source, Popup, useMap } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocationResponse } from "../../../api/tierLocationApi"

interface TierMarkersProps {
  data: TierLocationResponse
}

/**
 * TierMarkers to render tier data on the map
 * Displays GeoJSON FeatureCollection with points and polygons
 * Colored by tier level
 */
export default function TierMarkers({ data }: TierMarkersProps) {
  const theme = useTheme()
  const mapAPI = useMap()
  const [mapReady, setMapReady] = useState(false)
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    name: string
    tierLevel: number
    tierLabel: string
    locationType: string
  } | null>(null)

  // Separate by geometry type
  const pointFeatures = data.features.filter(
    (f) => f.geometry.type === "Point",
  )
  const polygonFeatures = data.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon",
  )

  // Wait for map to be ready
  useEffect(() => {
    mapAPI.withMap((map) => {
      if (map.isStyleLoaded()) {
        console.log("🗺️ Map already loaded")
        setMapReady(true)
      } else {
        console.log("⏳ Waiting for map to load...")
        map.once("styledata", () => {
          console.log("✅ Map style loaded")
          setMapReady(true)
        })
      }
    })
  }, [mapAPI])

  // Close popup when data changes (new tier selected)
  useEffect(() => {
    setPopupInfo(null)
  }, [data])

  // Add polygon layers directly via map API (more reliable than declarative)
  useEffect(() => {
    if (!mapReady || polygonFeatures.length === 0) return

    const cleanup = mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()
      const sourceId = `tier-polygons-${data.metadata.tier_code}`
      const fillLayerId = `tier-polygon-fill-${data.metadata.tier_code}`
      const outlineLayerId = `tier-polygon-outline-${data.metadata.tier_code}`

      // Remove existing layers/source if they exist
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
      if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)

      // Add source
      map.addSource(sourceId, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: polygonFeatures,
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

      // Add click handler
      const handleClick = (e: any) => {
        const feature = e.features?.[0]
        if (feature && feature.properties) {
          setPopupInfo({
            longitude: e.lngLat.lng,
            latitude: e.lngLat.lat,
            name: feature.properties.location_name,
            tierLevel: feature.properties.tier_level,
            tierLabel: getTierLabel(feature.properties.tier_level),
            locationType: feature.properties.location_type_display,
          })
        }
      }

      map.on("click", fillLayerId, handleClick)
      
      console.log("✅ Added polygon layers:", sourceId)

      // Cleanup
      return () => {
        map.off("click", fillLayerId, handleClick)
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      }
    })

    return cleanup
  }, [mapAPI, mapReady, polygonFeatures, data, theme])

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

  // Get tier label
  const getTierLabel = (tier: number): string => {
    switch (tier) {
      case 1:
        return "Optimal"
      case 2:
        return "Suboptimal"
      case 3:
        return "At-risk"
      case 4:
        return "Critical"
      default:
        return "Unknown"
    }
  }

  // Convert to sentence case
  const toSentenceCase = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  console.log("🗺️ TierMarkers render:", {
    outcome: data.metadata.tier_name,
    totalFeatures: data.features.length,
    points: pointFeatures.length,
    polygons: polygonFeatures.length,
    geometryTypes: data.features.map((f) => f.geometry.type),
    firstFeature: data.features[0],
  })

  return (
    <>
      {/* Point markers */}
      {pointFeatures.map((feature) => {
        const coords = feature.geometry.coordinates as [number, number]
        const [lng, lat] = coords

        return (
          <Marker
            key={feature.properties.location_id}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: getTierColor(feature.properties.tier_level),
                border: `2px solid white`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              onClick={() =>
                setPopupInfo({
                  longitude: lng,
                  latitude: lat,
                  name: feature.properties.location_name,
                  tierLevel: feature.properties.tier_level,
                  tierLabel: getTierLabel(feature.properties.tier_level),
                  locationType: feature.properties.location_type_display,
                })
              }
            />
          </Marker>
        )
      })}

      {/* Popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
          offset={15}
        >
          <div
            style={{
              padding: "12px 16px",
              minWidth: "220px",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            <div
              style={{
                fontSize: "0.8125rem",
                color: theme.palette.grey[600],
                marginBottom: "2px",
              }}
            >
              {toSentenceCase(popupInfo.locationType)}
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                marginBottom: "8px",
                color: theme.palette.blue.darkest,
              }}
            >
              {popupInfo.name}
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "2px",
                  backgroundColor: getTierColor(popupInfo.tierLevel),
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>Tier {popupInfo.tierLevel}:</strong> {popupInfo.tierLabel}
              </span>
            </div>
          </div>
        </Popup>
      )}

    </>
  )
}

