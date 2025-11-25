"use client"

import React, { useState, useEffect } from "react"
import { Marker, Popup, useMap } from "@repo/map"
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

  // Close popup and clean up old layers when data changes (new tier selected)
  useEffect(() => {
    setPopupInfo(null)

    // Remove all previous tier layers
    mapAPI.withMap((mapRef) => {
      const map = mapRef.getMap()
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
      Object.keys(map.getStyle().sources).forEach((sourceId) => {
        if (sourceId.startsWith("tier-polygons-")) {
          map.removeSource(sourceId)
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

      // Add click handler
      const handleClick = (e: { 
        features?: Array<{ properties: Record<string, unknown> }>
        lngLat: { lng: number; lat: number }
      }) => {
        const feature = e.features?.[0]
        if (feature && feature.properties) {
          setPopupInfo({
            longitude: e.lngLat.lng,
            latitude: e.lngLat.lat,
            name: feature.properties.location_name as string,
            tierLevel: feature.properties.tier_level as number,
            tierLabel: getTierLabel(feature.properties.tier_level as number),
            locationType: feature.properties.location_type_display as string,
          })
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
                border: `2px solid ${theme.palette.common.white}`,
                boxShadow: theme.shadow.medium,
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
              padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
              minWidth: theme.spacing(27.5),
              fontFamily: theme.typography.fontFamily,
            }}
          >
            <div
              style={{
                fontSize: theme.typography.caption.fontSize,
                color: theme.palette.grey[600],
                marginBottom: theme.spacing(0.25),
              }}
            >
              {toSentenceCase(popupInfo.locationType)}
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: theme.typography.body2.fontSize,
                marginBottom: theme.spacing(1),
                color: theme.palette.blue.darkest,
              }}
            >
              {popupInfo.name}
            </div>
            <div
              style={{
                fontSize: theme.typography.nav.fontSize,
                display: "flex",
                alignItems: "center",
                gap: theme.spacing(1),
              }}
            >
              <div
                style={{
                  width: theme.spacing(1.5),
                  height: theme.spacing(1.5),
                  borderRadius: theme.borderRadius.standard,
                  backgroundColor: getTierColor(popupInfo.tierLevel),
                  flexShrink: 0,
                }}
              />
              <span>
                <strong>Tier {popupInfo.tierLevel}:</strong>{" "}
                {popupInfo.tierLabel}
              </span>
            </div>
          </div>
        </Popup>
      )}
    </>
  )
}
