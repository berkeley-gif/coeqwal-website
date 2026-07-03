"use client"

/**
 * SpillFrequencySection - monthly spill frequency & magnitude for major
 * reservoirs, rendered as a SpillMatrix.
 *
 * Rendered inside a CSS Grid (ChartGridProvider) and spans all scenario
 * columns. Wired into ReservoirStorageContent.
 *
 * Data status: the frequency data is ready, the magnitude data is not, so this
 * section renders frequency only (SpillMatrix showMagnitude={false}).
 * The backend defines spill as a storage threshold crossing (storage at or
 * above the flood control level), which yields a frequency only. The CFS
 * magnitude columns (spill_avg_cfs, spill_max_cfs, spill_q50..q100) are never
 * computed by the ETL and always arrive null. The frequency bar is meaningful
 * and is populated for the major reservoirs shown here (they have a usable
 * flood level, while most minor reservoirs do not, but those are not displayed in
 * this section). When the backend computes real spill volume, flip
 * showMagnitude back on to restore the bottom panel. Tracked as a backend
 * hardening plan (see coeqwal-data-platform etl/statistics README,
 * "reservoir spill threshold coverage and spill volume").
 */

import React, { useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { SpillMatrix } from "@repo/viz"
import type { MonthlySpillData } from "@repo/viz"
import { useSpillMonthly } from "@repo/data/coeqwal/hooks"
import type { SpillMonthlyReservoirData } from "@repo/data/coeqwal"
import { useMultiScenarioSlots } from "../../hooks/useMultiScenarioSlots"
import { useResolvedIdMapping } from "../../../../../../../scenarios/hooks"
import { SectionHeader } from "../shared/SectionHeader"

/**
 * Convert the data-package spill shape into the viz `MonthlySpillData` shape.
 * A month with a null `spill_frequency_pct` is dropped. Magnitude (CFS) columns
 * are passed through unchanged, including null: the current ETL computes spill
 * as a storage-threshold frequency (not a flow volume) and never populates the
 * CFS columns, so they arrive null. We deliberately do NOT coerce null to 0
 * (that would fabricate a real-looking value); the viz type is nullable and the
 * chart skips markers for null magnitudes. The magnitude panel is also hidden
 * here (SpillMatrix showMagnitude={false}) until the backend computes real
 * spill volume (see coeqwal-data-platform etl/statistics README).
 */
function toVizMonthlySpill(
  data: Record<
    string,
    {
      spill_months_count: number | null
      total_months: number | null
      spill_frequency_pct: number | null
      spill_avg_cfs: number | null
      spill_max_cfs: number | null
      spill_q50: number | null
      spill_q90: number | null
      spill_q100: number | null
      storage_at_spill_avg_pct: number | null
    } | null
  >,
): MonthlySpillData {
  const out: MonthlySpillData = {}
  Object.entries(data).forEach(([month, stats]) => {
    if (!stats || stats.spill_frequency_pct == null) return
    out[month] = {
      spill_months_count: stats.spill_months_count ?? 0,
      total_months: stats.total_months ?? 0,
      spill_frequency_pct: stats.spill_frequency_pct,
      // Magnitude columns are passed through as-is (null when the ETL did not
      // compute them). The chart skips null markers.
      spill_avg_cfs: stats.spill_avg_cfs,
      spill_max_cfs: stats.spill_max_cfs,
      spill_q50: stats.spill_q50,
      spill_q90: stats.spill_q90,
      spill_q100: stats.spill_q100,
      storage_at_spill_avg_pct: stats.storage_at_spill_avg_pct,
    }
  })
  return out
}

/**
 * Fetch spill data for multiple scenarios. Calls useSpillMonthly once per
 * scenario (via the stable-slot helper) and merges into the matrix shape
 * SpillMatrix expects: reservoirId to scenarioId to monthly spill data.
 */
function useMultiScenarioSpillData(scenarios: string[]) {
  const { idMapping } = useResolvedIdMapping()
  const fetchIds = useMemo(
    () => scenarios.map((id) => idMapping[id] ?? null),
    [scenarios, idMapping],
  )
  const results = useMultiScenarioSlots(fetchIds, (s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
    useSpillMonthly(s, "major"),
  )

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error ?? null

  const reservoirMap: Record<
    string,
    { reservoirId: string; reservoirName: string }
  > = {}
  const matrixData: Record<
    string,
    Record<string, MonthlySpillData | undefined>
  > = {}

  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.reservoirs) return

    Object.entries(result.reservoirs).forEach(
      ([reservoirId, data]: [string, SpillMonthlyReservoirData]) => {
        if (!data) return

        if (!reservoirMap[reservoirId]) {
          reservoirMap[reservoirId] = {
            reservoirId,
            reservoirName: data.name ?? reservoirId,
          }
        }

        if (!matrixData[reservoirId]) {
          matrixData[reservoirId] = {}
        }
        matrixData[reservoirId][scenarioId] = data.monthly
          ? toVizMonthlySpill(data.monthly)
          : undefined
      },
    )
  })

  const reservoirs = Object.values(reservoirMap).sort((a, b) =>
    a.reservoirName.localeCompare(b.reservoirName),
  )

  const loadingScenarios = scenarios.filter(
    (_, index) => results[index]?.isLoading ?? false,
  )

  return { reservoirs, matrixData, isLoading, error, loadingScenarios }
}

/**
 * Monthly spill frequency & magnitude charts. Rendered inside a CSS Grid
 * (ChartGridProvider) and spans all scenario columns.
 */
export default function SpillFrequencySection({
  scenarios,
  scenarioNames,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
}) {
  const theme = useTheme()
  const { reservoirs, matrixData, isLoading, error, loadingScenarios } =
    useMultiScenarioSpillData(scenarios)

  return (
    <>
      {/* Header row */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.space.component.sm,
        }}
      >
        <SectionHeader
          title="Spill frequency"
          description="Monthly spill frequency (% of years) for major reservoirs"
        />
      </Box>

      {/* Loading state */}
      {isLoading && reservoirs.length === 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[400] }}
          >
            Loading spill data...
          </Typography>
        </Box>
      )}

      {/* Error state */}
      {error && reservoirs.length === 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            py: theme.space.component.lg,
            px: theme.space.component.md,
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{ color: theme.palette.grey[500] }}
          >
            Could not load spill data: {error}
          </Typography>
        </Box>
      )}

      {/* SpillMatrix */}
      {reservoirs.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <SpillMatrix
            reservoirs={reservoirs}
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            data={matrixData}
            responsive
            showScenarioHeaders={false}
            labelColumnWidth={120}
            loadingScenarios={loadingScenarios}
            showMagnitude={false}
          />
        </Box>
      )}
    </>
  )
}
