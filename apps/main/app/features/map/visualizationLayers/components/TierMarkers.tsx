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

// =============================================================================
// COORDINATE LOOKUPS (fixed physical locations)
// =============================================================================

const ENV_FLOWS_COORDINATES: Record<string, [number, number]> = {
  AMR004: [-121.44652, 38.58742],
  TRN111: [-122.80357, 40.71986],
  FTR029: [-121.60595, 39.13874],
  FTR003: [-121.64106, 38.82422],
  MOK028: [-121.33569, 38.19941],
  MCD005: [-120.93038, 37.37076],
  SAC000: [-121.89059, 38.04598],
  SAC049: [-121.50203, 38.4557],
  SAC122: [-121.82241, 39.02399],
  SAC148: [-121.9983, 39.23212],
  SAC257: [-122.1869, 40.28875],
  SJR127: [-120.89662, 37.29453],
  SAC289: [-122.35625, 40.53738],
  SJR070: [-121.26529, 37.67577],
  STS011: [-121.1642, 37.70396],
  TUO003: [-121.14185, 37.60423],
  YUB002: [-121.5773, 39.14433],
}

const ENV_FLOWS_NAMES: Record<string, string> = {
  AMR004: "American River at I-80 Bridge",
  TRN111: "Trinity River at Lewiston",
  FTR029: "Feather River at Yuba City",
  FTR003: "Feather River",
  MOK028: "Mokelumne River",
  MCD005: "Merced River at Stevinson",
  SAC000: "Sacramento at confluence",
  SAC049: "Sacramento River at Freeport",
  SAC122: "Sacramento River at Tisdale Weir",
  SAC148: "Sacramento River at Colusa Weir",
  SAC257: "Sacramento River above Bend Bridge",
  SJR127: "San Joaquin at Salt Slough",
  SAC289: "Sacramento River (South Bonnieville)",
  SJR070: "San Joaquin near Vernalis",
  STS011: "Stanislaus River",
  TUO003: "Tuolumne River",
  YUB002: "Yuba River at Marysville",
}

// =============================================================================
// COMPONENT
// =============================================================================

interface TierMarkersProps {
  locations: TierLocation[]
  tierCode: string
  onHover?: (feature: HoveredFeatureInfo | null) => void
  onClick?: (feature: HoveredFeatureInfo) => void
}

export default function TierMarkers({
  locations,
  tierCode,
  onHover,
  onClick,
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

        return (
          <Marker
            key={loc.location_id}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <div
              style={{
                width: 20,
                height: 20,
                backgroundColor: getTierColor(loc.tier_level),
                border: isDiamond
                  ? `2px solid ${theme.palette.common.white}E6`
                  : theme.border.onDark,
                boxShadow: theme.shadow.sm,
                cursor: "pointer",
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
