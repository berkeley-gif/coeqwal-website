"use client"

/**
 * PointMarkerLabels - Labeled markers for point-based outcomes
 *
 * Renders tier-colored labels with leader lines for point features.
 * Used for outcomes like Delta stations (pumping plants, compliance stations).
 * Automatically offsets labels to avoid overlap when multiple markers are close.
 */

import React from "react"
import { Marker } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocationResponse } from "@repo/data/coeqwal"

interface PointMarkerLabelsProps {
  data: TierLocationResponse
}

interface LabeledPoint {
  id: string
  name: string
  tier: number
  longitude: number
  latitude: number
  offsetY: number
  lineY2: number
}

export function PointMarkerLabels({ data }: PointMarkerLabelsProps) {
  const theme = useTheme()

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

  // Extract and sort points by latitude (north to south)
  const sortedPoints = data.features
    .filter((f) => f.geometry.type === "Point")
    .map((f) => {
      const [longitude, latitude] = f.geometry.coordinates as [number, number]
      return {
        id: f.properties.location_id,
        name: f.properties.location_name || f.properties.location_id,
        tier: f.properties.tier_level,
        longitude,
        latitude,
      }
    })
    .sort((a, b) => b.latitude - a.latitude) // North first

  // Calculate offsets to avoid overlap - alternate up/down based on position
  const points: LabeledPoint[] = sortedPoints.map((point, index) => {
    // For single point, use standard offset
    if (sortedPoints.length === 1) {
      return { ...point, offsetY: -20, lineY2: 40 }
    }
    // For multiple points, alternate: even indices go up, odd go down
    const goesUp = index % 2 === 0
    return {
      ...point,
      offsetY: goesUp ? -40 : 10,
      lineY2: goesUp ? 60 : 10,
    }
  })

  if (points.length === 0) return null

  return (
    <>
      {points.map((point) => (
        <Marker
          key={point.id}
          longitude={point.longitude}
          latitude={point.latitude}
          anchor="bottom-left"
          offset={[20, point.offsetY]}
        >
          <div style={{ position: "relative", pointerEvents: "none" }}>
            {/* Leader line from left-center of label to marker location */}
            <svg
              style={{
                position: "absolute",
                left: -20,
                top: 0,
                width: 20,
                height: 80,
                overflow: "visible",
              }}
            >
              <line
                x1="20"
                y1="10"
                x2="0"
                y2={point.lineY2}
                stroke={`${theme.palette.common.white}CC`}
                strokeWidth="1.5"
              />
            </svg>
            {/* Label */}
            <div
              style={{
                ...theme.typography.compactMicro,
                backgroundColor: getTierColor(point.tier),
                color: theme.palette.common.white,
                padding: "4px 8px",
                borderRadius: theme.borderRadius.sm,
                fontWeight: theme.typography.fontWeightSemiBold,
                whiteSpace: "nowrap",
                boxShadow: theme.shadow.subtle,
                border: theme.border.subtleOutline,
              }}
            >
              {point.name}
            </div>
          </div>
        </Marker>
      ))}
    </>
  )
}

export default PointMarkerLabels
