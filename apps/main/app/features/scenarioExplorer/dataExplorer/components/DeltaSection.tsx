"use client"

/**
 * DeltaSection — Delta salinity and X2 section for the Data Explorer
 *
 * Charts:
 *   1. April X2 position (km) — single-month percentile band (water month 7)
 *   2. September X2 position (km) — single-month percentile band (water month 12)
 *   3. Salinity at compliance points (EM, JP, RS, CO) — monthly percentile bands
 *   4. Salinity at pumping plants (Banks, Tracy/Jones) — monthly percentile bands
 *
 * Data comes from the delta_monthly table via /api/statistics/scenarios/{id}/delta/monthly.
 */

import React, { useMemo } from "react"
import { Box, Typography, useTheme } from "@repo/ui/mui"
import { PercentileMatrix } from "@repo/viz"
import type { ReservoirData, MonthlyPercentiles } from "@repo/viz"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { ChartGridProvider } from "./ChartGridContext"
import { PercentileMatrixSkeleton } from "./PercentileMatrixSkeleton"
import { useDeltaMonthly } from "@repo/data/coeqwal/hooks"
import type { DeltaMonthlyStats } from "@repo/data/coeqwal"

// ============================================================================
// Constants
// ============================================================================

type MatrixDataType = Record<
  string,
  Record<string, MonthlyPercentiles | undefined>
>

const VARIABLE_LABELS: Record<string, string> = {
  x2: "X2 (2 ppt isohaline)",
  em_ec: "Emmaton",
  jp_ec: "Jersey Point",
  rs_ec: "Rock Slough",
  co_ec: "Collinsville",
  banks_ec: "Banks Pumping Plant",
  tracy_ec: "Tracy/Jones Pumping Plant",
  ndo: "Net Delta Outflow",
}

const VARIABLE_UNITS: Record<string, string> = {
  x2: "KM",
  em_ec: "µmhos/cm",
  jp_ec: "µmhos/cm",
  rs_ec: "µmhos/cm",
  co_ec: "µmhos/cm",
  banks_ec: "µmhos/cm",
  tracy_ec: "µmhos/cm",
  ndo: "TAF",
}

const COMPLIANCE_VARS = ["em_ec", "jp_ec", "rs_ec", "co_ec"]
const PUMPS_VARS = ["banks_ec", "tracy_ec"]

/** Salinity band colors — teal/green, distinct from delivery blue and shortage orange */
const SALINITY_BAND_COLORS = {
  range: "#e0f2f1",
  outer: "#b2dfdb",
  inner: "#80cbc4",
  median: "#00695c",
}

const X2_BAND_COLORS = {
  range: "#e8eaf6",
  outer: "#c5cae9",
  inner: "#9fa8da",
  median: "#283593",
}

// ============================================================================
// Helpers
// ============================================================================

function rowsToMonthlyPercentiles(
  rows: DeltaMonthlyStats[],
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
      mean: row.avg ?? 0,
    }
  }
  return monthly
}

function buildReservoirData(
  variableCodes: string[],
): ReservoirData[] {
  return variableCodes.map((code) => ({
    reservoirId: code,
    reservoirName: VARIABLE_LABELS[code] ?? code,
    capacityTaf: 0,
    deadPoolTaf: 0,
    labelSubtitle: VARIABLE_UNITS[code] ?? "",
  }))
}

// ============================================================================
// Multi-scenario data hooks
// ============================================================================

function useMultiScenarioDelta(scenarios: string[]) {
  const results = scenarios.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useDeltaMonthly(scenarioId)
  })

  const isLoading = results.some((r) => r.isLoading)
  const loadingScenarios = scenarios.filter(
    (_, i) => results[i]?.isLoading ?? false,
  )

  const allData: Record<string, DeltaMonthlyStats[]> = {}
  results.forEach((result, index) => {
    const scenarioId = scenarios[index]
    if (!scenarioId || !result.rows.length) return
    allData[scenarioId] = result.rows
  })

  return { allData, isLoading, loadingScenarios }
}

function buildMatrixForVariables(
  allData: Record<string, DeltaMonthlyStats[]>,
  variableCodes: string[],
): MatrixDataType {
  const matrix: MatrixDataType = {}
  for (const varCode of variableCodes) {
    matrix[varCode] = {}
  }

  for (const [scenarioId, rows] of Object.entries(allData)) {
    const byVar = new Map<string, DeltaMonthlyStats[]>()
    for (const row of rows) {
      if (!variableCodes.includes(row.variable_code)) continue
      if (!byVar.has(row.variable_code)) byVar.set(row.variable_code, [])
      byVar.get(row.variable_code)!.push(row)
    }
    for (const [varCode, varRows] of byVar.entries()) {
      if (!matrix[varCode]) matrix[varCode] = {}
      matrix[varCode][scenarioId] = rowsToMonthlyPercentiles(varRows)
    }
  }

  return matrix
}

/**
 * Build a matrix for X2 showing only April (water month 7) or September (water month 12).
 * We filter down to just that one month but still pass it as month "1" so
 * PercentileMatrix renders a single column.
 */
function buildSingleMonthMatrix(
  allData: Record<string, DeltaMonthlyStats[]>,
  variableCode: string,
  waterMonth: number,
): MatrixDataType {
  const matrix: MatrixDataType = { [variableCode]: {} }

  for (const [scenarioId, rows] of Object.entries(allData)) {
    const matchingRow = rows.find(
      (r) => r.variable_code === variableCode && r.water_month === waterMonth,
    )
    if (matchingRow) {
      matrix[variableCode]![scenarioId] = {
        "1": {
          q0: matchingRow.q0 ?? 0,
          q10: matchingRow.q10 ?? 0,
          q30: matchingRow.q30 ?? 0,
          q50: matchingRow.q50 ?? 0,
          q70: matchingRow.q70 ?? 0,
          q90: matchingRow.q90 ?? 0,
          q100: matchingRow.q100 ?? 0,
          mean: matchingRow.avg ?? 0,
        },
      }
    }
  }

  return matrix
}

// ============================================================================
// Legend
// ============================================================================

function BandsLegend({
  colors,
}: {
  colors: { range: string; outer: string; inner: string; median: string }
}) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
      }}
    >
      <Box
        component="span"
        sx={{
          color: "grey.500",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        Percentile bands:
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.range,
          borderRadius: "2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Min–max
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: colors.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th
      </Box>
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: colors.median,
          borderRadius: "1px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Median
      </Box>
    </Box>
  )
}

// ============================================================================
// Section header
// ============================================================================

function SectionHeader({
  title,
  description,
}: {
  title: string
  description?: React.ReactNode
}) {
  const theme = useTheme()
  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
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

interface DeltaSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
}

export default function DeltaSection({
  scenarios,
  scenarioNames,
}: DeltaSectionProps) {
  const theme = useTheme()

  const { allData, isLoading, loadingScenarios } =
    useMultiScenarioDelta(scenarios)

  const hasData = !isLoading && Object.keys(allData).length > 0

  // Build matrices for each chart group
  const aprilX2Matrix = useMemo(
    () => buildSingleMonthMatrix(allData, "x2", 7),
    [allData],
  )
  const septX2Matrix = useMemo(
    () => buildSingleMonthMatrix(allData, "x2", 12),
    [allData],
  )
  const complianceMatrix = useMemo(
    () => buildMatrixForVariables(allData, COMPLIANCE_VARS),
    [allData],
  )
  const pumpsMatrix = useMemo(
    () => buildMatrixForVariables(allData, PUMPS_VARS),
    [allData],
  )

  // ReservoirData entries for each group
  const aprilX2Entities: ReservoirData[] = useMemo(
    () => [
      {
        reservoirId: "x2",
        reservoirName: "April X2",
        capacityTaf: 0,
        deadPoolTaf: 0,
        labelSubtitle: "Distance (KM) from Golden Gate",
      },
    ],
    [],
  )

  const septX2Entities: ReservoirData[] = useMemo(
    () => [
      {
        reservoirId: "x2",
        reservoirName: "September X2",
        capacityTaf: 0,
        deadPoolTaf: 0,
        labelSubtitle: "Distance (KM) from Golden Gate",
      },
    ],
    [],
  )

  const complianceEntities = useMemo(
    () => buildReservoirData(COMPLIANCE_VARS),
    [],
  )
  const pumpsEntities = useMemo(() => buildReservoirData(PUMPS_VARS), [])

  const primaryScenario = scenarios[0] ?? null

  if (!primaryScenario) {
    return (
      <Box sx={{ p: theme.space.section.sm }}>
        <Typography color="text.secondary">
          Select a scenario to view Delta salinity data.
        </Typography>
      </Box>
    )
  }

  const chartCardSx = {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.md,
    border: theme.border.light,
    p: theme.space.component.lg,
    mb: theme.space.component.lg,
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

      {/* ── April X2 ──────────────────────────────────────────── */}
      <Box sx={chartCardSx}>
        <SectionHeader
          title="April X2"
          description={
            <>
              Distribution of April X2 position across simulated years.
              X2 is the distance (km) from Golden Gate where salinity = 2 ppt.
              Lower values indicate saltwater intrusion further into the Delta.
              <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                <BandsLegend colors={X2_BAND_COLORS} />
              </Box>
            </>
          }
        />
        <Box sx={{ mt: theme.space.component.lg }}>
          {isLoading && !hasData ? (
            <PercentileMatrixSkeleton
              scenarios={scenarios}
              rowCount={1}
              labelColumnWidth={160}
            />
          ) : !hasData ? (
            <Typography color="text.secondary" variant="body2">
              No April X2 data available.
            </Typography>
          ) : (
            <PercentileMatrix
              reservoirs={aprilX2Entities}
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              data={aprilX2Matrix}
              responsive
              labelColumnWidth={160}
              showScenarioHeaders={false}
              displayMode="volume"
              volumeScaleMode="absolute"
              loadingScenarios={loadingScenarios}
              minYMaxTaf={0}
              yAxisSuffix=" km"
            />
          )}
        </Box>
      </Box>

      {/* ── September X2 ──────────────────────────────────────── */}
      <Box sx={chartCardSx}>
        <SectionHeader
          title="September X2"
          description={
            <>
              Distribution of September X2 position across simulated years.
              Fall X2 reflects conditions at the end of the dry season,
              when salinity intrusion is typically most pronounced.
              <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                <BandsLegend colors={X2_BAND_COLORS} />
              </Box>
            </>
          }
        />
        <Box sx={{ mt: theme.space.component.lg }}>
          {isLoading && !hasData ? (
            <PercentileMatrixSkeleton
              scenarios={scenarios}
              rowCount={1}
              labelColumnWidth={160}
            />
          ) : !hasData ? (
            <Typography color="text.secondary" variant="body2">
              No September X2 data available.
            </Typography>
          ) : (
            <PercentileMatrix
              reservoirs={septX2Entities}
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              data={septX2Matrix}
              responsive
              labelColumnWidth={160}
              showScenarioHeaders={false}
              displayMode="volume"
              volumeScaleMode="absolute"
              loadingScenarios={loadingScenarios}
              minYMaxTaf={0}
              yAxisSuffix=" km"
            />
          )}
        </Box>
      </Box>

      {/* ── Compliance Point Salinity (EM, JP, RS, CO) ────────── */}
      <Box sx={chartCardSx}>
        <SectionHeader
          title="Salinity at compliance points"
          description={
            <>
              Monthly electrical conductivity (EC) at four Delta compliance
              stations: Emmaton, Jersey Point, Rock Slough, and Collinsville.
              Higher values indicate greater salinity intrusion. Units are
              µmhos/cm (micromhos per centimeter).
              <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                <BandsLegend colors={SALINITY_BAND_COLORS} />
              </Box>
            </>
          }
        />
        <Box sx={{ mt: theme.space.component.lg }}>
          {isLoading && !hasData ? (
            <PercentileMatrixSkeleton
              scenarios={scenarios}
              rowCount={4}
              labelColumnWidth={160}
            />
          ) : !hasData ? (
            <Typography color="text.secondary" variant="body2">
              No compliance salinity data available.
            </Typography>
          ) : (
            <PercentileMatrix
              reservoirs={complianceEntities}
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              data={complianceMatrix}
              responsive
              labelColumnWidth={160}
              showScenarioHeaders={false}
              displayMode="volume"
              volumeScaleMode="relative"
              loadingScenarios={loadingScenarios}
              minYMaxTaf={0}
              yAxisSuffix=" µS/cm"
            />
          )}
        </Box>
      </Box>

      {/* ── Pumping Plant Salinity (Banks, Tracy/Jones) ────────── */}
      <Box sx={chartCardSx}>
        <SectionHeader
          title="Salinity at pumping plants"
          description={
            <>
              Monthly 14-day maximum electrical conductivity at Banks (SWP) and
              Tracy/Jones (CVP) pumping plants. These values drive export water
              quality for urban and agricultural users south of the Delta.
              <Box component="span" sx={{ display: "block", mt: 1.5 }}>
                <BandsLegend colors={SALINITY_BAND_COLORS} />
              </Box>
            </>
          }
        />
        <Box sx={{ mt: theme.space.component.lg }}>
          {isLoading && !hasData ? (
            <PercentileMatrixSkeleton
              scenarios={scenarios}
              rowCount={2}
              labelColumnWidth={160}
            />
          ) : !hasData ? (
            <Typography color="text.secondary" variant="body2">
              No pumping plant salinity data available.
            </Typography>
          ) : (
            <PercentileMatrix
              reservoirs={pumpsEntities}
              scenarios={scenarios}
              scenarioNames={scenarioNames}
              data={pumpsMatrix}
              responsive
              labelColumnWidth={160}
              showScenarioHeaders={false}
              displayMode="volume"
              volumeScaleMode="relative"
              loadingScenarios={loadingScenarios}
              minYMaxTaf={0}
              yAxisSuffix=" µS/cm"
            />
          )}
        </Box>
      </Box>
    </>
  )
}
