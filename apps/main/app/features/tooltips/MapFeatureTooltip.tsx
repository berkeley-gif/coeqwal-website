"use client"

/**
 * Geo-positioned tooltip for map features (polygons and points).
 * Supports hover and click-to-pin modes with layer-specific content.
 */

import React from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { TooltipCloseButton } from "@repo/ui"
import { Popup } from "@repo/map"
import type { HoveredFeatureInfo } from "../map/visualizationLayers"

export interface MapFeatureTooltipProps {
  feature: HoveredFeatureInfo
  isPinned: boolean
  onClose: () => void
}

function TierBadge({ level, label }: { level: number; label: string }) {
  const theme = useTheme()

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: theme.spacingTokens.gap.sm }}>
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

function WBATooltipContent({ feature }: { feature: HoveredFeatureInfo }) {
  const theme = useTheme()

  return (
    <>
      {feature.locationName && (
        <Typography
          variant="tooltipHeader"
          sx={{
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
          mb: theme.spacingTokens.component.sm,
        }}
      >
        WBA ID: {feature.featureId}
      </Typography>
    </>
  )
}

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
          variant="tooltipHeader"
          sx={{
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
          mb: theme.spacingTokens.component.sm,
        }}
      >
        CalSim ID: {feature.featureId}
      </Typography>
    </>
  )
}

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
          variant="tooltipHeader"
          sx={{
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
            mb: theme.spacingTokens.component.sm,
          }}
        >
          {feature.locationType}
        </Typography>
      )}
    </>
  )
}

export function MapFeatureTooltip({
  feature,
  isPinned,
  onClose,
}: MapFeatureTooltipProps) {
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
        {isPinned && <TooltipCloseButton onClick={onClose} offset={{ top: 0, right: 0 }} />}
        {renderContent()}
        <TierBadge level={feature.tierLevel} label={feature.tierLabel} />
      </Box>
    </Popup>
  )
}

export default MapFeatureTooltip

