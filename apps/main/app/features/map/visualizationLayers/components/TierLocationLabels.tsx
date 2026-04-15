"use client"

/**
 * TierLocationLabels - Unified labeled markers for tier-based locations
 *
 * Handles reservoirs, pumping plants, compliance stations, and other
 * point-based tier visualizations with consistent styling.
 */

import React from "react"
import { Marker, MAP_THEME_URLS } from "@repo/map"
import { useTheme } from "@repo/ui/mui"
import { useMapStyle } from "../../store"
import { RESERVOIR_CALSIM_TO_GNISIDLABEL } from "../../config/outcomeLayerRegistry"
import {
  RESERVOIR_CONFIGS,
  STATION_COORDINATES,
  STATION_NAMES,
} from "../../config/outcomeLocations"
import type { TierLocation } from "../types"

const ARM_CONFIG = {
  baseOffset: [20, -35] as [number, number],
  staggerStep: 25,
  lineLength: 40,
  angle: 60,
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
  /** Plain location items from the /locations endpoint. Coordinates come from STATION_COORDINATES. */
  locationItems?: TierLocation[]
  highlightedIds?: Set<string>
  onHover?: (info: { id: string; name: string; tier: number } | null) => void
  onClick?: (info: { id: string; name: string; tier: number }) => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TierLocationLabels({
  tierLookup,
  locationItems,
  highlightedIds,
  onHover,
  onClick,
}: TierLocationLabelsProps) {
  const theme = useTheme()
  const mapStyle = useMapStyle()
  const isSatellite = mapStyle === MAP_THEME_URLS.satellite

  const leaderLineColor = isSatellite
    ? `${theme.palette.common.white}CC`
    : `${theme.palette.text.primary}99`

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
  } else if (locationItems) {
    // Station mode: coordinates from hardcoded STATION_COORDINATES lookup
    locations = locationItems
      .map((loc) => {
        const coords = STATION_COORDINATES[loc.location_id]
        if (!coords) return null
        return {
          id: loc.location_id,
          name: STATION_NAMES[loc.location_id] || loc.location_name,
          tier: loc.tier_level,
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

        const isHighlighted =
          highlightedIds?.has(location.id) ||
          highlightedIds?.has(location.name) ||
          false
        const goldAccent = "#ffd87e"

        return (
          <Marker
            key={location.id}
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom-left"
            offset={offset}
          >
            <div
              style={{
                position: "relative",
                pointerEvents: onHover || onClick ? "auto" : "none",
                cursor: onClick ? "pointer" : undefined,
              }}
              onMouseEnter={() =>
                onHover?.({
                  id: location.id,
                  name: location.name,
                  tier: location.tier,
                })
              }
              onMouseLeave={() => onHover?.(null)}
              onClick={() =>
                onClick?.({
                  id: location.id,
                  name: location.name,
                  tier: location.tier,
                })
              }
            >
              {/* Leader line */}
              <svg
                style={{
                  position: "absolute",
                  left: -armDx,
                  top: 0,
                  width: armDx + 5,
                  height: armDy + 20,
                  overflow: "visible",
                  pointerEvents: "none",
                }}
              >
                <line
                  x1={armDx}
                  y1={10}
                  x2={0}
                  y2={10 + armDy}
                  stroke={isHighlighted ? goldAccent : leaderLineColor}
                  strokeWidth={isHighlighted ? "2" : "1.5"}
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
                  boxShadow: isHighlighted
                    ? `0 2px 6px rgba(0,0,0,0.5)`
                    : theme.shadow.subtle,
                  border: isHighlighted
                    ? `2px solid ${goldAccent}`
                    : theme.border.subtleOutline,
                  transition: "border 0.15s, box-shadow 0.15s",
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
