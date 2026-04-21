"use client"

/**
 * TierMarkers - Map markers showing tier data by location
 *
 * Displays markers on the map for each location with tier data.
 * Uses lightweight tier assignments (no geometry) with hardcoded coordinates.
 * Reports hover/click events to parent for unified tooltip handling.
 */

import React from "react"
import { Marker } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import type { TierLocation } from "../types"
import type { HoveredFeatureInfo } from "../types"
import { getTierLabel } from "../../../../content/tiers"
import {
  ENV_FLOWS_COORDINATES,
  ENV_FLOWS_NAMES,
} from "../../config/outcomeLocations"

// =============================================================================
// COMPONENT
// =============================================================================

interface TierMarkersProps {
  locations: TierLocation[]
  tierCode: string
  onHover?: (feature: HoveredFeatureInfo | null) => void
  onClick?: (feature: HoveredFeatureInfo) => void
  highlightedIds?: Set<string>
}

export default function TierMarkers({
  locations,
  tierCode,
  onHover,
  onClick,
  highlightedIds,
}: TierMarkersProps) {
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

  const isDiamond = tierCode === "ENV_FLOWS"

  const buildFeatureInfo = (
    loc: TierLocation,
    lng: number,
    lat: number,
  ): HoveredFeatureInfo => ({
    longitude: lng,
    latitude: lat,
    geometryType: "point",
    layerType: "point",
    featureId: loc.location_id,
    tierLevel: loc.tier_level,
    tierLabel: getTierLabel(loc.tier_level),
    tierValue: loc.tier_value ?? 0,
    locationName: loc.location_name,
    locationType: "Environmental Flow",
    properties: { ...loc },
    urbName: null,
    modName: null,
    subName: null,
    comments: null,
    type: null,
    classType: null,
    hydroRegion: null,
    gisAcres: null,
  })

  return (
    <>
      {locations.map((loc) => {
        const coords = ENV_FLOWS_COORDINATES[loc.location_id]
        if (!coords) return null

        const [lng, lat] = coords
        const name = ENV_FLOWS_NAMES[loc.location_id] || loc.location_name
        const featureInfo = buildFeatureInfo(
          { ...loc, location_name: name },
          lng,
          lat,
        )

        const isHighlighted = highlightedIds?.has(loc.location_id) ?? false
        const goldAccent = theme.palette.accent.glossary

        return (
          <Marker
            key={loc.location_id}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <div
              style={{
                width: isHighlighted ? 26 : 20,
                height: isHighlighted ? 26 : 20,
                backgroundColor: getTierColor(loc.tier_level),
                border: isHighlighted
                  ? `3px solid ${goldAccent}`
                  : isDiamond
                    ? `2px solid ${theme.palette.common.white}E6`
                    : theme.border.onDark,
                boxShadow: isHighlighted
                  ? `0 2px 6px rgba(0,0,0,0.5)`
                  : theme.shadow.sm,
                cursor: "pointer",
                borderRadius: isDiamond
                  ? theme.borderRadius.xs
                  : theme.borderRadius.circle,
                transform: isDiamond ? "scale(0.5, 1) rotate(45deg)" : "none",
                transformOrigin: "center",
                transition:
                  "width 0.15s, height 0.15s, border 0.15s, box-shadow 0.15s",
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
