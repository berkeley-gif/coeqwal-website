"use client"

/**
 * MapFeatureTooltip - Tooltip for map features (polygons and points)
 *
 * A reusable tooltip component for map features (demand-units, WBA, environmental flows, etc.)
 *
 * ## When to Use
 *
 * Use MapFeatureTooltip for map features where:
 * - Geographic positioning (lat/lng) is required (uses Mapbox Popup)
 * - Both hover and click-to-pin interactions are needed
 * - Layer-specific content rendering is required
 *
 * For non-map tooltips, use:
 * - HybridTooltip: Hover on desktop, click on touch (general purpose)
 * - ClickTooltip: Always click-to-open
 * - MapMarkerTooltip: Simple map marker hover hints (not geo-positioned)
 *
 * ## Features
 *
 * - Supports hover and pinned (click-to-pin) modes
 * - Renders appropriate fields based on layer type
 * - Includes tier badge with color indicator
 * - Close button for pinned tooltips
 *
 * @see MapMarkerTooltip - For simple map marker tooltips (not geo-positioned)
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import { Popup } from "@repo/map"
import type { HoveredFeatureInfo } from "../map/visualizationLayers"

export interface MapFeatureTooltipProps {
  /** Feature data to display */
  feature: HoveredFeatureInfo
  /** Whether the tooltip is pinned (clicked) vs hovered */
  isPinned: boolean
  /** Callback to close/clear the pinned tooltip */
  onClose: () => void
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
          width: 10,
          height: 10,
          borderRadius: theme.borderRadius.xs,
          backgroundColor:
            theme.palette.tiers[
              `tier${level}` as keyof typeof theme.palette.tiers
            ],
          flexShrink: 0,
        }}
      />
      <Typography variant="dashboard">
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
          variant="dashboard"
          sx={{
            fontWeight: theme.typography.fontWeightSemiBold,
            color: theme.palette.blue.darkest,
            mb: 0.5,
          }}
        >
          {feature.locationName}
        </Typography>
      )}

      {feature.hydroRegion && (
        <Typography
          variant="dashboard"
          sx={{ color: theme.palette.grey[600], mb: 0.5 }}
        >
          Region: {feature.hydroRegion}
        </Typography>
      )}

      {feature.gisAcres && (
        <Typography
          variant="compactCaption"
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
        variant="compactCaption"
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
          variant="dashboard"
          sx={{
            fontWeight: theme.typography.fontWeightSemiBold,
            color: theme.palette.blue.darkest,
            mb: 0.5,
          }}
        >
          {primaryName}
        </Typography>
      )}

      {secondaryName && (
        <Typography
          variant="dashboard"
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
          variant="dashboard"
          sx={{ color: theme.palette.grey[600], mb: 0.5 }}
        >
          {feature.subName}
        </Typography>
      )}

      {feature.comments && (
        <Typography
          variant="compactCaption"
          sx={{
            color: theme.palette.grey[600],
            display: "block",
            mb: 0.5,
          }}
        >
          {feature.comments}
        </Typography>
      )}

      {feature.type && (
        <Typography
          variant="compactCaption"
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
        variant="compactCaption"
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
 * Point marker (environmental flows, etc.) tooltip content
 */
function PointMarkerTooltipContent({
  feature,
}: {
  feature: HoveredFeatureInfo
}) {
  const theme = useTheme()

  return (
    <>
      {feature.locationName && (
        <Typography
          variant="dashboard"
          sx={{
            fontWeight: theme.typography.fontWeightSemiBold,
            color: theme.palette.blue.darkest,
            mb: 0.5,
          }}
        >
          {feature.locationName}
        </Typography>
      )}

      {feature.locationType && (
        <Typography
          variant="compactCaption"
          sx={{
            color: theme.palette.grey[600],
            display: "block",
            mb: 1,
          }}
        >
          {feature.locationType}
        </Typography>
      )}
    </>
  )
}

/**
 * Main tooltip component for map features
 *
 * Renders a Mapbox Popup with feature information based on layer type.
 * Supports both hover and pinned (click-to-stay) modes.
 */
export function MapFeatureTooltip({
  feature,
  isPinned,
  onClose,
}: MapFeatureTooltipProps) {
  // Determine content renderer based on layer type
  const renderContent = () => {
    switch (feature.layerType) {
      case "wba":
        return <WBATooltipContent feature={feature} />
      case "demand-units":
        return <DemandUnitsTooltipContent feature={feature} />
      case "point":
        return <PointMarkerTooltipContent feature={feature} />
      default:
        return <DemandUnitsTooltipContent feature={feature} />
    }
  }

  return (
    <Popup
      longitude={feature.longitude}
      latitude={feature.latitude}
      anchor="bottom"
      closeButton={false}
      // Don't use closeOnClick - it conflicts with click-to-pin behavior
      // The pinned tooltip is closed via the X button or by clicking another feature
      closeOnClick={false}
      onClose={onClose}
      offset={15}
    >
      <Box
        sx={{
          p: (theme) => theme.spacing(theme.spacingTokens.component.md),
          minWidth: 200,
          maxWidth: 300,
          position: "relative",
        }}
      >
        {/* Close button for pinned tooltips */}
        {isPinned && <TooltipCloseButton onClick={onClose} offset={{ top: 0, right: 0 }} />}

        {/* Layer-specific content */}
        {renderContent()}

        {/* Tier badge (always present) */}
        <TierBadge level={feature.tierLevel} label={feature.tierLabel} />
      </Box>
    </Popup>
  )
}

export default MapFeatureTooltip

