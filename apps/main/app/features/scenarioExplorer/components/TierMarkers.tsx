"use client"

import React, { useState } from "react"
import { Marker, Layer, Source, Popup } from "@repo/map"
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
  const [popupInfo, setPopupInfo] = useState<{
    longitude: number
    latitude: number
    name: string
    tierLevel: number
    tierLabel: string
    locationType: string
  } | null>(null)

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

  // Separate by geometry type
  const pointFeatures = data.features.filter(
    (f) => f.geometry.type === "Point",
  )
  const polygonFeatures = data.features.filter(
    (f) => f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon",
  )

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
                fontStyle: "italic",
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

      {/* Polygon layers */}
      {polygonFeatures.length > 0 && (
        <Source
          id="tier-polygons"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: polygonFeatures,
          }}
        >
          <Layer
            id="tier-polygon-fill"
            type="fill"
            paint={{
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
            }}
          />
          <Layer
            id="tier-polygon-outline"
            type="line"
            paint={{
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
            }}
          />
        </Source>
      )}
    </>
  )
}

