"use client"

/**
 * SpillFrequencySection - Matrix visualization for reservoir spill frequency
 *
 * Displays spill statistics for major reservoirs across scenarios.
 * Shows the peak monthly spill frequency for each reservoir.
 */

import React from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  type Theme,
} from "@repo/ui/mui"
import { useSpillMonthly } from "@repo/data/coeqwal/hooks"
import type { SpillMonthlyReservoirData } from "@repo/data/coeqwal"

interface SpillFrequencySectionProps {
  scenarios: string[]
  /** Width of left label column (for alignment with other sections) */
  labelColumnWidth?: number
  /** Whether to show scenario headers (set false if parent shows them) */
  showScenarioHeaders?: boolean
}

/**
 * Calculate aggregate spill statistics from monthly data
 */
function calculateSpillStats(data: SpillMonthlyReservoirData): {
  peakFrequency: number
  peakMonth: number
  avgFrequency: number
  totalMonths: number
} {
  let peakFrequency = 0
  let peakMonth = 1
  let totalFrequency = 0
  let monthCount = 0
  let totalMonths = 0

  if (data.monthly) {
    Object.entries(data.monthly).forEach(([month, stats]) => {
      if (stats) {
        monthCount++
        totalFrequency += stats.spill_frequency_pct
        totalMonths = stats.total_months

        if (stats.spill_frequency_pct > peakFrequency) {
          peakFrequency = stats.spill_frequency_pct
          peakMonth = parseInt(month, 10)
        }
      }
    })
  }

  return {
    peakFrequency,
    peakMonth,
    avgFrequency: monthCount > 0 ? totalFrequency / monthCount : 0,
    totalMonths,
  }
}

/**
 * Get month name from month number (water year: 1=Oct, 12=Sep)
 */
function getMonthName(month: number): string {
  const waterYearMonths = [
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
  ]
  return waterYearMonths[month - 1] ?? ""
}

/**
 * Hook to fetch spill data for multiple scenarios
 */
function useMultiScenarioSpillData(scenarioIds: string[]) {
  const results = scenarioIds.map((scenarioId) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSpillMonthly(scenarioId, "major")
  })

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error ?? null

  interface ReservoirInfo {
    reservoirId: string
    reservoirName: string
  }

  const reservoirMap: Record<string, ReservoirInfo> = {}
  const spillData: Record<
    string,
    Record<string, SpillMonthlyReservoirData | undefined>
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
        }
      }

      // Build spill data: reservoirId -> scenarioId -> spill data
      if (!spillData[reservoirId]) {
        spillData[reservoirId] = {}
      }
      spillData[reservoirId][scenarioId] = data
    })
  })

  // Convert to sorted array
  const reservoirs = Object.values(reservoirMap).sort((a, b) =>
    (a.reservoirName ?? "").localeCompare(b.reservoirName ?? ""),
  )

  return { reservoirs, spillData, isLoading, error }
}

/**
 * Format spill frequency as percentage
 */
function formatSpillFrequency(frequency: number): string {
  return `${frequency.toFixed(0)}%`
}

/**
 * Get color based on spill frequency (higher frequency = more blue)
 */
function getSpillFrequencyColor(frequency: number, theme: Theme): string {
  if (frequency >= 80) return theme.palette.blue.darkest
  if (frequency >= 60) return theme.palette.blue.dark
  if (frequency >= 40) return theme.palette.blue.medium
  if (frequency >= 20) return theme.palette.blue.bright
  return theme.palette.grey[400]
}

export default function SpillFrequencySection({
  scenarios,
  labelColumnWidth = 100,
  showScenarioHeaders = true,
}: SpillFrequencySectionProps) {
  const theme = useTheme()

  const { reservoirs, spillData, isLoading, error } =
    useMultiScenarioSpillData(scenarios)

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
          Loading spill data...
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
          Could not load spill data: {error}
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
        No spill data available for the selected scenarios.
      </Typography>
    )
  }

  // Calculate cell width based on available space
  const availableWidth = `calc(100% - ${labelColumnWidth}px)`
  const cellWidth = `calc(${availableWidth} / ${scenarios.length})`

  return (
    <Box>
      {/* Scenario headers */}
      {showScenarioHeaders && (
        <Box
          sx={{
            display: "flex",
            mb: theme.space.component.md,
          }}
        >
          <Box sx={{ width: labelColumnWidth, flexShrink: 0 }} />
          {scenarios.map((scenarioId) => (
            <Box
              key={scenarioId}
              sx={{
                width: cellWidth,
                textAlign: "center",
              }}
            >
              <Typography
                variant="dashboard"
                sx={{
                  fontWeight: 500,
                  color: theme.palette.text.primary,
                }}
              >
                {scenarioId}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Reservoir rows */}
      {reservoirs.map((reservoir) => (
        <Box
          key={reservoir.reservoirId}
          sx={{
            display: "flex",
            alignItems: "center",
            py: theme.space.component.md,
            borderBottom: theme.border.light,
            "&:last-child": {
              borderBottom: "none",
            },
          }}
        >
          {/* Reservoir label */}
          <Box
            sx={{
              width: labelColumnWidth,
              flexShrink: 0,
              pr: theme.space.component.md,
            }}
          >
            <Typography
              variant="dashboard"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.primary,
              }}
            >
              {reservoir.reservoirName}
            </Typography>
          </Box>

          {/* Spill frequency cells */}
          {scenarios.map((scenarioId) => {
            const data = spillData[reservoir.reservoirId]?.[scenarioId]
            const stats = data ? calculateSpillStats(data) : null

            return (
              <Box
                key={scenarioId}
                sx={{
                  width: cellWidth,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {stats ? (
                  <>
                    {/* Peak spill frequency as large number */}
                    <Typography
                      sx={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: getSpillFrequencyColor(
                          stats.peakFrequency,
                          theme,
                        ),
                        lineHeight: 1,
                      }}
                    >
                      {formatSpillFrequency(stats.peakFrequency)}
                    </Typography>
                    {/* Peak month info */}
                    <Typography
                      variant="compactMicro"
                      sx={{
                        color: theme.palette.grey[400],
                        mt: 0.5,
                      }}
                    >
                      {stats.peakFrequency > 0
                        ? `peak in ${getMonthName(stats.peakMonth)}`
                        : "no spill events"}
                    </Typography>
                  </>
                ) : (
                  <Typography
                    variant="compactCaption"
                    sx={{ color: theme.palette.grey[400] }}
                  >
                    -
                  </Typography>
                )}
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
