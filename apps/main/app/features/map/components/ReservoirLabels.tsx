"use client"

/**
 * ReservoirLabels component
 *
 * Renders tier-colored labels for reservoirs on the map.
 * Uses React Markers.
 */

import React from "react"
import { Marker } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../config/outcomeLayerRegistry"

interface ReservoirLabel {
  name: string
  tier: number
  longitude: number
  latitude: number
}

interface ReservoirLabelsProps {
  /** Tier lookup: CalSim ID -> tier level */
  tierLookup: Record<string, number>
}

// Reservoir centroid coordinates (approximate centers for label placement)
const RESERVOIR_CENTROIDS: Record<string, [number, number]> = {
  "Shasta Lake": [-122.42, 40.72],
  "Lake Oroville": [-121.48, 39.54],
  "Folsom Lake": [-121.1, 38.72],
  "New Melones Lake": [-120.53, 37.95],
  "Millerton Lake": [-119.7, 37.0],
  "San Luis Reservoir": [-121.1, 37.06],
  "Trinity Lake": [-122.76, 40.95],
}

export function ReservoirLabels({ tierLookup }: ReservoirLabelsProps) {
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

  // Build unique reservoir labels (deduplicate SLUIS_CVP/SLUIS_SWP)
  const reservoirLabels: ReservoirLabel[] = []
  const seenNames = new Set<string>()

  Object.entries(tierLookup).forEach(([calsimId, tier]) => {
    const name = RESERVOIR_CALSIM_TO_GNISIDLABEL[calsimId]
    if (!name || seenNames.has(name)) return
    seenNames.add(name)

    const centroid = RESERVOIR_CENTROIDS[name]
    if (centroid) {
      reservoirLabels.push({
        name,
        tier,
        longitude: centroid[0],
        latitude: centroid[1],
      })
    }
  })

  if (reservoirLabels.length === 0) return null

  return (
    <>
      {reservoirLabels.map((label) => (
        <Marker
          key={label.name}
          longitude={label.longitude}
          latitude={label.latitude}
          anchor="bottom-left"
          offset={[20, -20]}
        >
          <div
            style={{
              backgroundColor: getTierColor(label.tier),
              color: "#ffffff",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.3)",
              pointerEvents: "none",
            }}
          >
            {label.name}
          </div>
        </Marker>
      ))}
    </>
  )
}

export default ReservoirLabels
