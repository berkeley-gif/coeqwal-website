"use client"

/**
 * TierLocationLabels - Unified labeled markers for tier-based locations
 * 
 * Handles reservoirs, pumping plants, compliance stations, and other
 * point-based tier visualizations with consistent styling.
 */

import React from "react"
import { Marker } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocationResponse } from "../../../../lib/api/tierLocationApi"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../config/outcomeLayerRegistry"

// =============================================================================
// LOCATION CONFIGS
// =============================================================================

// Reservoir anchor points (upper-right for label placement)
const RESERVOIR_ANCHOR_POINTS: Record<string, [number, number]> = {
  "Shasta Lake": [-122.23, 40.76],
  "Lake Oroville": [-121.44, 39.56],
  "Folsom Lake": [-121.12, 38.76],
  "New Melones Lake": [-120.53, 37.98],
  "Millerton Lake": [-119.66, 37.01],
  "San Luis Reservoir": [-121.13, 37.08],
  "Trinity Lake": [-122.68, 40.98],
}

// Station coordinates by location_id
const STATION_COORDINATES: Record<string, [number, number]> = {
  // Compliance stations (in-Delta uses)
  "EM": [-121.742, 38.0802], // Emmaton
  "JP": [-121.685, 38.0519], // Jersey Point
  // Pumping plants (Delta exports)
  "D419": [-121.5565, 37.8267], // Banks Pumping Plant
  "C5": [-121.5778, 37.8156], // Jones Pumping Plant
}

// Station display names by location_id
const STATION_NAMES: Record<string, string> = {
  "EM": "Emmaton (Salinity) Compliance Station",
  "JP": "Jersey Point (Salinity) Compliance Station",
  "D419": "Banks Pumping Plant",
  "C5": "Jones Pumping Plant",
}

// =============================================================================
// TYPES
// =============================================================================

interface LocationData {
  id: string
  name: string
  tier: number
  longitude: number
  latitude: number
}

interface TierLocationLabelsProps {
  /** Tier lookup for reservoirs: CalSim ID -> tier level */
  tierLookup?: Record<string, number>
  /** Tier location data from API for stations */
  data?: TierLocationResponse
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TierLocationLabels({ tierLookup, data }: TierLocationLabelsProps) {
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

  // Build location list from either source
  let locations: LocationData[] = []

  if (tierLookup && Object.keys(tierLookup).length > 0) {
    // Reservoir mode: use hardcoded anchor points
    const seenNames = new Set<string>()
    Object.entries(tierLookup).forEach(([calsimId, tier]) => {
      const name = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
      if (!name || seenNames.has(name)) return
      seenNames.add(name)

      const anchor = RESERVOIR_ANCHOR_POINTS[name]
      if (anchor) {
        locations.push({
          id: calsimId,
          name,
          tier,
          longitude: anchor[0],
          latitude: anchor[1],
        })
      }
    })
  } else if (data) {
    // Station mode: use hardcoded coordinates, only tier from API
    locations = data.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => {
        const locationId = f.properties.location_id
        const coords = STATION_COORDINATES[locationId]
        
        // Skip if no hardcoded coordinates for this station
        if (!coords) return null
        
        return {
          id: locationId,
          name: STATION_NAMES[locationId] || locationId,
          tier: f.properties.tier_level,
          longitude: coords[0],
          latitude: coords[1],
        }
      })
      .filter((loc): loc is LocationData => loc !== null)
  }

  if (locations.length === 0) return null

  return (
    <>
      {locations.map((location, index) => {
        // Stagger labels vertically based on index to avoid overlap
        const isEven = index % 2 === 0
        const offset: [number, number] = isEven ? [20, -40] : [20, 10]
        const lineY2 = isEven ? 60 : 10

        return (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom-left"
            offset={offset}
          >
            <div style={{ position: "relative", pointerEvents: "none" }}>
              {/* Leader line from label to location */}
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
                  y2={lineY2}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="1.5"
                />
              </svg>
              {/* Label */}
              <div
                style={{
                  ...theme.typography.compact.micro,
                  backgroundColor: getTierColor(location.tier),
                  color: theme.palette.utility.white,
                  padding: "4px 8px",
                  borderRadius: theme.borderRadius.sm,
                  fontWeight: theme.typography.fontWeightSemiBold,
                  whiteSpace: "nowrap",
                  boxShadow: theme.shadow.subtle,
                  border: theme.border.subtleOutline,
                }}
              >
                {location.name}
              </div>
            </div>
          </Marker>
        )
      })}
    </>
  )
}

export default TierLocationLabels
