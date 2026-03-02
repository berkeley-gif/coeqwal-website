"use client"

/**
 * RefugeSection — Wildlife Refuge Environmental Water section for the Data Explorer
 *
 * Displays delivery, shortage, and reliability data for 18 wildlife refuge and
 * wetland demand units in the Sacramento and San Joaquin hydrologic regions.
 *
 * Charts:
 *   - Monthly delivery percentile bands (PercentileMatrix, TAF)
 *   - Monthly shortage percentile bands (PercentileMatrix, TAF)
 *   - Period-of-record reliability display (reliability_pct_95)
 *
 * Layout follows the same CSS Grid patterns as AgSection and CwsSection.
 */

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"
import { PercentileMatrix } from "@repo/viz"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
} from "@repo/viz"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import {
  useRefugeDemandUnitsList,
  useRefugeDusDeliveryMonthly,
  useRefugeDusShortageMonthly,
  useRefugeDusPeriod,
} from "@repo/data/coeqwal/hooks"
import type {
  RefugeDeliveryMonthlyStats,
  RefugeShortageMonthlyStats,
  RefugePeriodSummary,
} from "@repo/data/coeqwal"

// ============================================================================
// Types
// ============================================================================

type MatrixDataType = Record<string, Record<string, MonthlyPercentiles | undefined>>
type RegionFilter = "all" | "SAC" | "SJR" | "TULARE"

const SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

const REGION_OPTIONS = [
  { value: "all" as const, label: "All regions" },
  { value: "SAC" as const, label: "Sacramento" },
  { value: "SJR" as const, label: "San Joaquin" },
  { value: "TULARE" as const, label: "Tulare" },
]

// ============================================================================
// Helpers
// ============================================================================

function deliveryRowsToMonthlyPercentiles(
  rows: RefugeDeliveryMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50 ?? 0,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.delivery_avg_taf ?? 0,
    }
  }
  return monthly
}

function shortageRowsToMonthlyPercentiles(
  rows: RefugeShortageMonthlyStats[],
): MonthlyPercentiles {
  const monthly: MonthlyPercentiles = {}
  for (const row of rows) {
    monthly[String(row.water_month)] = {
      q0: row.q0 ?? 0,
      q10: row.q10 ?? 0,
      q30: row.q30 ?? 0,
      q50: row.q50 ?? 0,
      q70: row.q70 ?? 0,
      q90: row.q90 ?? 0,
      q100: row.q100 ?? 0,
      mean: row.shortage_avg_taf ?? 0,
    }
  }
  return monthly
}

// ============================================================================
// Multi-scenario hooks
// ============================================================================

/**
 * Fetch monthly delivery data for all selected scenarios and build a
 * duId → scenarioId → MonthlyPercentiles matrix.
 */
function useMultiScenarioRefugeDelivery(scenarios: string[]) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefugeDusDeliveryMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const matrixData: MatrixDataType = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.rows.length) return

    const byDu = new Map<string, RefugeDeliveryMonthlyStats[]>()
    for (const row of result.rows) {
      if (!byDu.has(row.du_id)) byDu.set(row.du_id, [])
      byDu.get(row.du_id)!.push(row)
    }
    for (const [duId, duRows] of byDu.entries()) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = deliveryRowsToMonthlyPercentiles(duRows)
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

/**
 * Fetch monthly shortage data for all selected scenarios and build a
 * duId → scenarioId → MonthlyPercentiles matrix.
 */
function useMultiScenarioRefugeShortage(scenarios: string[]) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useRefugeDusShortageMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const matrixData: MatrixDataType = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.rows.length) return

    const byDu = new Map<string, RefugeShortageMonthlyStats[]>()
    for (const row of result.rows) {
      if (!byDu.has(row.du_id)) byDu.set(row.du_id, [])
      byDu.get(row.du_id)!.push(row)
    }
    for (const [duId, duRows] of byDu.entries()) {
      if (!matrixData[duId]) matrixData[duId] = {}
      matrixData[duId][scenarioId] = shortageRowsToMonthlyPercentiles(duRows)
    }
  })

  return { matrixData, isLoading, loadingScenarios }
}

// ============================================================================
// Reliability mini-display
// ============================================================================

interface ReliabilityDisplayProps {
  summaries: RefugePeriodSummary[]
  duIds: string[]
  duLabels: Record<string, string>
}

function ReliabilityDisplay({
  summaries,
  duIds,
  duLabels,
}: ReliabilityDisplayProps) {
  const theme = useTheme()
  const byDu = new Map(summaries.map((s) => [s.du_id, s]))

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: theme.space.component.sm,
      }}
    >
      {duIds.map((duId) => {
        const summary = byDu.get(duId)
        const reliability = summary?.reliability_pct_95 ?? null
        const isReliable = reliability !== null && reliability <= 5

        return (
          <Box
            key={duId}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: 80,
              p: theme.space.component.sm,
              borderRadius: 1,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.65rem",
                color: theme.palette.text.secondary,
                textAlign: "center",
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {duLabels[duId] ?? duId}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: "0.9rem",
                color:
                  reliability === null
                    ? theme.palette.text.disabled
                    : isReliable
                      ? theme.palette.success.main
                      : reliability <= 20
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
              }}
            >
              {reliability === null ? "—" : `${reliability.toFixed(1)}%`}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

// ============================================================================
// Section header
// ============================================================================

interface SectionHeaderProps {
  title: string
  titleAdornment?: React.ReactNode
  description?: React.ReactNode
}

function SectionHeader({ title, titleAdornment, description }: SectionHeaderProps) {
  const theme = useTheme()
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: theme.space.gap.sm }}>
        <Typography
          variant="overline"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </Typography>
        {titleAdornment}
      </Box>
      {description && (
        <Box
          sx={{
            color: theme.palette.grey[600],
            mt: 0.5,
            ...theme.typography.dashboard,
          }}
        >
          {description}
        </Box>
      )}
    </Box>
  )
}

// ============================================================================
// Main component
// ============================================================================

interface RefugeSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
}

export default function RefugeSection({
  scenarios,
  scenarioNames,
}: RefugeSectionProps) {
  const theme = useTheme()

  const [scaleMode, setScaleMode] = useState<"absolute" | "relative">("absolute")
  const [regionFilter, setRegionFilter] = useState<RegionFilter>("all")

  const { demandUnits, isLoading: isLoadingDUs } = useRefugeDemandUnitsList()

  const filteredDUs = useMemo(
    () =>
      demandUnits.filter(
        (du) => regionFilter === "all" || du.hydrologic_region === regionFilter,
      ),
    [demandUnits, regionFilter],
  )

  const filteredDuIds = filteredDUs.map((du) => du.du_id)

  // Build ReservoirData[] for PercentileMatrix (using du_id as reservoirId)
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      filteredDUs.map((du) => ({
        reservoirId: du.du_id,
        reservoirName: du.refuge_or_wildlife_area
          ? `${du.du_id} — ${du.refuge_or_wildlife_area}`
          : du.du_id,
        capacityTaf: 0,
        deadPoolTaf: 0,
      })),
    [filteredDUs],
  )

  // Labels for reliability badge display
  const duLabels = useMemo(
    () =>
      Object.fromEntries(
        demandUnits.map((du) => [
          du.du_id,
          du.refuge_or_wildlife_area
            ? `${du.du_id}\n${du.refuge_or_wildlife_area.substring(0, 18)}`
            : du.du_id,
        ]),
      ),
    [demandUnits],
  )

  const {
    matrixData: deliveryMatrix,
    isLoading: isLoadingDelivery,
    loadingScenarios: deliveryLoadingScenarios,
  } = useMultiScenarioRefugeDelivery(scenarios)

  const {
    matrixData: shortageMatrix,
    isLoading: isLoadingShortage,
    loadingScenarios: shortageLoadingScenarios,
  } = useMultiScenarioRefugeShortage(scenarios)

  // Reliability uses the first selected scenario
  const primaryScenario = scenarios[0] ?? null
  const { summaries: periodSummaries, isLoading: isLoadingPeriod } =
    useRefugeDusPeriod(primaryScenario)

  const hasDeliveryData =
    !isLoadingDelivery && Object.keys(deliveryMatrix).length > 0
  const hasShortageData =
    !isLoadingShortage && Object.keys(shortageMatrix).length > 0

  if (!primaryScenario) {
    return (
      <Box sx={{ p: theme.space.section.sm }}>
        <Typography color="text.secondary">
          Select a scenario to view refuge data.
        </Typography>
      </Box>
    )
  }

  return (
    <>
      {/* Sticky scenario header */}
      <Box
        sx={{
          position: "sticky",
          top: 64,
          zIndex: 9,
          backgroundColor: theme.palette.background.default,
          py: theme.space.component.sm,
          mx: -theme.space.component.xl,
          px: theme.space.component.xl,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
          />
        </ChartGridProvider>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: theme.space.gap.md,
          mt: theme.space.component.md,
          mb: theme.space.component.xl,
          flexWrap: "wrap",
        }}
      >
        <CompactSelect
          aria-label="Region filter"
          value={regionFilter}
          options={REGION_OPTIONS}
          onChange={(v) => setRegionFilter(v as RegionFilter)}
        />
        <CompactSelect
          aria-label="Scale mode"
          value={scaleMode}
          options={SCALE_OPTIONS}
          onChange={(v) => setScaleMode(v as "absolute" | "relative")}
        />
      </Box>

      {isLoadingDUs ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          {/* ── Monthly Delivery ─────────────────────────────────────── */}
          <Box sx={{ mb: theme.space.section.sm }}>
            <SectionHeader
              title="Monthly surface water delivery"
              description="Percentile distribution of monthly deliveries across all simulated years (TAF)"
            />
            <Box sx={{ mt: theme.space.component.lg }}>
              {isLoadingDelivery && !hasDeliveryData ? (
                <PercentileMatrixSkeleton
                  scenarios={scenarios}
                  rowCount={Math.min(filteredDuIds.length, 4)}
                />
              ) : !hasDeliveryData ? (
                <Typography color="text.secondary" variant="body2">
                  No delivery data available for this scenario and region.
                </Typography>
              ) : (
                <PercentileMatrix
                  reservoirs={reservoirData}
                  scenarios={scenarios}
                  scenarioNames={scenarioNames}
                  data={deliveryMatrix}
                  responsive
                  labelColumnWidth={140}
                  displayMode="volume"
                  volumeScaleMode={scaleMode as VolumeScaleMode}
                  colorScheme="delivery"
                  loadingScenarios={deliveryLoadingScenarios}
                />
              )}
            </Box>
          </Box>

          {/* ── Monthly Shortage ─────────────────────────────────────── */}
          <Box sx={{ mb: theme.space.section.sm }}>
            <SectionHeader
              title="Monthly delivery shortage"
              description="Shortage = max(demand − delivery, 0). Distribution across all simulated years (TAF)"
            />
            <Box sx={{ mt: theme.space.component.lg }}>
              {isLoadingShortage && !hasShortageData ? (
                <PercentileMatrixSkeleton
                  scenarios={scenarios}
                  rowCount={Math.min(filteredDuIds.length, 4)}
                />
              ) : !hasShortageData ? (
                <Typography color="text.secondary" variant="body2">
                  No shortage data available for this scenario and region.
                </Typography>
              ) : (
                <PercentileMatrix
                  reservoirs={reservoirData}
                  scenarios={scenarios}
                  scenarioNames={scenarioNames}
                  data={shortageMatrix}
                  responsive
                  labelColumnWidth={140}
                  displayMode="volume"
                  volumeScaleMode={scaleMode as VolumeScaleMode}
                  colorScheme="shortage"
                  loadingScenarios={shortageLoadingScenarios}
                />
              )}
            </Box>
          </Box>

          {/* ── Reliability ──────────────────────────────────────────── */}
          <Box sx={{ mb: theme.space.section.sm }}>
            <SectionHeader
              title="Delivery reliability"
              description={
                <>
                  95th percentile of annual shortage %.{" "}
                  <Box component="span" sx={{ color: theme.palette.text.primary }}>
                    In 95 of 100 years, annual shortage ≤ this value.
                  </Box>{" "}
                  Green = ≤5%, yellow = 5–20%, red = &gt;20%.{" "}
                  <Box component="span" sx={{ color: theme.palette.grey[400] }}>
                    Showing {scenarioNames[primaryScenario] ?? primaryScenario}.
                  </Box>
                </>
              }
            />
            <Box sx={{ mt: theme.space.component.lg }}>
              {isLoadingPeriod ? (
                <CircularProgress size={24} />
              ) : periodSummaries.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No reliability data available for this scenario.
                </Typography>
              ) : (
                <ReliabilityDisplay
                  summaries={periodSummaries}
                  duIds={filteredDuIds}
                  duLabels={duLabels}
                />
              )}
            </Box>
          </Box>
        </>
      )}
    </>
  )
}
