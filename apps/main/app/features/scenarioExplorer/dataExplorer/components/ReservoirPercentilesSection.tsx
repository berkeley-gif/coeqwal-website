"use client"

/**
 * ReservoirPercentilesSection - Matrix visualization for reservoir percentiles
 *
 * Displays a matrix with scenarios as columns and reservoirs as rows.
 * Uses shared axes for efficient comparison across all combinations.
 * Supports both percentage of capacity and absolute TAF display modes.
 */

import React, { useState, useEffect } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { PercentileMatrix } from "@repo/viz"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import type { ReservoirData } from "@repo/viz"
import type { MonthlyPercentiles } from "@repo/data/coeqwal"
import {
  useStorageMonthly,
  useMultipleReservoirPercentiles,
  useGroupedReservoirPercentiles,
} from "@repo/data/coeqwal/hooks"

export type StorageDisplayMode = "percentage" | "volume"
export type VolumeScaleMode = "absolute" | "relative"

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
  /** Y-axis scale mode for volume display: absolute (shared) or relative (per-reservoir) */
  volumeScaleMode?: VolumeScaleMode
  /** Additional reservoir IDs to display (beyond the major group) */
  additionalReservoirs?: string[]
}

/**
 * Helper to convert percentage percentiles to TAF using capacity
 */
function convertPercentToTaf(
  percentData: MonthlyPercentiles,
  capacityTaf: number,
): MonthlyPercentiles {
  const tafData: MonthlyPercentiles = {}
  Object.entries(percentData).forEach(([month, values]) => {
    tafData[month] = {
      q0: (values.q0 * capacityTaf) / 100,
      q10: (values.q10 * capacityTaf) / 100,
      q30: (values.q30 * capacityTaf) / 100,
      q50: (values.q50 * capacityTaf) / 100,
      q70: (values.q70 * capacityTaf) / 100,
      q90: (values.q90 * capacityTaf) / 100,
      q100: (values.q100 * capacityTaf) / 100,
      mean: (values.mean * capacityTaf) / 100,
    }
  })
  return tafData
}

/**
 * Hook to fetch reservoir data for multiple scenarios
 * Uses the storage-monthly endpoint which provides both percentage and TAF data
 * Also fetches dead pool metadata from grouped percentiles endpoint
 */
function useMultiScenarioReservoirData(
  scenarioIds: string[],
  displayMode: StorageDisplayMode,
) {
  const results = scenarioIds.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useStorageMonthly(scenarioId, "major")
  })

  // Fetch dead pool metadata from grouped percentiles (using first scenario)
  // The dead pool values are the same across scenarios, so we only need one fetch
  const firstScenarioId = scenarioIds[0] ?? null
  const { reservoirs: groupedReservoirs, isLoading: deadPoolLoading } =
    useGroupedReservoirPercentiles(firstScenarioId, "major")

  // Build dead pool lookup from grouped percentiles response
  const deadPoolLookup: Record<string, number> = {}
  Object.entries(groupedReservoirs).forEach(([reservoirId, data]) => {
    deadPoolLookup[reservoirId] = data.dead_pool_taf ?? 0
  })

  const isLoading = results.some((r) => r.isLoading) || deadPoolLoading
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

      // Build reservoir info with dead pool from grouped percentiles lookup
      if (!reservoirMap[reservoirId]) {
        reservoirMap[reservoirId] = {
          reservoirId: reservoirId,
          reservoirName: data.name ?? reservoirId,
          capacityTaf: data.capacity_taf ?? 0,
          deadPoolTaf: deadPoolLookup[reservoirId] ?? 0,
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

  // Track which scenarios are still loading
  const loadingScenarios = scenarioIds.filter(
    (_, index) => results[index]?.isLoading ?? false,
  )

  return { reservoirs, matrixData, isLoading, error, loadingScenarios }
}

/**
 * Hook to fetch data for additional (non-major) reservoirs
 * Uses the data package hook to avoid Rules of Hooks violations
 */
function useAdditionalReservoirData(
  scenarioIds: string[],
  additionalReservoirIds: string[],
  displayMode: StorageDisplayMode,
) {
  const { data, isLoading, error } = useMultipleReservoirPercentiles(
    scenarioIds,
    additionalReservoirIds,
  )

  // Build reservoir list and data structure from fetched data
  const reservoirMap: Record<string, ReservoirData> = {}
  const matrixData: Record<
    string,
    Record<string, MonthlyPercentiles | undefined>
  > = {}

  if (data) {
    Object.entries(data).forEach(([reservoirId, scenarioData]) => {
      Object.entries(scenarioData).forEach(([scenarioId, percentileData]) => {
        // Build reservoir info
        if (!reservoirMap[reservoirId]) {
          reservoirMap[reservoirId] = {
            reservoirId: reservoirId,
            reservoirName: percentileData.reservoir_name ?? reservoirId,
            capacityTaf: percentileData.capacity_taf ?? 0,
            deadPoolTaf: percentileData.dead_pool_taf ?? 0,
          }
        }

        // Build matrix data
        if (!matrixData[reservoirId]) {
          matrixData[reservoirId] = {}
        }

        // The individual endpoint returns percentage data
        // For volume mode, convert to TAF using capacity
        if (displayMode === "volume" && percentileData.monthly_percentiles) {
          matrixData[reservoirId][scenarioId] = convertPercentToTaf(
            percentileData.monthly_percentiles,
            percentileData.capacity_taf,
          )
        } else {
          matrixData[reservoirId][scenarioId] =
            percentileData.monthly_percentiles
        }
      })
    })
  }

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
  volumeScaleMode = "absolute",
  additionalReservoirs = [],
}: ReservoirPercentilesSectionProps) {
  const theme = useTheme()

  // Fetch major group data
  const {
    reservoirs: majorReservoirs,
    matrixData: majorMatrixData,
    error: majorError,
    loadingScenarios: majorLoadingScenarios,
  } = useMultiScenarioReservoirData(scenarios, displayMode)

  // Fetch additional reservoir data
  const {
    reservoirs: additionalReservoirData,
    matrixData: additionalMatrixData,
    error: additionalError,
  } = useAdditionalReservoirData(scenarios, additionalReservoirs, displayMode)

  // Merge reservoirs and data (additional reservoirs first, then major)
  const reservoirs = [...additionalReservoirData, ...majorReservoirs]
  const matrixData = { ...majorMatrixData, ...additionalMatrixData }
  const error = majorError || additionalError

  // Track when data first arrives to ensure skeleton shows on initial mount
  const [hasReceivedData, setHasReceivedData] = useState(false)
  useEffect(() => {
    if (reservoirs.length > 0) {
      setHasReceivedData(true)
    }
  }, [reservoirs.length])

  // Build scenario display names
  const scenarioNames: Record<string, string> = {}
  scenarios.forEach((id) => {
    scenarioNames[id] = id
  })

  // Loading state with skeleton - show until we've received data
  if (!hasReceivedData && !error) {
    return (
      <PercentileMatrixSkeleton
        scenarios={scenarios}
        rowCount={8}
        message="Loading reservoir data..."
        labelColumnWidth={labelColumnWidth}
      />
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

  // Calculate height based on number of reservoirs and scenarios
  // Fewer scenarios = taller rows (bigger charts)
  const rowHeight =
    scenarios.length <= 2
      ? 280 // Large charts for 1-2 scenarios
      : scenarios.length <= 4
        ? 230 // Medium charts for 3-4 scenarios
        : 190 // Compact charts for 5+ scenarios
  const matrixHeight = Math.max(500, reservoirs.length * rowHeight + 100)

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
          displayMode={displayMode}
          volumeScaleMode={volumeScaleMode}
          loadingScenarios={majorLoadingScenarios}
        />
      </Box>
    </Box>
  )
}
