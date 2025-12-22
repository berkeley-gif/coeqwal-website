"use client"

/**
 * PolygonLayerTooltip component
 *
 * A reusable tooltip component for polygon map layers (demand-units, WBA, etc.)
 * for tooltip rendering across PersistentMap and CaliforniaMapPanel.
 *
 * Features:
 * - Supports hover and pinned (click-to-pin) modes
 * - Renders appropriate fields based on layer type
 * - Includes tier badge with color indicator
 * - Close button for pinned tooltips
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { Popup } from "@repo/map"
import type { HoveredFeatureInfo } from "../map/hooks/useOutcomeMapLayer"

export interface PolygonLayerTooltipProps {
  /** Feature data to display */
  feature: HoveredFeatureInfo
  /** Whether the tooltip is pinned (clicked) vs hovered */
  isPinned: boolean
  /** Callback to close/clear the pinned tooltip */
  onClose: () => void
}

/**
 * Close button component for pinned tooltips
 */
function CloseButton({ onClick }: { onClick: () => void }) {
  const theme = useTheme()

  return (
    <Box
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      sx={{
        position: "absolute",
        top: 4,
        right: 4,
        cursor: "pointer",
        width: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: theme.borderRadius.circle,
        "&:hover": {
          backgroundColor: "rgba(0,0,0,0.1)",
        },
      }}
    >
      <Typography
        sx={{ fontSize: "14px", lineHeight: 1, color: theme.palette.grey[500] }}
      >
        ×
      </Typography>
    </Box>
  )
}

/**
 * Tier badge component showing tier level with color indicator
 */
function TierBadge({ level, label }: { level: number; label: string }) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: theme.borderRadius.xs,
          backgroundColor:
            theme.palette.tiers[
              `tier${level}` as keyof typeof theme.palette.tiers
            ],
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
        <strong>Tier {level}:</strong> {label}
      </Typography>
    </Box>
  )
}

/**
 * WBA (Water Budget Area) layer tooltip content
 */
function WBATooltipContent({ feature }: { feature: HoveredFeatureInfo }) {
  const theme = useTheme()

  return (
    <>
      {feature.locationName && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: theme.palette.blue.darkest,
            mb: 0.5,
          }}
        >
          {feature.locationName}
        </Typography>
      )}

      {feature.hydroRegion && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.grey[600], mb: 0.5 }}
        >
          Region: {feature.hydroRegion}
        </Typography>
      )}

      {feature.gisAcres && (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[600],
            display: "block",
            mb: 0.5,
          }}
        >
          Area: {feature.gisAcres.toLocaleString()} acres
        </Typography>
      )}

      <Typography
        variant="caption"
        sx={{
          color: theme.palette.grey[500],
          display: "block",
          mb: 1,
        }}
      >
        WBA ID: {feature.featureId}
      </Typography>
    </>
  )
}

/**
 * Demand Units layer tooltip content
 */
function DemandUnitsTooltipContent({
  feature,
}: {
  feature: HoveredFeatureInfo
}) {
  const theme = useTheme()

  // Compute primary and secondary names based on class type
  const isUrban = feature.classType === "Urban"
  const primaryName =
    isUrban && feature.urbName ? feature.urbName : feature.modName
  const secondaryName =
    isUrban && feature.urbName && feature.modName ? feature.modName : null

  return (
    <>
      {primaryName && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: theme.palette.blue.darkest,
            mb: 0.5,
          }}
        >
          {primaryName}
        </Typography>
      )}

      {secondaryName && (
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[700],
            mb: 0.5,
          }}
        >
          {secondaryName}
        </Typography>
      )}

      {feature.subName && (
        <Typography
          variant="body2"
          sx={{ color: theme.palette.grey[600], mb: 0.5 }}
        >
          {feature.subName}
        </Typography>
      )}

      {feature.comments && (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[600],
            display: "block",
            mb: 0.5,
            lineHeight: 1.3,
          }}
        >
          {feature.comments}
        </Typography>
      )}

      {feature.type && (
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.grey[600],
            display: "block",
            mb: 0.5,
          }}
        >
          {feature.type}
        </Typography>
      )}

      <Typography
        variant="caption"
        sx={{
          color: theme.palette.grey[500],
          display: "block",
          mb: 1,
        }}
      >
        CalSim ID: {feature.featureId}
      </Typography>
    </>
  )
}

/**
 * Main tooltip component for polygon map layers
 *
 * Renders a Mapbox Popup with feature information based on layer type.
 * Supports both hover and pinned (click-to-stay) modes.
 */
export function PolygonLayerTooltip({
  feature,
  isPinned,
  onClose,
}: PolygonLayerTooltipProps) {
  return (
    <Popup
      longitude={feature.longitude}
      latitude={feature.latitude}
      anchor="bottom"
      closeButton={false}
      // Don't use closeOnClick - it conflicts with click-to-pin behavior
      // The pinned tooltip is closed via the X button or by clicking another polygon
      closeOnClick={false}
      onClose={onClose}
      offset={15}
    >
      <Box sx={{ p: 1.5, minWidth: 200, maxWidth: 300, position: "relative" }}>
        {/* Close button for pinned tooltips */}
        {isPinned && <CloseButton onClick={onClose} />}

        {/* Layer-specific content */}
        {feature.layerType === "wba" ? (
          <WBATooltipContent feature={feature} />
        ) : (
          <DemandUnitsTooltipContent feature={feature} />
        )}

        {/* Tier badge (always present) */}
        <TierBadge level={feature.tierLevel} label={feature.tierLabel} />
      </Box>
    </Popup>
  )
}

export default PolygonLayerTooltip
