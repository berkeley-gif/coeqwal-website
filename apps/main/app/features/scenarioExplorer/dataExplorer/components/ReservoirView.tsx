"use client"

/**
 * ReservoirView - Reservoir storage percentile charts
 *
 * Displays percentile band charts for each of the 8 major California reservoirs.
 * Shows monthly storage distribution across water years.
 *
 * Uses global scenario selection from the store - compares selected scenarios
 * side-by-side for each reservoir.
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Alert,
  Button,
} from "@repo/ui/mui"
import { PercentileBandChart } from "@repo/viz"
import type {
  MonthlyPercentiles,
  ReservoirPercentiles,
} from "@repo/data/coeqwal"
import { useAllReservoirPercentiles } from "@repo/data/coeqwal/hooks"
import { useScenarioExplorerStore } from "../../store"

/**
 * ScenarioCard - Individual scenario display with chart for one reservoir
 */
function ScenarioCard({
  scenarioId,
  scenarioName,
  percentileData,
  isLoading,
  colorScheme = "blues",
}: {
  scenarioId: string
  scenarioName: string
  percentileData?: MonthlyPercentiles
  isLoading?: boolean
  colorScheme?: "blues" | "greens" | "oranges"
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        p: theme.space.component.md,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 280,
      }}
    >
      {/* Scenario header */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: theme.typography.fontWeightMedium,
          color: theme.palette.text.primary,
          mb: theme.space.component.sm,
        }}
      >
        {scenarioName}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: theme.palette.grey[500], mb: theme.space.component.sm }}
      >
        {scenarioId}
      </Typography>

      {/* Chart */}
      <Box sx={{ flex: 1, minHeight: 200 }}>
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : percentileData ? (
          <PercentileBandChart
            data={percentileData}
            colorScheme={colorScheme}
            showMean={false}
            responsive={true}
            showLegend={false}
            margin={{ top: 10, right: 15, bottom: 35, left: 45 }}
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              backgroundColor: theme.palette.grey[100],
              borderRadius: theme.borderRadius.sm,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: theme.palette.grey[500], fontStyle: "italic" }}
            >
              No data available
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

/**
 * ReservoirSection - One reservoir with cards for all selected scenarios
 */
function ReservoirSection({
  reservoirId,
  reservoirName,
  capacityTaf,
  deadPoolTaf,
  scenarioData,
  scenarioNames,
  isLoading,
}: {
  reservoirId: string
  reservoirName: string
  capacityTaf: number
  deadPoolTaf: number
  scenarioData: Record<string, MonthlyPercentiles | undefined>
  scenarioNames: Record<string, string>
  isLoading: boolean
}) {
  const theme = useTheme()

  // Color schemes for different scenarios
  const colorSchemes: Array<"blues" | "greens" | "oranges"> = [
    "blues",
    "greens",
    "oranges",
  ]

  const scenarioIds = Object.keys(scenarioData)

  return (
    <Box
      sx={{
        mb: theme.space.section.md,
        p: theme.space.component.lg,
        backgroundColor: theme.palette.grey[50],
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
      }}
    >
      {/* Reservoir header */}
      <Box sx={{ mb: theme.space.component.lg }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: theme.typography.fontWeightMedium,
            color: theme.palette.text.primary,
          }}
        >
          {reservoirName}
        </Typography>
        <Box
          sx={{
            display: "flex",
            gap: theme.space.gap.xl,
            mt: theme.space.component.xs,
          }}
        >
          <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
            Capacity: <strong>{capacityTaf.toLocaleString()} TAF</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
            Dead pool: <strong>{deadPoolTaf.toLocaleString()} TAF</strong>
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.grey[500] }}>
            ID: {reservoirId}
          </Typography>
        </Box>
      </Box>

      {/* Scenario cards grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: scenarioIds.length === 1 ? "1fr" : "repeat(2, 1fr)",
            md:
              scenarioIds.length <= 2
                ? `repeat(${scenarioIds.length}, 1fr)`
                : "repeat(3, 1fr)",
            lg:
              scenarioIds.length <= 3
                ? `repeat(${scenarioIds.length}, 1fr)`
                : "repeat(4, 1fr)",
          },
          gap: theme.space.gap.lg,
        }}
      >
        {scenarioIds.map((scenarioId, index) => (
          <ScenarioCard
            key={scenarioId}
            scenarioId={scenarioId}
            scenarioName={scenarioNames[scenarioId] || scenarioId}
            percentileData={scenarioData[scenarioId]}
            isLoading={isLoading}
            colorScheme={colorSchemes[index % colorSchemes.length]}
          />
        ))}
      </Box>
    </Box>
  )
}

/**
 * Hook to fetch reservoir data for multiple scenarios
 */
function useMultiScenarioReservoirData(scenarioIds: string[]) {
  // Fetch data for each scenario in parallel using individual hooks
  // This approach works with SWR's caching
  const results = scenarioIds.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useAllReservoirPercentiles(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error ?? null

  // Combine data by reservoir
  const dataByReservoir: Record<
    string,
    {
      reservoirInfo: {
        reservoir_id: string
        reservoir_name: string
        capacity_taf: number
        dead_pool_taf: number
      }
      scenarioData: Record<string, MonthlyPercentiles | undefined>
    }
  > = {}

  results.forEach((result, index) => {
    const scenarioId = scenarioIds[index]
    if (!scenarioId || !result.reservoirs) return

    Object.entries(result.reservoirs).forEach(([reservoirId, data]) => {
      if (!dataByReservoir[reservoirId]) {
        dataByReservoir[reservoirId] = {
          reservoirInfo: {
            reservoir_id: data.reservoir_id,
            reservoir_name: data.reservoir_name,
            capacity_taf: data.capacity_taf,
            dead_pool_taf: data.dead_pool_taf,
          },
          scenarioData: {},
        }
      }
      dataByReservoir[reservoirId]!.scenarioData[scenarioId] =
        data.monthly_percentiles
    })
  })

  return { dataByReservoir, isLoading, error }
}

/**
 * ReservoirView - Main component showing all reservoir charts
 */
export default function ReservoirView() {
  const theme = useTheme()
  const { selectedScenarios, setMainView, setExploreMode } = useScenarioExplorerStore()

  // Fetch data for all selected scenarios
  const { dataByReservoir, isLoading, error } =
    useMultiScenarioReservoirData(selectedScenarios)

  // Build scenario display names
  const scenarioNames: Record<string, string> = {}
  selectedScenarios.forEach((id) => {
    scenarioNames[id] = id // Could enhance with lookup from useScenarios()
  })

  // Empty state when no scenarios selected
  if (selectedScenarios.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          p: theme.space.component.xl,
          textAlign: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{ color: theme.palette.grey[600], mb: theme.space.component.lg }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.grey[500],
            mb: theme.space.section.sm,
            maxWidth: theme.layout.maxWidth.md,
          }}
        >
          Select scenarios in &quot;Choose scenarios by summary&quot; to see
          reservoir storage comparisons.
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setMainView("explorer")
            setExploreMode("list")
          }}
          sx={{
            backgroundColor: theme.palette.blue.darkest,
            "&:hover": { backgroundColor: theme.palette.blue.bright },
          }}
        >
          Choose scenarios
        </Button>
      </Box>
    )
  }

  // Loading state
  if (isLoading && Object.keys(dataByReservoir).length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          py: theme.space.section.lg,
        }}
      >
        <CircularProgress />
        <Typography
          variant="body2"
          sx={{ ml: theme.space.component.lg, color: theme.palette.grey[600] }}
        >
          Loading reservoir data...
        </Typography>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: theme.space.component.xl }}>
        <Alert severity="error">Failed to load reservoir data: {error}</Alert>
      </Box>
    )
  }

  // Get reservoir IDs in consistent order
  const reservoirIds = Object.keys(dataByReservoir).sort()

  // No data available
  if (reservoirIds.length === 0) {
    return (
      <Box sx={{ p: theme.space.component.xl }}>
        <Alert severity="info">
          No reservoir percentile data available for the selected scenarios.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ height: "100%" }}>
      {/* Header */}
      <Box sx={{ mb: theme.space.section.sm }}>
        <Typography variant="h5" sx={{ mb: theme.space.component.sm }}>
          Reservoir Storage Percentiles
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.grey[600] }}>
          Monthly storage distribution across water years (Oct-Sep). Comparing{" "}
          <strong>{selectedScenarios.length}</strong> scenario
          {selectedScenarios.length !== 1 ? "s" : ""}.
        </Typography>
      </Box>

      {/* Reservoir sections */}
      {reservoirIds.map((reservoirId) => {
        const reservoir = dataByReservoir[reservoirId]
        if (!reservoir) return null

        return (
          <ReservoirSection
            key={reservoirId}
            reservoirId={reservoirId}
            reservoirName={reservoir.reservoirInfo.reservoir_name}
            capacityTaf={reservoir.reservoirInfo.capacity_taf}
            deadPoolTaf={reservoir.reservoirInfo.dead_pool_taf}
            scenarioData={reservoir.scenarioData}
            scenarioNames={scenarioNames}
            isLoading={isLoading}
          />
        )
      })}
    </Box>
  )
}
