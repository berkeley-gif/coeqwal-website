"use client"

/**
 * TemporalControls - Time period and aggregation selectors
 *
 * Provides controls for selecting temporal range and aggregation
 * method in the Data Explorer.
 */

import React from "react"
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from "@repo/ui/mui"
import { ToggleChip } from "@repo/ui"
import type {
  TemporalScale,
  AggregationType,
} from "../config/outcomeDefinitions"

interface TemporalControlsProps {
  availableTemporal: TemporalScale[]
  availableAggregations: AggregationType[]
  selectedTemporal: TemporalScale
  selectedAggregation: AggregationType | null
  onTemporalChange: (temporal: TemporalScale) => void
  onAggregationChange: (aggregation: AggregationType | null) => void
  showDryYearsOnly: boolean
  onDryYearsToggle: () => void
}

/**
 * TemporalControls: Reusable temporal and aggregation controls
 * Used across Data Explorer views for filtering metric data
 */
export default function TemporalControls({
  availableTemporal,
  availableAggregations,
  selectedTemporal,
  selectedAggregation,
  onTemporalChange,
  onAggregationChange,
  showDryYearsOnly,
  onDryYearsToggle,
}: TemporalControlsProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        p: theme.space.component.lg,
        backgroundColor: theme.palette.grey[50],
        borderRadius: theme.borderRadius.md,
        border: theme.border.medium,
        display: "flex",
        flexDirection: "column",
        gap: theme.space.gap.lg,
      }}
    >
      <Typography variant="subtitle2">Temporal Controls</Typography>

      {/* Temporal scale selector */}
      <FormControl fullWidth size="small">
        <InputLabel>Time scale</InputLabel>
        <Select
          value={selectedTemporal}
          label="Time scale"
          onChange={(e) => onTemporalChange(e.target.value as TemporalScale)}
        >
          {availableTemporal.map((scale) => (
            <MenuItem key={scale} value={scale}>
              {formatTemporalScale(scale)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Aggregation type selector */}
      {availableAggregations.length > 0 && (
        <FormControl fullWidth size="small">
          <InputLabel>Aggregation</InputLabel>
          <Select
            value={selectedAggregation || ""}
            label="Aggregation"
            onChange={(e) =>
              onAggregationChange(
                e.target.value ? (e.target.value as AggregationType) : null,
              )
            }
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {availableAggregations.map((agg) => (
              <MenuItem key={agg} value={agg}>
                {formatAggregationType(agg)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Dry years toggle */}
      {availableAggregations.includes("dry-years") && (
        <ToggleChip
          label="Dry years only"
          active={showDryYearsOnly}
          onClick={onDryYearsToggle}
          fullWidth
        />
      )}

      {/* Info */}
      <Typography
        variant="compactCaption"
        sx={{ color: theme.palette.grey[600] }}
      >
        {getTemporalInfo(selectedTemporal, selectedAggregation)}
      </Typography>
    </Box>
  )
}

/**
 * Format temporal scale for display
 */
function formatTemporalScale(scale: TemporalScale): string {
  const formats: Record<TemporalScale, string> = {
    monthly: "Monthly",
    annual: "Annual",
    "period-of-record": "Period of Record",
  }
  return formats[scale]
}

/**
 * Format aggregation type for display
 */
function formatAggregationType(agg: AggregationType): string {
  const formats: Record<AggregationType, string> = {
    "annual-average": "Annual Average",
    "annual-cv": "Annual CV (Coefficient of Variation)",
    "dry-years": "Dry Years Only",
    trend: "Trend",
    exceedance: "Exceedance (95th percentile)",
    minimum: "Minimum",
    maximum: "Maximum",
  }
  return formats[agg]
}

/**
 * Get informational text about the current temporal selection
 */
function getTemporalInfo(
  temporal: TemporalScale,
  aggregation: AggregationType | null,
): string {
  const base = {
    monthly: "Data shown for each month of the simulation period",
    annual: "Data aggregated to annual values",
    "period-of-record": "Data summarized across the entire simulation period",
  }[temporal]

  if (!aggregation) return base

  const aggInfo = {
    "annual-average": " - Average of annual values",
    "annual-cv": " - Variability (CV) of annual values",
    "dry-years": " - Filtered to dry years only",
    trend: " - Trend analysis over time",
    exceedance: " - 95% exceedance value",
    minimum: " - Minimum value",
    maximum: " - Maximum value",
  }[aggregation]

  return base + aggInfo
}
