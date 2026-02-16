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
import type { TierLocationResponse } from "@repo/data/coeqwal"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../config/outcomeLayerRegistry"

// =============================================================================
// LOCATION CONFIGS
// =============================================================================

// Reservoir label configs: coordinates and vertical stagger to avoid overlap
// All arms use consistent 60° angle pointing up-right from coordinate to label
interface ReservoirConfig {
  coordinates: [number, number]
  staggerIndex: number // 0, 1, 2... for vertical spacing
}

const RESERVOIR_CONFIGS: Record<string, ReservoirConfig> = {
  "Trinity Lake": { coordinates: [-122.68, 40.98], staggerIndex: 0 },
  "Shasta Lake": { coordinates: [-122.23, 40.78], staggerIndex: 1 },
  "Lake Oroville": { coordinates: [-121.44, 39.56], staggerIndex: 0 },
  "Folsom Lake": { coordinates: [-121.12, 38.76], staggerIndex: 1 },
  "New Melones Lake": { coordinates: [-120.53, 37.98], staggerIndex: 0 },
  "San Luis Reservoir": { coordinates: [-121.13, 37.08], staggerIndex: 1 },
  "Millerton Lake": { coordinates: [-119.66, 37.01], staggerIndex: 0 },
}

// Consistent arm geometry (60° angle from ground, label above-right of coordinate)
const ARM_CONFIG = {
  // Label offset from coordinate anchor
  baseOffset: [20, -35] as [number, number],
  staggerStep: 25, // vertical spacing between stagger levels
  // SVG line geometry (arm from label down-left to coordinate)
  lineLength: 40,
  angle: 60, // degrees from horizontal (ground)
}

// Station coordinates by location_id (from API)
const STATION_COORDINATES: Record<string, [number, number]> = {
  // Compliance stations (in-Delta uses)
  EM: [-121.742, 38.0802], // Emmaton
  JP: [-121.685, 38.0519], // Jersey Point
  // Pumping plants (Delta exports) - coordinates from API
  CAA003: [-121.6209, 37.8007], // Banks Pumping Plant
  DMC000: [-121.5854, 37.7967], // Jones Pumping Plant
}

// Station display names by location_id (from API)
const STATION_NAMES: Record<string, string> = {
  EM: "Emmaton (Salinity) Compliance Station",
  JP: "Jersey Point (Salinity) Compliance Station",
  CAA003: "Banks Pumping Plant",
  DMC000: "Jones Pumping Plant",
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
  staggerIndex?: number
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

export function TierLocationLabels({
  tierLookup,
  data,
}: TierLocationLabelsProps) {
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
    // Reservoir mode: use config with consistent arm angles
    const seenNames = new Set<string>()
    Object.entries(tierLookup).forEach(([calsimId, tier]) => {
      const name = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
      if (!name || seenNames.has(name)) return
      seenNames.add(name)

      const config = RESERVOIR_CONFIGS[name]
      if (config) {
        locations.push({
          id: calsimId,
          name,
          tier,
          longitude: config.coordinates[0],
          latitude: config.coordinates[1],
          staggerIndex: config.staggerIndex,
        })
      }
    })
  } else if (data) {
    // DEBUG: Log what the API returns
    console.log(
      "TierLocationLabels - API data:",
      data.features.map((f) => ({
        location_id: f.properties.location_id,
        location_name: f.properties.location_name,
        tier_level: f.properties.tier_level,
      })),
    )
    console.log(
      "TierLocationLabels - Available station IDs:",
      Object.keys(STATION_COORDINATES),
    )

    // Station mode: use hardcoded coordinates, only tier from API
    locations = data.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => {
        const locationId = f.properties.location_id
        const coords = STATION_COORDINATES[locationId]

        console.log(
          `TierLocationLabels - Looking up ${locationId}: found=${!!coords}`,
        )

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

  // Calculate consistent arm line endpoints (60° angle from ground)
  const angleRad = (ARM_CONFIG.angle * Math.PI) / 180
  const armDx = Math.cos(angleRad) * ARM_CONFIG.lineLength
  const armDy = Math.sin(angleRad) * ARM_CONFIG.lineLength

  return (
    <>
      {locations.map((location, index) => {
        // Use staggerIndex if available (reservoirs), otherwise use index
        const stagger = location.staggerIndex ?? index % 2
        const verticalOffset =
          -ARM_CONFIG.baseOffset[1] - stagger * ARM_CONFIG.staggerStep
        const offset: [number, number] = [
          ARM_CONFIG.baseOffset[0],
          -verticalOffset,
        ]

        return (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom-left"
            offset={offset}
          >
            <div style={{ position: "relative", pointerEvents: "none" }}>
              {/* Leader line with consistent 60° angle from label down to coordinate */}
              <svg
                style={{
                  position: "absolute",
                  left: -armDx,
                  top: 0,
                  width: armDx + 5,
                  height: armDy + 20,
                  overflow: "visible",
                }}
              >
                <line
                  x1={armDx}
                  y1={10}
                  x2={0}
                  y2={10 + armDy}
                  stroke={`${theme.palette.common.white}CC`}
                  strokeWidth="1.5"
                />
              </svg>
              {/* Label */}
              <div
                style={{
                  ...theme.typography.compactMicro,
                  backgroundColor: getTierColor(location.tier),
                  color: theme.palette.common.white,
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
