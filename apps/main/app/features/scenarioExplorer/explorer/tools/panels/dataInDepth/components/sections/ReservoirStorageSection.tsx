"use client"

/**
 * ReservoirStorageSection - the reservoir-storage category section.
 *
 * Composition (top to bottom):
 *   - sticky GridScenarioHeader (with expand-to-modal control)
 *   - Storage distribution: tier glyphs per scenario (StorageTierCharts)
 *   - Monthly storage: percentile matrix with %/volume toggle and an
 *     "add a reservoir" control (MonthlyStorageSection)
 *   - Spill frequency & magnitude (SpillFrequencySection)
 *
 * The same content renders inline and inside the expand MobileModal via
 * ReservoirStorageContent.
 */

import React, { useMemo, useState } from "react"
import {
  Box,
  Typography,
  useTheme,
  CircularProgress,
  Button,
  AddIcon,
} from "@repo/ui/mui"
import { CompactSelect, InfoTooltip } from "@repo/ui"
import { TierGlyphWithTooltip } from "../../../../../../../tooltips/TierGlyphWithTooltip"
import type { ChartDataPoint } from "../../../../../../../scenarios/components/shared"
import useSWR from "@repo/data/swr"
import { fetchTierLocationAssignments } from "@repo/data/coeqwal"
import { useAllReservoirsList } from "@repo/data/coeqwal/hooks"
import type { BatchStatisticsResponse } from "@repo/data/coeqwal"
import {
  getMetricsByCategory,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../../hooks/useMetricData"
import ReservoirPercentilesSection, {
  type StorageDisplayMode,
} from "./ReservoirPercentilesSection"
import { ChartGridProvider } from "../shared/ChartGridContext"
import { ExpandableSection } from "../shared/ExpandableSection"
import { SectionHeader } from "../shared/SectionHeader"
import SpillFrequencySection from "./SpillFrequencySection"
import type { BatchSectionProps } from "../shared/sectionTypes"
import { STORAGE_BAND_COLORS } from "../../config/bandColors"
import { TIER_CHART_SIZE } from "../shared/chartConstants"

export type VolumeScaleMode = "absolute" | "relative"

/**
 * Hook to get per-reservoir tier colors for multiple scenarios.
 * Fetches tier location data for RES_STOR and builds a mapping of
 * scenarioId to reservoirId to tier color.
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

  // Build the cell color mapping: scenarioId to reservoirId to color
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

// Get the reservoir-storage tier metric (constant, safe to call outside component)
const RESERVOIR_TIER_METRIC = getMetricsByCategory("reservoir-storage").find(
  (m) => m.isTier,
)

/**
 * StorageTierCharts - Inline tier distribution charts for reservoir storage.
 * Renders charts horizontally to sit alongside section header.
 * Uses TierGlyphWithTooltip for self-contained tooltip behavior.
 * Uses CSS Grid positioning (must be inside ChartGridProvider).
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
 * PercentileBandsLegend - Just the percentile band items (no reference lines)
 */
function PercentileBandsLegend() {
  return (
    <>
      {/* Min-Max (0-100th) range - dashed reference line */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 0,
          borderTop: `2px dashed ${STORAGE_BAND_COLORS.range}`,
        }}
      />
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
        Minimum to maximum range
      </Box>

      {/* 10-90th band */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: STORAGE_BAND_COLORS.outer,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
        10–90th percentile
      </Box>

      {/* 30-70th band */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 14,
          backgroundColor: STORAGE_BAND_COLORS.inner,
          borderRadius: "2px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
        30–70th percentile
      </Box>

      {/* Median line */}
      <Box
        component="span"
        sx={{
          width: 14,
          height: 3,
          backgroundColor: STORAGE_BAND_COLORS.median,
          borderRadius: "1px",
          ml: 0.75,
        }}
      />
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
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
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
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
      <Box component="span" sx={{ typography: "dashboard", color: "grey.500" }}>
        Dead pool
      </Box>
    </>
  )
}

const STORAGE_DISPLAY_OPTIONS = [
  { value: "percentage" as const, label: "as percentage of capacity" },
  { value: "volume" as const, label: "by volume" },
]

// Y-axis scale options for volume mode
const VOLUME_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "absolute scale" },
  { value: "relative" as const, label: "relative to capacity" },
]

/**
 * MonthlyStorageSection - Section header with display mode dropdown.
 * Wraps ReservoirPercentilesSection with a toggle for percentage vs volume
 * display, an optional volume scale toggle, and an "add a reservoir" control.
 * Uses CSS Grid positioning (spans all scenario columns).
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
                    sx={{ color: "grey.400", typography: "dashboard" }}
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
                      typography: "dashboardBold",
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
                  typography: "compactCaption",
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

/**
 * ReservoirStorageContent - Inner content for reservoir storage (used in both
 * inline and modal views). Uses CSS Grid layout via ChartGridProvider for
 * consistent alignment.
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
          mb: theme.space.component.lg,
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

      {/* Spill frequency section - in its own container */}
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
          <SpillFrequencySection
            scenarios={scenarios}
            scenarioNames={scenarioNames}
          />
        </ChartGridProvider>
      </Box>
    </>
  )
}

/**
 * ReservoirStorageSection - Special section for reservoir storage category.
 * Fetches per-reservoir tier colors and passes them to the percentile charts.
 * Uses CSS Grid layout for consistent alignment between header and charts.
 */
export default function ReservoirStorageSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: BatchSectionProps) {
  const cellColors = useReservoirTierColors(scenarios)

  return (
    <ExpandableSection
      scenarios={scenarios}
      scenarioNames={scenarioNames}
      categoryId="reservoir-storage"
      title="Reservoir storage"
      contentAriaLabel="Reservoir storage data visualization"
      renderBody={(isModal) => (
        <ReservoirStorageContent
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          cellColors={cellColors}
          batchData={batchData}
          isBatchLoading={isBatchLoading}
          isModal={isModal}
        />
      )}
    />
  )
}
