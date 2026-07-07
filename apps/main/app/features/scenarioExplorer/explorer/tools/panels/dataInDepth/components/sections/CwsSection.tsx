"use client"

/**
 * CwsSection - Community Water Systems section for the Data Explorer
 *
 * Displays CWS aggregate delivery and shortage data:
 * - Delivery tier distribution (CWS_DEL)
 * - Monthly delivery/shortage percentile charts
 *
 * Uses the same CSS Grid layout patterns as ReservoirStorageSection.
 */

import React, { useState, useMemo } from "react"
import { Box, Typography, useTheme, CircularProgress } from "@repo/ui/mui"
import { CompactSelect } from "@repo/ui"
import { TierGlyphWithTooltip } from "../../../../../../../tooltips/TierGlyphWithTooltip"
import { PercentileMatrix } from "@repo/viz"
import type { ChartDataPoint } from "../../../../../../../scenarios/components/shared"
import type {
  ReservoirData,
  MonthlyPercentiles,
  VolumeScaleMode,
} from "@repo/viz"
import { ChartGridProvider } from "../shared/ChartGridContext"
import { PercentileMatrixSkeleton } from "../shared/PercentileMatrixSkeleton"
import { ExpandableSection } from "../shared/ExpandableSection"
import { useDemandUnitsList } from "@repo/data/coeqwal/hooks"
import type { BatchCwsData } from "@repo/data/coeqwal"
import {
  getMetricsByCategory,
  type OutcomeMetric,
} from "../../config/outcomeDefinitions"
import { useMetricData } from "../../hooks/useMetricData"
import { useHydroclimateAvailability } from "../../../../../../../scenarios/hooks"
import { HydroclimateUnavailablePlaceholder } from "../../../../../../../scenarios/components/HydroclimateUnavailablePlaceholder"
import { SectionHeader } from "../shared/SectionHeader"
import { TIER_CHART_SIZE } from "../shared/chartConstants"
import {
  DELIVERY_BAND_COLORS,
  SHORTAGE_BAND_COLORS,
} from "../../config/bandColors"
import type { BatchSectionProps } from "../shared/sectionTypes"
import {
  useMultiScenarioCwsData,
  type CwsEntityLevel,
} from "../../hooks/useCwsData"
import { buildDemandUnitGroupOptions } from "../../hooks/cwsTransforms"
import { DataAvailabilityNotice } from "../shared/DataAvailabilityNotice"
import { AddedEntityChips } from "../shared/AddedEntityChips"
import { OverlappingBandsLegend } from "../shared/OverlappingBandsLegend"
import { AddEntityPicker } from "../shared/AddEntityPicker"

// ============================================================================
// Constants
// ============================================================================

/** Display mode for CWS charts */
type CwsDisplayMode = "delivery" | "shortage"

const CWS_DISPLAY_OPTIONS = [
  { value: "delivery" as const, label: "Delivery" },
  { value: "shortage" as const, label: "Shortage" },
]

const CWS_ENTITY_LEVEL_OPTIONS = [
  { value: "aggregates" as const, label: "Project totals" },
  { value: "contractors" as const, label: "M&I Contractors" },
]

const CWS_SCALE_OPTIONS = [
  { value: "absolute" as const, label: "Absolute scale" },
  { value: "relative" as const, label: "Relative scale" },
]

// ============================================================================
// Monthly CWS Controls
// ============================================================================

/**
 * The entity-level, delivery/shortage, and scale selects shown next to the
 * "Monthly deliveries" title. Kept separate from the section orchestrator so
 * the header stays readable.
 */
function MonthlyCwsControls({
  entityLevel,
  onEntityLevelChange,
  displayMode,
  onDisplayModeChange,
  scaleMode,
  onScaleModeChange,
  isModal = false,
}: {
  entityLevel: CwsEntityLevel
  onEntityLevelChange: (value: CwsEntityLevel) => void
  displayMode: CwsDisplayMode
  onDisplayModeChange: (value: CwsDisplayMode) => void
  scaleMode: VolumeScaleMode
  onScaleModeChange: (value: VolumeScaleMode) => void
  isModal?: boolean
}) {
  const theme = useTheme()
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: theme.space.gap.sm,
      }}
    >
      <CompactSelect
        value={entityLevel}
        onChange={onEntityLevelChange}
        options={CWS_ENTITY_LEVEL_OPTIONS}
        aria-label="Entity level"
        menuZIndex={isModal ? 9999 : undefined}
      />
      <CompactSelect
        value={displayMode}
        onChange={onDisplayModeChange}
        options={CWS_DISPLAY_OPTIONS}
        aria-label="Display mode"
        menuZIndex={isModal ? 9999 : undefined}
      />
      <Typography
        variant="compactCaption"
        sx={{ color: theme.palette.grey[500], ml: theme.space.gap.sm }}
      >
        shown on
      </Typography>
      <CompactSelect
        value={scaleMode}
        onChange={onScaleModeChange}
        options={CWS_SCALE_OPTIONS}
        aria-label="Scale mode"
        menuZIndex={isModal ? 9999 : undefined}
      />
    </Box>
  )
}

// ============================================================================
// CWS Tier Row Component
// ============================================================================

// Get the CWS tier metric (constant, safe to call outside component)
const CWS_TIER_METRIC = getMetricsByCategory("community-water").find(
  (m) => m.isTier,
)

/**
 * CwsTierCharts - Inline tier distribution charts for CWS
 * Renders charts horizontally to sit alongside section header
 * Uses TierGlyphWithTooltip for self-contained tooltip behavior
 */
interface CwsTierChartsProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** Sibling-group ids with no variant for the active hydroclimate */
  missingSet: Set<string>
  /** Active hydroclimate value, used to label the missing-variant placeholder */
  hydroclimate: string
  /** Whether this is inside a modal (affects tooltip z-index) */
  isModal?: boolean
}

function CwsTierCharts({
  scenarios,
  scenarioNames,
  missingSet,
  hydroclimate,
  isModal = false,
}: CwsTierChartsProps) {
  const theme = useTheme()
  const { data, isLoading } = useMetricData(
    scenarios,
    CWS_TIER_METRIC as OutcomeMetric,
  )

  if (!CWS_TIER_METRIC) return null

  return (
    <>
      {scenarios.map((scenarioId, index) => {
        if (missingSet.has(scenarioId)) {
          return (
            <Box
              key={scenarioId}
              sx={{
                gridColumn: index + 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: TIER_CHART_SIZE,
              }}
            >
              <HydroclimateUnavailablePlaceholder
                hydroclimate={hydroclimate}
                groupId={scenarioId}
                variant="inline"
              />
            </Box>
          )
        }

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

        // Special case: s0011 is the baseline scenario
        if (scenarioId === "s0011") {
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.palette.grey[100],
                  borderRadius: theme.borderRadius.sm,
                  border: theme.border.medium,
                  width: TIER_CHART_SIZE,
                  height: TIER_CHART_SIZE,
                  px: theme.space.component.xs,
                }}
              >
                <Typography
                  variant="compactMicro"
                  sx={{
                    color: theme.palette.grey[500],
                    textAlign: "center",
                    lineHeight: 1.3,
                  }}
                >
                  Baseline
                </Typography>
              </Box>
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
              outcomeCode="CWS_DEL"
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

// ============================================================================
// Monthly CWS Section Component
// ============================================================================

interface MonthlyCwsSectionProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** CWS slice of the batched response (keyed by scenario id) */
  cwsBatch: Record<string, BatchCwsData> | undefined
  /** Whether the batched fetch is still in flight */
  isBatchLoading: boolean
  /** Whether this section is inside a modal (affects dropdown z-index) */
  isModal?: boolean
}

function MonthlyCwsSection({
  scenarios,
  scenarioNames,
  cwsBatch,
  isBatchLoading,
  isModal = false,
}: MonthlyCwsSectionProps) {
  const theme = useTheme()
  const [displayMode, setDisplayMode] = useState<CwsDisplayMode>("delivery")
  const [entityLevel, setEntityLevel] = useState<CwsEntityLevel>("aggregates")
  const [scaleMode, setScaleMode] = useState<VolumeScaleMode>("absolute")
  const [selectedDemandUnit, setSelectedDemandUnit] = useState<string>("")
  const [additionalDemandUnits, setAdditionalDemandUnits] = useState<string[]>(
    [],
  )

  // Fetch list of demand units for the dropdown
  // Uses flat list endpoint and groups client-side by the 'group' field
  const { demandUnits: demandUnitsList, isLoading: demandUnitsLoading } =
    useDemandUnitsList()

  const {
    aggregates,
    matrixData,
    cellStats,
    breakdownData,
    breakdownComponents,
    error,
    addedDemandUnitsHaveShortageData,
    loadingScenarios,
  } = useMultiScenarioCwsData(
    scenarios,
    entityLevel,
    cwsBatch,
    isBatchLoading,
    additionalDemandUnits,
    demandUnitsList,
  )

  // Convert to PercentileMatrix format
  // Note: We don't pass summary stats in reservoirData because they vary by scenario.
  // Instead, we pass cellStats separately for per-cell rendering below each chart.
  const reservoirData: ReservoirData[] = useMemo(
    () =>
      aggregates.map((agg) => ({
        reservoirId: agg.shortCode,
        reservoirName: agg.label,
        capacityTaf: 0, // Not applicable for CWS
        deadPoolTaf: 0, // Not applicable for CWS
      })),
    [aggregates],
  )

  const percentileData = useMemo(() => {
    const data: Record<
      string,
      Record<string, MonthlyPercentiles | undefined>
    > = {}
    Object.entries(matrixData).forEach(([shortCode, scenarioData]) => {
      const shortCodeData: Record<string, MonthlyPercentiles | undefined> = {}
      Object.entries(scenarioData).forEach(([scenarioId, monthlyData]) => {
        shortCodeData[scenarioId] =
          displayMode === "delivery"
            ? monthlyData?.delivery
            : monthlyData?.shortage
      })
      data[shortCode] = shortCodeData
    })
    return data
  }, [matrixData, displayMode])

  // Build grouped demand unit options for CompactSelect, excluding already-added ones
  const demandUnitGroups = useMemo(
    () => buildDemandUnitGroupOptions(demandUnitsList, additionalDemandUnits),
    [demandUnitsList, additionalDemandUnits],
  )

  const handleAddDemandUnit = () => {
    if (
      selectedDemandUnit &&
      !additionalDemandUnits.includes(selectedDemandUnit)
    ) {
      setAdditionalDemandUnits((prev) => [...prev, selectedDemandUnit])
      setSelectedDemandUnit("")
    }
  }

  const handleRemoveDemandUnit = (duId: string) => {
    setAdditionalDemandUnits((prev) => prev.filter((id) => id !== duId))
  }

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
          title="Monthly deliveries"
          titleAdornment={
            <MonthlyCwsControls
              entityLevel={entityLevel}
              onEntityLevelChange={setEntityLevel}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              scaleMode={scaleMode}
              onScaleModeChange={setScaleMode}
              isModal={isModal}
            />
          }
          description={
            <>
              Water year (Oct–Sep) · {scenarios.length} scenario
              {scenarios.length !== 1 ? "s" : ""}
              <OverlappingBandsLegend
                colors={
                  displayMode === "delivery"
                    ? DELIVERY_BAND_COLORS
                    : SHORTAGE_BAND_COLORS
                }
                caption={
                  displayMode === "delivery"
                    ? "Upper chart region = wetter-year delivery · Lower chart region = drier-year delivery"
                    : "Upper chart region = drier-year shortage · Lower chart region = wetter-year shortage (near zero)"
                }
              />
            </>
          }
        />

        {/* Add demand unit controls */}
        <AddEntityPicker
          value={selectedDemandUnit}
          onChange={setSelectedDemandUnit}
          groups={demandUnitGroups}
          onAdd={handleAddDemandUnit}
          placeholder="add a demand unit"
          disabled={demandUnitsLoading}
          selectAriaLabel="Select demand unit to add"
          isModal={isModal}
        />
      </Box>

      {/* Show added demand unit chips */}
      <AddedEntityChips
        items={additionalDemandUnits.map((id) => ({
          id,
          label: demandUnitsList.find((du) => du.du_id === id)?.label ?? id,
        }))}
        onRemove={handleRemoveDemandUnit}
      />

      {/* Notice when shortage is selected but current view doesn't have shortage data */}
      {displayMode === "shortage" && entityLevel !== "aggregates" && (
        <DataAvailabilityNotice>
          Monthly shortage data is only available in the &ldquo;Project
          totals&rdquo; view. Switch to Project totals to see shortage charts.
        </DataAvailabilityNotice>
      )}

      {/* Notice when shortage is selected in aggregates but added demand units don't have shortage data */}
      {displayMode === "shortage" &&
        entityLevel === "aggregates" &&
        additionalDemandUnits.length > 0 &&
        !addedDemandUnitsHaveShortageData && (
          <DataAvailabilityNotice>
            Monthly shortage data is not available for the individually added
            demand units. Shortage charts for these units will appear empty.
          </DataAvailabilityNotice>
        )}

      {/* Loading state with skeleton. Gated directly on data presence (no
          latch), so the skeleton reappears whenever data is absent, including
          while a new hydroclimate is being fetched, instead of collapsing. */}
      {aggregates.length === 0 && !error && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrixSkeleton
            scenarios={scenarios}
            rowCount={8}
            message="Loading CWS data..."
            labelColumnWidth={140}
          />
        </Box>
      )}

      {/* Error state - only show if no data at all */}
      {error && aggregates.length === 0 && (
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
            Could not load CWS data: {error}
          </Typography>
        </Box>
      )}

      {/* Matrix visualization - show once data is present */}
      {aggregates.length > 0 && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <PercentileMatrix
            reservoirs={reservoirData}
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            data={percentileData}
            responsive
            labelColumnWidth={140}
            showScenarioHeaders={false}
            displayMode="volume"
            volumeScaleMode={scaleMode}
            colorScheme={displayMode}
            cellStats={cellStats}
            breakdownData={breakdownData}
            breakdownComponents={breakdownComponents}
            loadingScenarios={loadingScenarios}
          />
        </Box>
      )}
    </>
  )
}

// ============================================================================
// Main CWS Section Export
// ============================================================================

interface CwsContentProps {
  scenarios: string[]
  scenarioNames: Record<string, string>
  /** CWS slice of the batched response (keyed by scenario id). */
  cwsBatch: Record<string, BatchCwsData> | undefined
  isBatchLoading: boolean
  /** Sibling-group ids with no variant for the active hydroclimate. */
  missing: string[]
  missingSet: Set<string>
  hydroclimate: string
  /** Whether this is rendered inside the expand modal. */
  isModal?: boolean
}

/**
 * CwsContent - the section body: delivery tier distribution plus the monthly
 * delivery/shortage charts. Rendered both inline and inside the expand
 * MobileModal so the two views stay in sync. Callers supply the outer
 * spacing wrapper.
 */
function CwsContent({
  scenarios,
  scenarioNames,
  cwsBatch,
  isBatchLoading,
  missing,
  missingSet,
  hydroclimate,
  isModal = false,
}: CwsContentProps) {
  const theme = useTheme()
  return (
    <>
      {/* Delivery tier section */}
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
              title="Delivery distribution"
              description="140 community water systems"
            />
          </Box>
          <CwsTierCharts
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            missingSet={missingSet}
            hydroclimate={hydroclimate}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>

      {/* Monthly delivery/shortage section */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: theme.borderRadius.md,
          border: theme.border.light,
          boxShadow: theme.shadow.subtle,
          p: theme.space.component.lg,
        }}
      >
        {missing.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: theme.space.gap.sm,
              mb: theme.space.component.sm,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: theme.palette.grey[600] }}
            >
              Unavailable in this hydroclimate:
            </Typography>
            {missing.map((groupId) => (
              <HydroclimateUnavailablePlaceholder
                key={groupId}
                hydroclimate={hydroclimate}
                groupId={groupId}
                variant="inline"
              />
            ))}
          </Box>
        )}
        <ChartGridProvider scenarios={scenarios}>
          <MonthlyCwsSection
            scenarios={scenarios}
            scenarioNames={scenarioNames}
            cwsBatch={cwsBatch}
            isBatchLoading={isBatchLoading}
            isModal={isModal}
          />
        </ChartGridProvider>
      </Box>
    </>
  )
}

export default function CwsSection({
  scenarios,
  scenarioNames,
  batchData,
  isBatchLoading,
}: BatchSectionProps) {
  const cwsBatch = batchData?.cws

  // Columns whose sibling-group id has no scenario variant for the active
  // hydroclimate. Used to swap the per-column tier glyph for the inline
  // placeholder, and to surface a small "Unavailable" strip above the
  // monthly-deliveries block. Stays empty in production today since every
  // group has all three variants
  const { missing, hydroclimate } = useHydroclimateAvailability(scenarios)
  const missingSet = useMemo(() => new Set(missing), [missing])

  return (
    <ExpandableSection
      scenarios={scenarios}
      scenarioNames={scenarioNames}
      categoryId="community-water"
      title="Community water systems"
      contentAriaLabel="Community water systems data visualization"
      renderBody={(isModal) => (
        <CwsContent
          scenarios={scenarios}
          scenarioNames={scenarioNames}
          cwsBatch={cwsBatch}
          isBatchLoading={isBatchLoading}
          missing={missing}
          missingSet={missingSet}
          hydroclimate={hydroclimate}
          isModal={isModal}
        />
      )}
    />
  )
}
