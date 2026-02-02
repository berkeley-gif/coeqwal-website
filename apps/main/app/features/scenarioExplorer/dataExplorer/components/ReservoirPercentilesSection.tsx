"use client"

/**
 * ReservoirPercentilesSection - Matrix visualization for reservoir percentiles
 *
 * Displays a matrix with scenarios as columns and reservoirs as rows.
 * Uses shared axes for efficient comparison across all combinations.
 * Supports both percentage of capacity and absolute TAF display modes.
 */

import React from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { PercentileMatrix } from "@repo/viz"
import type { ReservoirData } from "@repo/viz"
import type { MonthlyPercentiles } from "@repo/data/coeqwal"
import { useStorageMonthly } from "@repo/data/coeqwal/hooks"
import { useChartGridLayout, CHART_GRID } from "./ChartGridContext"

export type StorageDisplayMode = "percentage" | "volume"

interface ReservoirPercentilesSectionProps {
  scenarios: string[]
  /** Width of left label column (for alignment with other sections) */
  labelColumnWidth?: number
  /** Whether to show scenario headers (set false if parent shows them) */
  showScenarioHeaders?: boolean
  /** Map of scenarioId -> reservoirId -> tier color (for coloring individual cells) */
  cellColors?: Record<string, Record<string, string>>
  /** Display mode: percentage of capacity or volume in TAF */
  displayMode?: StorageDisplayMode
}

/**
 * Hook to fetch reservoir data for multiple scenarios
 * Uses the storage-monthly endpoint which provides both percentage and TAF data
 */
function useMultiScenarioReservoirData(
  scenarioIds: string[],
  displayMode: StorageDisplayMode,
) {
  const results = scenarioIds.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStorageMonthly(scenarioId, "major")
  })

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error ?? null

  // Build reservoir list and data structure for matrix
  const reservoirMap: Record<string, ReservoirData> = {}
  const matrixData: Record<
    string,
    Record<string, MonthlyPercentiles | undefined>
  > = {}

  results.forEach((result, index) => {
    const scenarioId = scenarioIds[index]
    if (!scenarioId || !result.reservoirs) return

    Object.entries(result.reservoirs).forEach(([reservoirId, data]) => {
      if (!data) return

      // Build reservoir info
      if (!reservoirMap[reservoirId]) {
        reservoirMap[reservoirId] = {
          reservoirId: reservoirId,
          reservoirName: data.name ?? reservoirId,
          capacityTaf: data.capacity_taf ?? 0,
          deadPoolTaf: 0, // storage-monthly doesn't include dead_pool_taf
        }
      }

      // Build matrix data: reservoirId -> scenarioId -> percentile data
      // Select appropriate data based on display mode
      if (!matrixData[reservoirId]) {
        matrixData[reservoirId] = {}
      }
      matrixData[reservoirId][scenarioId] =
        displayMode === "volume" ? data.monthly_taf : data.monthly_percent
    })
  })

  // Convert to sorted array
  const reservoirs = Object.values(reservoirMap).sort((a, b) =>
    (a.reservoirName ?? "").localeCompare(b.reservoirName ?? ""),
  )

  return { reservoirs, matrixData, isLoading, error }
}

export default function ReservoirPercentilesSection({
  scenarios,
  labelColumnWidth = 100,
  showScenarioHeaders = true,
  cellColors,
  displayMode = "percentage",
}: ReservoirPercentilesSectionProps) {
  const theme = useTheme()
  const gridLayout = useChartGridLayout()

  const { reservoirs, matrixData, isLoading, error } =
    useMultiScenarioReservoirData(scenarios, displayMode)

  // When inside a grid context, don't constrain cell width - let the matrix expand to fill
  // Only apply maxCellWidth constraint when used standalone (no grid context)
  const maxCellWidth = gridLayout ? undefined : CHART_GRID.maxCellWidth

  // Build scenario display names
  const scenarioNames: Record<string, string> = {}
  scenarios.forEach((id) => {
    scenarioNames[id] = id
  })

  // Loading state
  if (isLoading && reservoirs.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: theme.space.section.md,
        }}
      >
        <CircularProgress size={20} sx={{ color: theme.palette.grey[300] }} />
        <Typography
          variant="compactCaption"
          sx={{
            ml: theme.space.component.md,
            color: theme.palette.grey[400],
          }}
        >
          Loading...
        </Typography>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          py: theme.space.component.lg,
          px: theme.space.component.md,
          backgroundColor: theme.palette.grey[50],
          borderRadius: theme.borderRadius.sm,
        }}
      >
        <Typography
          variant="compactCaption"
          sx={{
            display: "block",
            color: theme.palette.grey[500],
          }}
        >
          Could not load data: {error}
        </Typography>
      </Box>
    )
  }

  // No data available
  if (reservoirs.length === 0) {
    return (
      <Typography
        variant="compactCaption"
        sx={{
          display: "block",
          color: theme.palette.grey[400],
          fontStyle: "italic",
          textAlign: "center",
          py: theme.space.section.sm,
        }}
      >
        No data available for the selected scenarios.
      </Typography>
    )
  }

  // Calculate height based on number of reservoirs
  const matrixHeight = Math.max(500, reservoirs.length * 190 + 100)

  return (
    <Box>
      {/* Matrix visualization */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.sm,
          minHeight: matrixHeight,
        }}
      >
        <PercentileMatrix
          reservoirs={reservoirs}
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          data={matrixData}
          responsive={true}
          height={matrixHeight}
          labelColumnWidth={labelColumnWidth}
          showScenarioHeaders={showScenarioHeaders}
          cellColors={cellColors}
          maxCellWidth={maxCellWidth}
          displayMode={displayMode}
        />
      </Box>
    </Box>
  )
}
