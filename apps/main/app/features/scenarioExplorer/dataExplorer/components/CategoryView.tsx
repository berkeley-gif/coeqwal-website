"use client"

/**
 * CategoryView - Outcome categories accordion view
 *
 * Displays outcomes grouped by category with expandable sections.
 * Used in the Data in depth tool.
 */

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  CircularProgress,
  Button,
  type Theme,
} from "@repo/ui/mui"
import { CompactSelect, MobileModal, InfoTooltip } from "@repo/ui"
import { TierGlyphWithTooltip } from "../../../tooltips/TierGlyphWithTooltip"

/** Compact chart size for tier distribution (1.5x scenario-explorer size) */
const TIER_CHART_SIZE = 90
import { ExpandMoreIcon, AddIcon } from "@repo/ui/mui"
import useSWR from "swr"
import { useScenarioExplorerStore } from "../../store"
import {
  isSingleValueTier,
  type ChartDataPoint,
} from "../../../scenarios/components/shared"
import { VerticalBarChart, TierCircles, SpillMatrix } from "@repo/viz"
import type { MonthlySpillData } from "@repo/viz"
import {
  outcomeCategories,
  getMetricsByCategory,
  getOutcomeCategoryColor,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../hooks/useMetricData"
import { useResolvedSelectedScenarios } from "../hooks/useResolvedSelectedScenarios"
import ReservoirPercentilesSection, {
  type StorageDisplayMode,
} from "./ReservoirPercentilesSection"
import { useSpillMonthly, useBatchStatistics } from "@repo/data/coeqwal/hooks"
import type {
  SpillMonthlyReservoirData,
  BatchStatisticsResponse,
} from "@repo/data/coeqwal"
import CwsSection from "./CwsSection"
import AgSection from "./AgSection"
import EnvFlowSection from "./EnvFlowSection"
import RefugeSection from "./RefugeSection"
import DeltaSection from "./DeltaSection"
import { GridScenarioHeader } from "./AlignedScenarioGrid"
import { useMultiScenarioSlots } from "./useMultiScenarioSlots"
import { ChartGridProvider } from "./ChartGridContext"
import { SectionHeader } from "./SectionHeader"
import { fetchTierLocationAssignments } from "@repo/data/coeqwal"
import { useAllReservoirsList } from "@repo/data/coeqwal/hooks"
import { useScenarioList } from "../../../scenarios/hooks"

/**
 * Outer Accordion sx for a category card. Neutral chrome with a subtle
 * shadow on hover when collapsed
 */
function getAccordionStyles(theme: Theme, isExpanded: boolean) {
  return {
    backgroundColor: theme.palette.background.paper,
    boxShadow: "none",
    border: theme.border.light,
    mb: theme.space.component.lg,
    transition: theme.transition.default,
    "&:before": { display: "none" },
    "&:hover": { boxShadow: isExpanded ? "none" : theme.shadow.subtle },
  }
}

/**
 * AccordionSummary sx for a category. Adds the 4px colored left rail
 * and pins the summary to the top of the viewport while expanded
 */
function getSummaryStyles(theme: Theme, color: string, isExpanded: boolean) {
  return {
    backgroundColor: theme.palette.background.paper,
    borderLeft: `4px solid ${color}`,
    borderBottom: isExpanded ? theme.border.light : "none",
    minHeight: 64,
    "&:hover": { backgroundColor: theme.palette.grey[50] },
    "& .MuiAccordionSummary-content": { my: 1.5 },
    ...(isExpanded && {
      position: "sticky" as const,
      top: 0,
      zIndex: 10,
    }),
  }
}

/** Solid colored square that holds the category icon to the left of the title */
function getIconChipStyles(theme: Theme, color: string) {
  return {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.borderRadius.sm,
    backgroundColor: color,
    color: theme.palette.common.white,
    fontSize: 20,
  }
}

/**
 * Hook to get per-reservoir tier colors for multiple scenarios
 * Fetches tier location data for RES_STOR and builds a mapping of
 * scenarioId -> reservoirId -> tier color
 */
function useReservoirTierColors(scenarios: string[]) {
  const theme = useTheme()

  // Fetch lightweight tier assignments (no geometry) for each scenario
  const { data: allLocationData } = useSWR(
    scenarios.length > 0 ? ["reservoir-tier-locations", ...scenarios] : null,
    async () => {
      const results = await Promise.all(
        scenarios.map((scenarioId) =>
          fetchTierLocationAssignments(scenarioId, "RES_STOR").catch(
            () => null,
          ),
        ),
      )
      return results
    },
    { revalidateOnFocus: false },
  )

  // Build the cell color mapping: scenarioId -> reservoirId -> color
  const cellColors = useMemo(() => {
    const tierLevelColors: Record<number, string> = {
      1: theme.palette.tiers.tier1,
      2: theme.palette.tiers.tier2,
      3: theme.palette.tiers.tier3,
      4: theme.palette.tiers.tier4,
    }

    const colors: Record<string, Record<string, string>> = {}

    if (!allLocationData) return colors

    scenarios.forEach((scenarioId, index) => {
      const locationData = allLocationData[index]
      if (!locationData?.locations) return

      const scenarioColors: Record<string, string> = {}
      locationData.locations.forEach(
        (loc: { location_id: string; tier_level: number }) => {
          // Tier location uses "FOLSM", percentile data uses "S_FOLSM"
          // Add S_ prefix to match percentile reservoir IDs
          const reservoirId = loc.location_id.startsWith("S_")
            ? loc.location_id
            : `S_${loc.location_id}`
          const color =
            tierLevelColors[loc.tier_level] || theme.palette.tiers.tier3
          scenarioColors[reservoirId] = color
        },
      )
      colors[scenarioId] = scenarioColors
    })

    return colors
  }, [allLocationData, scenarios, theme.palette.tiers])

  return cellColors
}

/**
 * StorageTierRow - Displays tier bar charts for reservoir storage
 * Uses CSS Grid positioning (must be inside ChartGridProvider)
 */
// Get the reservoir-storage tier metric (constant, safe to call outside component)
const RESERVOIR_TIER_METRIC = getMetricsByCategory("reservoir-storage").find(
  (m) => m.isTier,
)

/**
 * StorageTierCharts - Inline tier distribution charts for reservoir storage
 * Renders charts horizontally to sit alongside section header
 * Uses TierGlyphWithTooltip for self-contained tooltip behavior
 */
interface StorageTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function StorageTierCharts({
  scenarios,
  scenarioNames,
  isModal = false,
}: StorageTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    RESERVOIR_TIER_METRIC as OutcomeMetric,
  )

  if (!RESERVOIR_TIER_METRIC) return null

  return (
    <>
      {scenarios.map((scenarioId, index) => {
        if (isLoading) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )
        }

        const scenarioData = data?.find((d) => d.scenarioId === scenarioId)
        if (!scenarioData?.tierData) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: theme.palette.grey[400] }}
              >
                -
              </Typography>
            </Box>
          )
        }

        // Convert tier data to ChartDataPoint format
        const chartData: ChartDataPoint[] = scenarioData.tierData.map(
          (tier) => ({
            label: tier.label,
            color: tier.color,
            value: tier.value,
            tierType: tier.tierType,
          }),
        )

        return (
          <Box
            key={scenarioId}
            sx={{
              gridColumn: index + 2,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TierGlyphWithTooltip
              outcomeCode="RES_STOR"
              chartData={chartData}
              scenarioLabel={scenarioNames[scenarioId] || scenarioId}
              size={TIER_CHART_SIZE}
              zIndex={isModal ? theme.zIndex.tooltipAboveModal : undefined}
            />
          </Box>
        )
      })}
    </>
  )
}

/**
 * PercentileBandLegend - Compact horizontal legend for percentile bands
 */
const PERCENTILE_BAND_COLORS = {
  range: "#d9eafb", // q0-q100 (lightest)
  outer: "#c5dbf3", // q10-q90
  inner: "#a2bee1", // q30-q70
  median: "#2c5aa0", // q50 (darkest)
}

/**
 * PercentileBandsLegend - Just the percentile band items (no reference lines)
 */
function PercentileBandsLegend() {
  return (
    <>
      {/* Min-Max (0-100th) band */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: PERCENTILE_BAND_COLORS.range,
          borderRadius: "2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Minimum to maximum range
      </Box>

      {/* 10-90th band */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: PERCENTILE_BAND_COLORS.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        10–90th percentile
      </Box>

      {/* 30-70th band */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: PERCENTILE_BAND_COLORS.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        30–70th percentile
      </Box>

      {/* Median line */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: PERCENTILE_BAND_COLORS.median,
          borderRadius: "1px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Median
      </Box>
    </>
  )
}

/**
 * ReferenceLinesLegend - Capacity and dead pool reference lines
 */
function ReferenceLinesLegend() {
  return (
    <>
      {/* Capacity reference line */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 2,
          backgroundImage:
            "linear-gradient(to right, #4a7c59 60%, transparent 40%)",
          backgroundSize: "6px 2px",
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Capacity
      </Box>

      {/* Dead pool reference line */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 2,
          backgroundImage:
            "linear-gradient(to right, #b85c38 60%, transparent 40%)",
          backgroundSize: "4px 2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ fontSize: "0.875rem", color: "grey.500" }}>
        Dead pool
      </Box>
    </>
  )
}

/**
 * MonthlyStorageSection - Section header with display mode dropdown
 * Wraps ReservoirPercentilesSection with a toggle for percentage vs volume display
 */
const STORAGE_DISPLAY_OPTIONS = [
  { value: "percentage" as const, label: "as percentage of capacity" },
  { value: "volume" as const, label: "by volume" },
]

// Y-axis scale options for volume mode
const VOLUME_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "absolute scale" },
  { value: "relative" as const, label: "relative to capacity" },
]

export type VolumeScaleMode = "absolute" | "relative"

/**
 * MonthlyStorageSection - Section for monthly percentile charts
 * Uses CSS Grid positioning (spans all scenario columns)
 */
function MonthlyStorageSection({
  scenarios,
  cellColors,
  batchData,
  isBatchLoading,
  isModal = false,
}: {
  scenarios: string[]
  cellColors?: Record<string, Record<string, string>>
  batchData: BatchStatisticsResponse | undefined
  isBatchLoading: boolean
  /** Whether this section is inside a modal (affects dropdown z-index) */
  isModal?: boolean
}): React.ReactElement {
  const theme = useTheme()
  const [displayMode, setDisplayMode] =
    useState<StorageDisplayMode>("percentage")
  const [volumeScaleMode, setVolumeScaleMode] =
    useState<VolumeScaleMode>("absolute")
  const [selectedReservoir, setSelectedReservoir] = useState<string>("")
  const [additionalReservoirs, setAdditionalReservoirs] = useState<string[]>([])
  const {
    reservoirs,
    majorReservoirIds,
    isLoading: reservoirsLoading,
  } = useAllReservoirsList()

  // Build reservoir options for CompactSelect, excluding major reservoirs and already-added ones
  const reservoirOptions = useMemo(() => {
    const majorSet = new Set(majorReservoirIds)
    const excludedIds = new Set([...majorSet, ...additionalReservoirs])
    return reservoirs
      .filter((r) => !excludedIds.has(r.reservoir_id))
      .map((r) => ({
        value: r.reservoir_id,
        label: r.reservoir_name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [reservoirs, majorReservoirIds, additionalReservoirs])

  const handleAddReservoir = () => {
    if (
      selectedReservoir &&
      !additionalReservoirs.includes(selectedReservoir)
    ) {
      setAdditionalReservoirs((prev) => [...prev, selectedReservoir])
      setSelectedReservoir("")
    }
  }

  const handleRemoveReservoir = (reservoirId: string) => {
    setAdditionalReservoirs((prev) => prev.filter((id) => id !== reservoirId))
  }

  return (
    <>
      {/* Header row - spans all columns with title on left, controls on right */}
      <Box
        sx={{
          gridColumn: "1 / -1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: theme.space.component.sm,
        }}
      >
        {/* Title with inline display mode selector and description */}
        <SectionHeader
          title="Monthly storage"
          titleAdornment={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CompactSelect
                value={displayMode}
                onChange={setDisplayMode}
                options={STORAGE_DISPLAY_OPTIONS}
                aria-label="Storage display mode"
                menuZIndex={isModal ? 9999 : undefined}
              />
              {displayMode === "volume" && (
                <>
                  <Typography
                    component="span"
                    sx={{ color: "grey.400", fontSize: "0.875rem" }}
                  >
                    ·
                  </Typography>
                  <CompactSelect
                    value={volumeScaleMode}
                    onChange={setVolumeScaleMode}
                    options={VOLUME_SCALE_OPTIONS}
                    aria-label="Y-axis scale mode"
                    menuZIndex={isModal ? 9999 : undefined}
                  />
                </>
              )}
            </Box>
          }
          description={
            <>
              Water year (Oct–Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""}
              <Box
                component="span"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 1.5,
                }}
              >
                {/* First line: label + all percentile bands */}
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
                    Overlapping percentile bands:
                  </Box>
                  <PercentileBandsLegend />
                </Box>
                {/* Second line: reference lines */}
                <Box
                  component="span"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <ReferenceLinesLegend />
                </Box>
              </Box>
            </>
          }
        />

        {/* Add reservoir controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: theme.space.gap.sm,
          }}
        >
          <CompactSelect
            value={selectedReservoir}
            onChange={setSelectedReservoir}
            options={reservoirOptions}
            placeholder="add a reservoir"
            disabled={reservoirsLoading}
            minWidth={180}
            maxMenuHeight={300}
            aria-label="Select reservoir to add"
            menuZIndex={isModal ? 9999 : undefined}
          />
          <Button
            variant="text"
            size="small"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={handleAddReservoir}
            disabled={!selectedReservoir}
            sx={{
              ...theme.typography.dashboard,
              textTransform: "none",
              color: selectedReservoir
                ? theme.palette.blue.dark
                : theme.palette.grey[400],
              px: theme.space.component.md,
              "&:hover": {
                backgroundColor: theme.palette.blue.pale,
              },
              "&.Mui-disabled": {
                color: theme.palette.grey[300],
              },
            }}
          >
            Add
          </Button>
        </Box>
      </Box>

      {/* Show added reservoir chips */}
      {additionalReservoirs.length > 0 && (
        <Box
          sx={{
            gridColumn: "1 / -1",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            mb: theme.space.component.sm,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{
              color: theme.palette.grey[500],
              mr: 0.5,
              alignSelf: "center",
            }}
          >
            Added:
          </Typography>
          {additionalReservoirs.map((id) => {
            const reservoir = reservoirs.find((r) => r.reservoir_id === id)
            return (
              <Box
                key={id}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  fontSize: "0.75rem",
                }}
              >
                {reservoir?.reservoir_name ?? id}
                <Box
                  component="button"
                  onClick={() => handleRemoveReservoir(id)}
                  sx={{
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    color: theme.palette.grey[500],
                    "&:hover": { color: theme.palette.grey[700] },
                  }}
                  aria-label={`Remove ${reservoir?.reservoir_name ?? id}`}
                >
                  ×
                </Box>
              </Box>
            )
          })}
        </Box>
      )}

      {/* Percentile matrix - spans all columns so internal layout aligns with grid */}
      <Box sx={{ gridColumn: "1 / -1" }}>
        <ReservoirPercentilesSection
          scenarios={scenarios}
          showScenarioHeaders={false}
          cellColors={cellColors}
          displayMode={displayMode}
          volumeScaleMode={volumeScaleMode}
          additionalReservoirs={additionalReservoirs}
          batchData={batchData}
          isBatchLoading={isBatchLoading}
        />
      </Box>
    </>
  )
}

// ============================================================================
// Spill Frequency Section
// ============================================================================

/**
 * Hook to fetch spill data for multiple scenarios
 * Calls useSpillMonthly for each scenario and merges results
 */
function useMultiScenarioSpillData(scenarios: string[]) {
  const results = useMultiScenarioSlots(scenarios, (s) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- helper guarantees stable hook order
    useSpillMonthly(s, "major"),
  )

  const isLoading = results.some((r) => r.isLoading)
  const error = results.find((r) => r.error)?.error ?? null

  // Build reservoir list and data matrix
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
      },
    )
  })

  const reservoirs = Object.values(reservoirMap).sort((a, b) =>
    a.reservoirName.localeCompare(b.reservoirName),
  )

  // Track which scenarios are still loading
  const loadingScenarios = scenarios.filter(
    (_, index) => results[index]?.isLoading ?? false,
  )

  return { reservoirs, matrixData, isLoading, error, loadingScenarios }
}

/**
 * SpillFrequencySection - Monthly spill frequency & magnitude charts
 * Rendered inside a CSS Grid (ChartGridProvider), spans all columns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function SpillFrequencySection({
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
          title="Spill frequency & magnitude"
          description={
            <>
              Top: monthly spill frequency (% of years) · Bottom: spill
              magnitude (median to max CFS)
            </>
          }
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
          />
        </Box>
      )}
    </>
  )
}

/**
 * ReservoirStorageContent - Inner content for reservoir storage (used in both inline and modal views)
 * Uses CSS Grid layout via ChartGridProvider for consistent alignment
 */
function ReservoirStorageContent({
  scenarios,
  scenarioNames,
  cellColors,
  batchData,
  isBatchLoading,
  isModal = false,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
  cellColors: Record<string, Record<string, string>>
  batchData: BatchStatisticsResponse | undefined
  isBatchLoading: boolean
  /** Whether this content is inside a modal (affects dropdown z-index) */
  isModal?: boolean
}) {
  const theme = useTheme()

  return (
    <>
      {/* Storage distribution section - in its own container */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          border: theme.border.light,
          boxShadow: theme.shadow.subtle,
          p: theme.space.component.lg,
          mb: theme.space.component.lg,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          {/* Title in column 1, charts in scenario columns - all on same row */}
          <Box sx={{ gridColumn: 1, display: "flex", alignItems: "center" }}>
            <SectionHeader
              title="Storage distribution"
              description={
                <InfoTooltip
                  description={
                    <>
                      Shasta · Oroville · Folsom · Trinity
                      <br />
                      New Melones · Millerton · San Luis (CVP & SWP)
                    </>
                  }
                  placement="bottom"
                >
                  <span
                    style={{
                      textDecoration: "underline",
                      textDecorationStyle: "dotted",
                      cursor: "help",
                      whiteSpace: "nowrap",
                    }}
                  >
                    major reservoirs
                  </span>
                </InfoTooltip>
              }
            />
          </Box>
          <StorageTierCharts
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>

      {/* Monthly storage section - in its own container */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          border: theme.border.light,
          boxShadow: theme.shadow.subtle,
          p: theme.space.component.lg,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          <MonthlyStorageSection
            scenarios={scenarios}
            cellColors={cellColors}
            batchData={batchData}
            isBatchLoading={isBatchLoading}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>
    </>
  )
}

/**
 * ReservoirStorageSection - Special section for reservoir storage category
 * Fetches per-reservoir tier colors and passes them to the percentile charts
 * Uses CSS Grid layout for consistent alignment between header and charts
 */
function ReservoirStorageSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: {
  scenarios: string[]
  scenarioNames: Record<string, string>
  batchData: BatchStatisticsResponse | undefined
  isBatchLoading: boolean
}) {
  const theme = useTheme()
  const cellColors = useReservoirTierColors(scenarios)
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <>
      {/* Sticky scenario header row */}
      <Box
        sx={{
          position: "sticky",
          top: 64, // Below the accordion header (minHeight: 64)
          zIndex: 9,
          backgroundColor: theme.palette.background.paper,
          py: theme.space.component.sm,
          mx: -theme.space.component.xl, // Extend to edges
          px: theme.space.component.xl,
        }}
      >
        <ChartGridProvider scenarios={scenarios}>
          {/* Scenario header row - uses grid columns for alignment */}
          <GridScenarioHeader
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            onExpand={() => setIsExpanded(true)}
          />
        </ChartGridProvider>
      </Box>

      {/* Content sections (each in their own container) */}
      <Box sx={{ mt: theme.space.component.md }}>
        <ReservoirStorageContent
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          cellColors={cellColors}
          batchData={batchData}
          isBatchLoading={isBatchLoading}
        />
      </Box>

      {/* Expanded modal view */}
      <MobileModal
        open={isExpanded}
        onClose={() => setIsExpanded(false)}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: theme.space.gap.lg,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.borderRadius.sm,
                backgroundColor: `${getOutcomeCategoryColor(theme, "reservoir-storage")}15`,
                color: getOutcomeCategoryColor(theme, "reservoir-storage"),
                fontSize: 20,
              }}
            >
              {
                outcomeCategories.find((c) => c.id === "reservoir-storage")
                  ?.icon
              }
            </Box>
            <Typography
              variant="subtitle2"
              sx={{ color: theme.palette.text.primary }}
            >
              Reservoir storage
            </Typography>
          </Box>
        }
        maxWidth="90vw"
        maxHeight="90vh"
        contentAriaLabel="Reservoir storage data visualization"
        stickyHeader={
          <ChartGridProvider scenarios={scenarios}>
            <GridScenarioHeader
              scenarios={scenarios}
              scenarioNames={scenarioNames}
            />
          </ChartGridProvider>
        }
      >
        {/* Full content in modal */}
        <ReservoirStorageContent
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          cellColors={cellColors}
          batchData={batchData}
          isBatchLoading={isBatchLoading}
          isModal
        />
      </MobileModal>
    </>
  )
}

/**
 * Rewrite a batch slice keyed by API short_code to one keyed by
 * sibling-group id. If an entry carries an inner `scenario_id` (only
 * `BatchStorageData` does today), it's rewritten too so downstream code
 * can use either key interchangeably.
 *
 * Used inside `CategoryView` to translate `useBatchStatistics` responses
 * back into the group-id space the section components expect.
 */
function rekeyByGroup<T>(
  slice: Record<string, T> | undefined,
  resolvedToGroup: Map<string, string>,
): Record<string, T> | undefined {
  if (!slice) return slice
  const out: Record<string, T> = {}
  for (const [shortCode, entry] of Object.entries(slice)) {
    const groupId = resolvedToGroup.get(shortCode)
    if (!groupId) continue
    if (entry && typeof entry === "object" && "scenario_id" in entry) {
      out[groupId] = { ...entry, scenario_id: groupId } as T
    } else {
      out[groupId] = entry
    }
  }
  return out
}

/**
 * CategoryView: Outcomes organized by category with collapsible sections
 */
export default function CategoryView() {
  const theme = useTheme()
  const { selectedScenarios, setMainView, setExploreMode } =
    useScenarioExplorerStore()
  const [expanded, setExpanded] = React.useState<string[]>([])
  const [hasBeenExpanded, setHasBeenExpanded] = React.useState<Set<string>>(
    new Set(),
  )

  // Use the same hook as SelectionBanner for consistent scenario names
  const { getDisplayName } = useScenarioList()

  // Resolve the user's selected sibling-group ids to short_codes for the
  // active hydroclimate. The batch endpoint speaks short_codes. The rest
  // of the UI (and all section components) speaks sibling-group ids, so
  // we re-key the response below before forwarding.
  const resolved = useResolvedSelectedScenarios()

  // Single batch fetch covering storage, CWS, AG, and env_flow for every
  // resolved scenario. `rawBatchData` is keyed by short_code from the API.
  // The `batchData` memo below re-keys it by sibling-group id so sections
  // can keep using `batchData?.<type>?.[scenarioId]` against group ids.
  // Sections backed by endpoints not in the batch (refuge, delta monthly,
  // M&I contractors, demand units, spill) still use `useMultiScenarioSlots`.
  const { data: rawBatchData, isLoading: isBatchLoading } = useBatchStatistics(
    resolved.resolvedIds,
    { types: ["storage", "cws", "ag", "env_flow"] },
  )

  const batchData = useMemo<BatchStatisticsResponse | undefined>(() => {
    if (!rawBatchData) return rawBatchData
    const map = resolved.resolvedToGroup
    return {
      scenarios: resolved.selectedGroupIds.filter(
        (id) => resolved.groupToResolved[id] != null,
      ),
      storage: rekeyByGroup(rawBatchData.storage, map),
      cws: rekeyByGroup(rawBatchData.cws, map),
      ag: rekeyByGroup(rawBatchData.ag, map),
      env_flow: rekeyByGroup(rawBatchData.env_flow, map),
    }
  }, [rawBatchData, resolved])

  // Build scenario ID -> display name mapping for selected scenarios
  const scenarioNames = useMemo(() => {
    const names: Record<string, string> = {}
    selectedScenarios.forEach((id) => {
      names[id] = getDisplayName(id)
    })
    return names
  }, [selectedScenarios, getDisplayName])

  const handleAccordionChange = (categoryId: string) => {
    setExpanded((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
    setHasBeenExpanded((prev) => {
      if (prev.has(categoryId)) return prev
      const next = new Set(prev)
      next.add(categoryId)
      return next
    })
  }

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
          p: theme.space.section.md,
          textAlign: "center",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: theme.palette.grey[700],
            mb: theme.space.component.md,
          }}
        >
          No scenarios selected
        </Typography>
        <Typography
          variant="dashboard"
          sx={{
            display: "block",
            color: theme.palette.grey[500],
            mb: theme.space.section.xs,
            maxWidth: 320,
          }}
        >
          Select scenarios to compare outcome metrics side by side.
        </Typography>
        <Button
          variant="text"
          onClick={() => {
            setMainView("explorer")
            setExploreMode("list")
          }}
          sx={{
            ...theme.typography.dashboard,
            textTransform: "none",
            fontWeight: 500,
            color: theme.palette.blue.dark,
            "&:hover": {
              backgroundColor: theme.palette.blue.pale,
            },
          }}
        >
          Choose scenarios {"->"}
        </Button>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      {outcomeCategories.map((category) => {
        const metrics = getMetricsByCategory(category.id)
        const tierMetrics = metrics.filter((m) => m.isTier)
        const nonTierMetrics = metrics.filter((m) => !m.isTier)
        const isExpanded = expanded.includes(category.id)
        const categoryColor = getOutcomeCategoryColor(theme, category.id)

        return (
          <Accordion
            key={category.id}
            expanded={isExpanded}
            onChange={() => handleAccordionChange(category.id)}
            sx={getAccordionStyles(theme, isExpanded)}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: theme.palette.grey[400] }} />
              }
              sx={getSummaryStyles(theme, categoryColor, isExpanded)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: theme.space.gap.lg,
                  width: "100%",
                }}
              >
                <Box
                  sx={getIconChipStyles(theme, categoryColor)}
                >
                  {category.icon}
                </Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    flex: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  {category.name}
                </Typography>
              </Box>
            </AccordionSummary>

            <AccordionDetails
              sx={{
                pt: theme.space.component.lg,
                px: theme.space.component.xl,
                pb: theme.space.component.xl,
                backgroundColor: theme.palette.background.toolPanel,
              }}
            >
              {!hasBeenExpanded.has(category.id) ? null : category.id ===
                  "reservoir-storage" && selectedScenarios.length > 0 ? (
                  <ReservoirStorageSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                    batchData={batchData}
                    isBatchLoading={isBatchLoading}
                  />
                ) : category.id === "community-water" &&
                  selectedScenarios.length > 0 ? (
                  <CwsSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                    batchData={batchData}
                    isBatchLoading={isBatchLoading}
                  />
                ) : category.id === "agricultural-water" &&
                  selectedScenarios.length > 0 ? (
                  <AgSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                    batchData={batchData}
                    isBatchLoading={isBatchLoading}
                  />
                ) : category.id === "env-flow-statistics" &&
                  selectedScenarios.length > 0 ? (
                  <EnvFlowSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                    batchData={batchData}
                    isBatchLoading={isBatchLoading}
                  />
                ) : category.id === "environmental-water" &&
                  selectedScenarios.length > 0 ? (
                  <RefugeSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                  />
                ) : category.id === "delta-salinity" &&
                  selectedScenarios.length > 0 ? (
                  <DeltaSection
                    scenarios={selectedScenarios}
                    scenarioNames={scenarioNames}
                    batchData={batchData}
                    isBatchLoading={isBatchLoading}
                  />
                ) : (
                  <>
                    {/* Standard tier metrics for non-reservoir categories */}
                    {tierMetrics.length > 0 && (
                      <Box sx={{ mb: theme.space.section.sm }}>
                        <Typography
                          variant="smallSectionLabel"
                          sx={{
                            display: "block",
                            mb: theme.space.component.lg,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          Outcome Tiers
                        </Typography>
                        {tierMetrics.map((metric) => (
                          <MetricCard
                            key={metric.id}
                            metric={metric}
                            scenarios={selectedScenarios}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}

                {/* Other metrics - skip for categories with custom sections or incomplete data */}
                {nonTierMetrics.length > 0 &&
                  category.id !== "reservoir-storage" &&
                  category.id !== "community-water" &&
                  category.id !== "agricultural-water" &&
                  category.id !== "env-flow-statistics" &&
                  category.id !== "environmental-water" &&
                  category.id !== "delta-salinity" &&
                  category.id !== "groundwater-storage" &&
                  category.id !== "salmon-abundance" && (
                    <Box>
                      {tierMetrics.length > 0 && (
                        <Typography
                          variant="smallSectionLabel"
                          sx={{
                            display: "block",
                            mb: theme.space.component.lg,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                          }}
                        >
                          Additional Metrics
                        </Typography>
                      )}
                      {nonTierMetrics.map((metric) => (
                        <MetricCard
                          key={metric.id}
                          metric={metric}
                          scenarios={selectedScenarios}
                        />
                      ))}
                    </Box>
                  )}
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Box>
  )
}

/**
 * MetricCard: Individual metric display
 */
function MetricCard({
  metric,
  scenarios,
}: {
  metric: OutcomeMetric
  scenarios: string[]
}) {
  const theme = useTheme()
  const { data, isLoading, error } = useMetricData(scenarios, metric)

  return (
    <Box
      sx={{
        p: theme.space.component.xl,
        mb: theme.space.component.lg,
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.borderRadius.md,
        border: theme.border.light,
        boxShadow: theme.shadow.subtle,
        transition: theme.transition.default,
        "&:hover": {
          borderColor: theme.palette.grey[300],
        },
      }}
    >
      {/* Metric name and unit */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: theme.space.component.md,
          gap: theme.space.gap.lg,
        }}
      >
        <Typography
          variant="compactTitle"
          sx={{
            color: theme.palette.text.primary,
          }}
        >
          {metric.name}
        </Typography>
        <Typography
          variant="compactMicro"
          sx={{
            color: theme.palette.grey[400],
            textTransform: "lowercase",
            flexShrink: 0,
          }}
        >
          {metric.unit}
        </Typography>
      </Box>

      {/* Description */}
      <Typography
        variant="dashboard"
        sx={{
          display: "block",
          color: theme.palette.grey[600],
          mb: theme.space.component.lg,
        }}
      >
        {metric.description}
      </Typography>

      {/* Metadata - simplified inline display */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.space.gap.lg,
          mb: metric.notes ? theme.space.component.md : 0,
        }}
      >
        <Typography
          variant="compactMicro"
          sx={{ color: theme.palette.grey[400] }}
        >
          {metric.temporal.join(" · ")}
        </Typography>
        <Typography
          variant="compactMicro"
          sx={{ color: theme.palette.grey[400] }}
        >
          {metric.spatialType.replace(/-/g, " ")}
        </Typography>
        {metric.aggregations.length > 0 && (
          <Typography
            variant="compactMicro"
            sx={{ color: theme.palette.grey[400] }}
          >
            {metric.aggregations.join(" · ")}
          </Typography>
        )}
      </Box>

      {/* Notes */}
      {metric.notes && (
        <Box
          sx={{
            mt: theme.space.component.md,
            py: theme.space.component.sm,
            px: theme.space.component.md,
            backgroundColor: theme.palette.grey[50],
            borderRadius: theme.borderRadius.sm,
            borderLeft: `2px solid ${theme.palette.grey[300]}`,
          }}
        >
          <Typography
            variant="compactCaption"
            sx={{
              display: "block",
              color: theme.palette.grey[600],
            }}
          >
            {metric.notes}
          </Typography>
        </Box>
      )}

      {/* Scenario comparison data visualization */}
      {scenarios.length > 0 && (
        <Box
          sx={{
            mt: theme.space.section.xs,
            pt: theme.space.component.lg,
            borderTop: theme.border.light,
          }}
        >
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                py: theme.space.section.sm,
              }}
            >
              <CircularProgress
                size={20}
                sx={{ color: theme.palette.grey[300] }}
              />
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
          )}

          {error && (
            <Typography
              variant="compactCaption"
              sx={{
                color: theme.palette.grey[500],
                fontStyle: "italic",
              }}
            >
              {error}
            </Typography>
          )}

          {!isLoading && !error && data && metric.isTier && (
            <Box
              sx={{
                display: "flex",
                gap: theme.space.gap.xl,
                flexWrap: "wrap",
              }}
            >
              {data.map((scenario) => (
                <Box
                  key={scenario.scenarioId}
                  sx={{
                    flex: "1 1 180px",
                    minWidth: theme.spacing(22),
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="compactCaption"
                    sx={{
                      mb: theme.space.component.md,
                      fontWeight: 500,
                      color: theme.palette.grey[500],
                      textAlign: "center",
                      fontFeatureSettings: "'tnum' 1",
                    }}
                  >
                    {scenario.scenarioName}
                  </Typography>
                  {isSingleValueTier(scenario.tierData) ? (
                    <TierCircles tiers={scenario.tierData} size={140} />
                  ) : (
                    <VerticalBarChart tiers={scenario.tierData} size={140} />
                  )}
                </Box>
              ))}
            </Box>
          )}

          {!isLoading && !error && !metric.isTier && (
            <Typography
              variant="compactCaption"
              sx={{
                display: "block",
                color: theme.palette.grey[400],
                fontStyle: "italic",
                textAlign: "center",
                py: theme.space.component.lg,
              }}
            >
              Visualization coming soon
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}
