"use client"

import React from "react"
import { Marker, Layer, Source } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocation } from "../../../api/tierLocationApi"

interface TierMarkersProps {
  locations: TierLocation[]
}

/**
 * TierMarkers to render tier data on the map
 * Displays either markers (for points) or polygons (for areas)
 * Colored by tier level
 */
export default function TierMarkers({ locations }: TierMarkersProps) {
  const theme = useTheme()

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

  // Separate point and polygon locations
  const pointLocations = locations.filter((loc) => loc.geometry.type === "Point")
  const polygonLocations = locations.filter(
    (loc) => loc.geometry.type === "Polygon",
  )

  return (
    <>
      {/* Point markers */}
      {pointLocations.map((location) => {
        if (location.geometry.type !== "Point") return null
        const [lng, lat] = location.geometry.coordinates

        return (
          <Marker
            key={location.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: getTierColor(location.tier),
                border: `2px solid white`,
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                cursor: "pointer",
              }}
              title={
                (typeof location.properties?.name === "string"
                  ? location.properties.name
                  : undefined) || `Tier ${location.tier}`
              }
            />
          </Marker>
        )
      })}

      {/* Polygon layers */}
      {polygonLocations.map((location) => {
        if (location.geometry.type !== "Polygon") return null

        const geojson = {
          type: "FeatureCollection" as const,
          features: [
            {
              type: "Feature" as const,
              geometry: location.geometry,
              properties: {
                tier: location.tier,
                ...location.properties,
              },
            },
          ],
        }

        return (
          <Source
            key={location.id}
            id={`tier-polygon-${location.id}`}
            type="geojson"
            data={geojson}
          >
            <Layer
              id={`tier-polygon-fill-${location.id}`}
              type="fill"
              paint={{
                "fill-color": getTierColor(location.tier),
                "fill-opacity": 0.6,
              }}
            />
            <Layer
              id={`tier-polygon-outline-${location.id}`}
              type="line"
              paint={{
                "line-color": getTierColor(location.tier),
                "line-width": 2,
              }}
            />
          </Source>
        )
      })}
    </>
  )
}

